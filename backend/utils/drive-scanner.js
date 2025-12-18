const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');
const logger = require('./logger');

class DriveScanner extends EventEmitter {
    constructor() {
        super();
        this.drives = new Set();
        this.scanInterval = 5000; // Scan every 5 seconds
        this.intervalId = null;
        this.platform = process.platform;
    }

    start() {
        if (this.intervalId) return;
        
        logger.info('Starting Drive Scanner Service...');
        this.scan(); // Initial scan
        this.intervalId = setInterval(() => this.scan(), this.scanInterval);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    async scan() {
        try {
            const currentDrives = await this.getDrives();
            
            // Check for new drives
            for (const drive of currentDrives) {
                if (!this.drives.has(drive)) {
                    this.drives.add(drive);
                    this.emit('driveAttached', drive);
                    logger.info(`New drive detected: ${drive}`);
                }
            }

            // Check for removed drives
            for (const drive of this.drives) {
                if (!currentDrives.includes(drive)) {
                    this.drives.delete(drive);
                    this.emit('driveRemoved', drive);
                    logger.info(`Drive removed: ${drive}`);
                }
            }
        } catch (error) {
            logger.error('Error scanning drives:', error);
        }
    }

    async getDrives() {
        const drives = [];

        if (this.platform === 'win32') {
            // Check drive letters D through Z (skipping A, B, C usually)
            const letters = 'DEFGHIJKLMNOPQRSTUVWXYZ'.split('');
            
            for (const letter of letters) {
                const drivePath = `${letter}:\\`;
                try {
                    // Check if accessible
                    await fs.promises.access(drivePath, fs.constants.R_OK);
                    drives.push(drivePath);
                } catch (err) {
                    // Drive not available, ignore
                }
            }
        } else if (this.platform === 'linux' || this.platform === 'darwin') {
            // Basic check for /media or /mnt (simplified for now)
            const mountPoints = ['/media', '/mnt', '/Volumes'];
            
            for (const mount of mountPoints) {
                if (fs.existsSync(mount)) {
                    try {
                        const contents = await fs.promises.readdir(mount);
                        for (const item of contents) {
                            const fullPath = path.join(mount, item);
                            drives.push(fullPath);
                        }
                    } catch (err) {
                        // Permission denied or other error
                    }
                }
            }
        }

        return drives;
    }
}

module.exports = new DriveScanner();

