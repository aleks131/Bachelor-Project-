const express = require('express');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const WebSocket = require('ws');
const config = require('../../data/config.json');

const router = express.Router();
const SUPPORTED_FORMATS = config.supportedFormats.map(f => f.toLowerCase());

// Helper to resolve paths relative to project root if they aren't absolute
function resolvePath(inputPath) {
    if (!inputPath) {
        return path.join(__dirname, '../../data/content/demo-images');
    }
    if (path.isAbsolute(inputPath)) {
        return path.normalize(inputPath);
    }
    // Resolve relative to the UNIFIED-APP directory (which is 2 levels up from backend/routes)
    return path.resolve(path.join(__dirname, '../../', inputPath));
}

function getMediaType(extension) {
    const videoFormats = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.flv'];
    return videoFormats.includes(extension.toLowerCase()) ? 'video' : 'image';
}

function getDailyPlanImages(imagesDir) {
    const data = {};
    const absoluteImagesDir = resolvePath(imagesDir);

    console.log(`[DailyPlan] Requesting images from: ${imagesDir}`);
    console.log(`[DailyPlan] Resolved absolute path: ${absoluteImagesDir}`);

    try {
        if (!fs.existsSync(absoluteImagesDir)) {
            console.error(`[DailyPlan] Directory NOT FOUND: ${absoluteImagesDir}`);
            return data;
        } else {
            console.log(`[DailyPlan] Directory exists.`);
        }

        const folders = fs.readdirSync(absoluteImagesDir)
            .filter(item => {
                const folderPath = path.join(absoluteImagesDir, item);
                return fs.statSync(folderPath).isDirectory();
            });
        
        console.log(`[DailyPlan] Found folders: ${folders.join(', ')}`);

        folders.forEach(folder => {
            const folderPath = path.join(absoluteImagesDir, folder);
            try {
                const files = fs.readdirSync(folderPath)
                    .filter(file => SUPPORTED_FORMATS.includes(
                        path.extname(file).toLowerCase()
                    ))
                    .map(file => ({
                        name: file,
                        path: path.join(folder, file).replace(/\\/g, '/'),
                        format: path.extname(file).toLowerCase().slice(1),
                        type: getMediaType(path.extname(file)),
                        fullPath: `/api/daily-plan/images/${folder}/${encodeURIComponent(file)}`
                    }));
                
                console.log(`[DailyPlan] Folder '${folder}' has ${files.length} valid files.`);

                if (files.length > 0) {
                    data[folder] = files;
                }
            } catch (folderError) {
                console.error(`Error reading folder ${folder}:`, folderError);
            }
        });
    } catch (error) {
        console.error('Error reading daily plan images:', error);
    }
    return data;
}

function setupDailyPlanWatcher(imagesDir, wss) {
    const absoluteImagesDir = resolvePath(imagesDir);
    const monitoring = require('../utils/monitoring');
    monitoring.trackFileWatcher(absoluteImagesDir, 'add');
    
    console.log(`[DailyPlanWatcher] Watching: ${absoluteImagesDir}`);

    const watcher = chokidar.watch(absoluteImagesDir, {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
            stabilityThreshold: 1000,
            pollInterval: 100
        },
        usePolling: false,
        interval: 1000,
        binaryInterval: 3000,
        alwaysStat: true,
        depth: 1,
        ignorePermissionErrors: true
    });

    watcher
        .on('add', filePath => handleFileChange('add', filePath, absoluteImagesDir, wss))
        .on('change', filePath => handleFileChange('change', filePath, absoluteImagesDir, wss))
        .on('unlink', filePath => handleFileChange('unlink', filePath, absoluteImagesDir, wss))
        .on('addDir', folderPath => handleFolderChange('add', folderPath, absoluteImagesDir, wss))
        .on('unlinkDir', folderPath => handleFolderChange('remove', folderPath, absoluteImagesDir, wss));

    return watcher;
}

function handleFileChange(eventType, filePath, imagesDir, wss) {
    const relativePath = path.relative(imagesDir, filePath);
    const folder = path.dirname(relativePath).split(path.sep)[0];
    
    const message = {
        type: 'IMAGES_UPDATED',
        event: eventType,
        path: relativePath,
        folder: folder
    };
    
    broadcastToDailyPlan(wss, message);
}

function handleFolderChange(eventType, folderPath, imagesDir, wss) {
    const relativePath = path.relative(imagesDir, folderPath);
    if (!relativePath.includes(path.sep)) {
        const message = {
            type: 'FOLDER_UPDATED',
            event: eventType,
            path: relativePath
        };
        
        broadcastToDailyPlan(wss, message);
    }
}

function broadcastToDailyPlan(wss, message) {
    if (!wss || !wss.clients) return;
    
    const monitoring = require('../utils/monitoring');
    let sentCount = 0;
    
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN && client.appType === 'daily-plan') {
            try {
                client.send(JSON.stringify(message));
                monitoring.trackWebSocketMessage(client, 'sent');
                sentCount++;
            } catch (error) {
                monitoring.logError(error, { context: 'Daily Plan broadcast', messageType: message.type });
                console.error('Error broadcasting to daily-plan client:', error);
            }
        }
    });
}

router.get('/images', (req, res) => {
    const user = req.user;
    if (!user || !user.networkPaths) {
        return res.status(403).json({ error: 'User network paths not configured' });
    }

    let imagesDir;
    if (user.networkPaths.dailyPlan) {
        imagesDir = user.networkPaths.dailyPlan;
    } else if (user.networkPaths.main) {
        imagesDir = user.networkPaths.main;
    } else {
        imagesDir = path.join(__dirname, '../../data/content/demo-images');
    }

    try {
        const data = getDailyPlanImages(imagesDir);
        res.json(data);
    } catch (error) {
        console.error('Error serving daily plan images:', error);
        res.status(500).json({ error: 'Failed to fetch images' });
    }
});

router.get('/images/:folder/:filename', (req, res) => {
    const user = req.user;
    const { folder, filename } = req.params;
    
    let imagesDir;
    if (user.networkPaths.dailyPlan) {
        imagesDir = user.networkPaths.dailyPlan;
    } else if (user.networkPaths.main) {
        imagesDir = user.networkPaths.main;
    } else {
        imagesDir = path.join(__dirname, '../../data/content/demo-images');
    }
    
    const absoluteImagesDir = resolvePath(imagesDir);
    const filePath = path.join(absoluteImagesDir, folder, decodeURIComponent(filename));
    
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        console.error(`[DailyPlan] File not found: ${filePath}`);
        res.status(404).send('File not found');
    }
});

module.exports = { router, setupDailyPlanWatcher };
