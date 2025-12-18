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
    if (path.isAbsolute(inputPath)) {
        return path.normalize(inputPath);
    }
    // Resolve relative to the UNIFIED-APP directory (which is 2 levels up from backend/routes)
    return path.join(__dirname, '../../', inputPath);
}

function getMediaType(extension) {
    const videoFormats = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.flv'];
    return videoFormats.includes(extension.toLowerCase()) ? 'video' : 'image';
}

function getGalleryImages(imagesDir) {
    const data = {};
    const absoluteImagesDir = resolvePath(imagesDir);

    try {
        if (!fs.existsSync(absoluteImagesDir)) {
            console.error(`Gallery images directory not found: ${absoluteImagesDir}`);
            return data;
        }

        const rootFiles = fs.readdirSync(absoluteImagesDir)
            .filter(file => {
                const filePath = path.join(absoluteImagesDir, file);
                try {
                    const isFile = fs.statSync(filePath).isFile();
                    return isFile && SUPPORTED_FORMATS.includes(path.extname(file).toLowerCase());
                } catch (e) { return false; }
            })
            .map(file => ({
                name: file,
                path: file,
                format: path.extname(file).toLowerCase().slice(1),
                type: getMediaType(path.extname(file)),
                fullPath: `/api/gallery/images/${encodeURIComponent(file)}`
            }));

        if (rootFiles.length > 0) {
            data['root'] = rootFiles;
        }
        
        const folders = fs.readdirSync(absoluteImagesDir)
            .filter(item => {
                const folderPath = path.join(absoluteImagesDir, item);
                try {
                    return fs.statSync(folderPath).isDirectory();
                } catch (e) { return false; }
            });
        
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
                        fullPath: `/api/gallery/images/${folder}/${encodeURIComponent(file)}`
                    }));
                
                if (files.length > 0) {
                    data[folder] = files;
                }
            } catch (folderError) {
                console.error(`Error reading folder ${folder}:`, folderError);
            }
        });
    } catch (error) {
        console.error('Error reading gallery images:', error);
    }
    return data;
}

function setupGalleryWatcher(imagesDir, wss) {
    const absoluteImagesDir = resolvePath(imagesDir);
    const monitoring = require('../utils/monitoring');
    monitoring.trackFileWatcher(absoluteImagesDir, 'add');
    
    const watcher = chokidar.watch(absoluteImagesDir, {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
            stabilityThreshold: 2000,
            pollInterval: 100
        },
        usePolling: true,
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
    const folder = path.dirname(relativePath).split(path.sep)[0] || 'root';
    
    const message = {
        type: 'IMAGES_UPDATED',
        event: eventType,
        path: relativePath,
        folder: folder
    };
    
    broadcastToGallery(wss, message);
}

function handleFolderChange(eventType, folderPath, imagesDir, wss) {
    const relativePath = path.relative(imagesDir, folderPath);
    if (!relativePath.includes(path.sep)) {
        const message = {
            type: 'FOLDER_UPDATED',
            event: eventType,
            path: relativePath
        };
        
        broadcastToGallery(wss, message);
    }
}

function broadcastToGallery(wss, message) {
    if (!wss || !wss.clients) return;
    
    const monitoring = require('../utils/monitoring');
    let sentCount = 0;
    
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN && client.appType === 'gallery') {
            try {
                client.send(JSON.stringify(message));
                monitoring.trackWebSocketMessage(client, 'sent');
                sentCount++;
            } catch (error) {
                monitoring.logError(error, { context: 'Gallery broadcast', messageType: message.type });
                console.error('Error broadcasting to gallery client:', error);
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
    if (user.networkPaths.gallery) {
        imagesDir = user.networkPaths.gallery;
    } else if (user.networkPaths.main) {
        imagesDir = user.networkPaths.main;
    } else {
        imagesDir = path.join(__dirname, '../../data/content/demo-images');
    }

    try {
        const data = getGalleryImages(imagesDir);
        res.json(data);
    } catch (error) {
        console.error('Error serving gallery images:', error);
        res.status(500).json({ error: 'Failed to fetch images' });
    }
});

router.get('/images/:folder/:filename', (req, res) => {
    const user = req.user;
    const { folder, filename } = req.params;
    
    let imagesDir;
    if (user.networkPaths.gallery) {
        imagesDir = user.networkPaths.gallery;
    } else if (user.networkPaths.main) {
        imagesDir = user.networkPaths.main;
    } else {
        imagesDir = path.join(__dirname, '../../data/content/demo-images');
    }
    
    const absoluteImagesDir = resolvePath(imagesDir);
    let filePath;
    if (folder === 'root') {
        filePath = path.join(absoluteImagesDir, decodeURIComponent(filename));
    } else {
        filePath = path.join(absoluteImagesDir, folder, decodeURIComponent(filename));
    }
    
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('File not found');
    }
});

router.get('/images/:filename', (req, res) => {
    const user = req.user;
    const { filename } = req.params;
    
    let imagesDir;
    if (user.networkPaths.gallery) {
        imagesDir = user.networkPaths.gallery;
    } else if (user.networkPaths.main) {
        imagesDir = user.networkPaths.main;
    } else {
        imagesDir = path.join(__dirname, '../../data/content/demo-images');
    }
    
    const absoluteImagesDir = resolvePath(imagesDir);
    const filePath = path.join(absoluteImagesDir, decodeURIComponent(filename));
    
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('File not found');
    }
});

module.exports = { router, setupGalleryWatcher };
