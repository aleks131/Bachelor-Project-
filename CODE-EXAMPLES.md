# Code Examples - Smart Solutions by TripleA

This document provides detailed code examples demonstrating key functionality of the Smart Solutions platform.

## Table of Contents

1. [Backend Examples](#backend-examples)
2. [Frontend Examples](#frontend-examples)
3. [Real-Time Communication](#real-time-communication)
4. [Image Processing](#image-processing)
5. [Authentication](#authentication)
6. [File Management](#file-management)

---

## Backend Examples

### Express.js Server Setup

```javascript
// backend/server.js
const express = require('express');
const http = require('http');
const path = require('path');
const session = require('express-session');
const compression = require('compression');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const PORT = 3000;

// Middleware
app.use(compression()); // Gzip compression
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Session management
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
}));

// Static files
app.use(express.static(path.join(__dirname, '../frontend')));

// WebSocket server
const wss = new WebSocket.Server({ server });

// Start server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
```

### Rate Limiting Implementation

```javascript
// backend/server.js
const rateLimitMap = new Map();

const rateLimit = (maxRequests = 100, windowMs = 60000) => {
    return (req, res, next) => {
        const key = req.ip || req.connection.remoteAddress;
        const now = Date.now();
        
        if (!rateLimitMap.has(key)) {
            rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
            return next();
        }
        
        const record = rateLimitMap.get(key);
        
        if (now > record.resetTime) {
            record.count = 1;
            record.resetTime = now + windowMs;
            return next();
        }
        
        if (record.count >= maxRequests) {
            return res.status(429).json({ 
                error: 'Too many requests, please try again later' 
            });
        }
        
        record.count++;
        next();
    };
};

// Apply rate limiting
app.use('/api/', rateLimit(100, 60000)); // 100 requests per minute
app.use('/api/login', rateLimit(5, 60000)); // 5 login attempts per minute
```

### Authentication Middleware

```javascript
// backend/server.js
const requireAuth = (req, res, next) => {
    let user = null;
    
    // Check session
    if (req.session && req.session.userId) {
        user = auth.getUserById(req.session.userId);
    } 
    // Check JWT token
    else if (req.headers.authorization) {
        const token = req.headers.authorization.replace('Bearer ', '');
        try {
            const decoded = jwtUtils.verifyToken(token);
            user = auth.getUserById(decoded.userId);
        } catch (error) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
    }
    
    if (user) {
        req.user = user;
        return next();
    }
    
    res.status(401).json({ error: 'Authentication required' });
};

// Protected route
app.get('/api/dashboard', requireAuth, (req, res) => {
    res.json({ data: 'Protected data' });
});
```

---

## Frontend Examples

### Dashboard Class Implementation

```javascript
// frontend/scripts/dashboard.js
class Dashboard {
    constructor() {
        this.apps = [];
        this.user = null;
        this.init();
    }
    
    async init() {
        await this.loadUser();
        await this.loadApps();
        this.setupEventListeners();
        this.renderApps();
    }
    
    async loadUser() {
        try {
            const response = await fetch('/api/current-user', {
                credentials: 'include'
            });
            const data = await response.json();
            this.user = data.user;
            this.displayUserInfo();
        } catch (error) {
            console.error('Error loading user:', error);
            window.location.href = '/';
        }
    }
    
    async loadApps() {
        try {
            const response = await fetch('/api/config', {
                credentials: 'include'
            });
            const data = await response.json();
            this.apps = Object.keys(data.apps).map(key => ({
                id: key,
                ...data.apps[key],
                enabled: data.user.allowedApps.includes(key)
            }));
        } catch (error) {
            console.error('Error loading apps:', error);
        }
    }
    
    renderApps() {
        const grid = document.getElementById('appsGrid');
        grid.innerHTML = '';
        
        this.apps
            .filter(app => app.enabled)
            .forEach(app => {
                const card = this.createAppCard(app);
                grid.appendChild(card);
            });
    }
    
    createAppCard(app) {
        const card = document.createElement('div');
        card.className = 'app-card';
        card.innerHTML = `
            <div class="app-icon">${app.icon}</div>
            <h2 class="app-title">${app.name}</h2>
            <p class="app-description">${app.description}</p>
            <button class="premium-button" onclick="window.location.href='/app/${app.id}'">
                Open Application
            </button>
        `;
        return card;
    }
    
    setupEventListeners() {
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });
    }
    
    async logout() {
        try {
            await fetch('/api/logout', {
                method: 'POST',
                credentials: 'include'
            });
            window.location.href = '/';
        } catch (error) {
            console.error('Logout error:', error);
        }
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
});
```

### Theme Manager Implementation

```javascript
// frontend/scripts/theme-manager.js
class ThemeManager {
    constructor() {
        this.theme = localStorage.getItem('theme') || 'light';
        this.init();
    }
    
    init() {
        document.documentElement.setAttribute('data-theme', this.theme);
        this.updateToggleButton();
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)')
            .addEventListener('change', e => {
                if (!localStorage.getItem('theme')) {
                    this.setTheme(e.matches ? 'dark' : 'light');
                }
            });
        
        // Setup toggle button
        const toggleBtn = document.getElementById('themeToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleTheme());
        }
    }
    
    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        this.setTheme(this.theme);
    }
    
    setTheme(theme) {
        this.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        this.updateToggleButton();
        
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme } 
        }));
    }
    
    updateToggleButton() {
        const toggleBtn = document.getElementById('themeToggle');
        if (!toggleBtn) return;
        
        toggleBtn.setAttribute('aria-label', 
            `Switch to ${this.theme === 'light' ? 'dark' : 'light'} mode`);
    }
}

// Initialize theme manager
const themeManager = new ThemeManager();
window.themeManager = themeManager;
```

---

## Real-Time Communication

### WebSocket Client Implementation

```javascript
// frontend/scripts/daily-plan.js
class DailyPlanViewer {
    constructor() {
        this.ws = null;
        this.currentSchedule = null;
        this.connectWebSocket();
        this.startScheduleCheck();
    }
    
    connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/daily-plan`;
        
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
            console.log('WebSocket connected');
        };
        
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleWebSocketMessage(data);
        };
        
        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
        
        this.ws.onclose = () => {
            console.log('WebSocket disconnected, reconnecting...');
            setTimeout(() => this.connectWebSocket(), 3000);
        };
    }
    
    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'file_changed':
                this.refreshSchedule();
                break;
            case 'schedule_update':
                this.updateSchedule(data.schedule);
                break;
            case 'ping':
                this.ws.send(JSON.stringify({ type: 'pong' }));
                break;
        }
    }
    
    async refreshSchedule() {
        const schedule = this.getCurrentSchedule();
        if (schedule !== this.currentSchedule) {
            this.currentSchedule = schedule;
            await this.loadSchedule(schedule);
        }
    }
    
    getCurrentSchedule() {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const time = hours * 60 + minutes;
        
        if (time >= 390 && time < 869) return 'Morning';
        if (time >= 870 && time < 1349) return 'Evening';
        return 'Night';
    }
    
    async loadSchedule(schedule) {
        try {
            const response = await fetch(`/api/daily-plan/schedule/${schedule}`, {
                credentials: 'include'
            });
            const data = await response.json();
            this.displaySchedule(data.imagePath);
        } catch (error) {
            console.error('Error loading schedule:', error);
        }
    }
}
```

### WebSocket Server Implementation

```javascript
// backend/server.js
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;
    
    // Determine app type
    let appType = null;
    if (pathname.includes('/daily-plan')) appType = 'daily-plan';
    else if (pathname.includes('/gallery')) appType = 'gallery';
    else if (pathname.includes('/dashboard')) appType = 'dashboard';
    
    ws.appType = appType;
    ws.id = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Send connection confirmation
    ws.send(JSON.stringify({ 
        type: 'status', 
        status: 'connected',
        appType: appType
    }));
    
    // Keep-alive ping
    const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
        } else {
            clearInterval(pingInterval);
        }
    }, 30000);
    
    // Handle messages
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            if (data.type === 'pong') {
                // Update last activity
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });
    
    // Handle disconnect
    ws.on('close', () => {
        clearInterval(pingInterval);
        console.log(`WebSocket disconnected: ${ws.id}`);
    });
});

// Broadcast function
function broadcastToClients(appType, data) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN && client.appType === appType) {
            client.send(JSON.stringify(data));
        }
    });
}
```

---

## Image Processing

### Image Optimization with Sharp

```javascript
// backend/utils/image-processor.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

class ImageProcessor {
    constructor() {
        this.cacheDir = path.join(__dirname, '../../data/image-cache');
        this.thumbnailDir = path.join(__dirname, '../../data/thumbnails');
        this.ensureDirectories();
    }
    
    ensureDirectories() {
        [this.cacheDir, this.thumbnailDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }
    
    async optimizeImage(inputPath, maxDimension = 1920, quality = 85) {
        const cacheKey = this.generateCacheKey(inputPath, maxDimension, quality);
        const outputPath = path.join(this.cacheDir, cacheKey);
        
        // Return cached if exists
        if (fs.existsSync(outputPath)) {
            return outputPath;
        }
        
        // Process image
        await sharp(inputPath)
            .resize(maxDimension, maxDimension, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .webp({ quality })
            .toFile(outputPath);
        
        return outputPath;
    }
    
    async generateThumbnail(inputPath, size = 200) {
        const cacheKey = this.generateCacheKey(inputPath, size);
        const outputPath = path.join(this.thumbnailDir, cacheKey);
        
        if (fs.existsSync(outputPath)) {
            return outputPath;
        }
        
        await sharp(inputPath)
            .resize(size, size, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .webp({ quality: 80 })
            .toFile(outputPath);
        
        return outputPath;
    }
    
    generateCacheKey(inputPath, ...params) {
        const stats = fs.statSync(inputPath);
        const key = `${path.basename(inputPath)}_${stats.mtime.getTime()}_${params.join('_')}`;
        return key.replace(/[^a-zA-Z0-9._-]/g, '_') + '.webp';
    }
}

module.exports = new ImageProcessor();
```

### Image Route Handler

```javascript
// backend/routes/image-intelligence.js
const express = require('express');
const router = express.Router();
const imageProcessor = require('../utils/image-processor');
const path = require('path');

router.get('/optimized/:path(*)', async (req, res) => {
    try {
        const imagePath = decodeURIComponent(req.params.path);
        const screenWidth = parseInt(req.query.width) || 1920;
        
        // Validate path (security check)
        if (!isValidPath(imagePath)) {
            return res.status(400).json({ error: 'Invalid path' });
        }
        
        // Check if file exists
        if (!fs.existsSync(imagePath)) {
            return res.status(404).json({ error: 'Image not found' });
        }
        
        // Optimize image
        const optimizedPath = await imageProcessor.optimizeImage(
            imagePath, 
            screenWidth
        );
        
        res.sendFile(path.resolve(optimizedPath));
    } catch (error) {
        console.error('Image optimization error:', error);
        res.status(500).json({ error: 'Failed to optimize image' });
    }
});

router.get('/thumbnail/:path(*)', async (req, res) => {
    try {
        const imagePath = decodeURIComponent(req.params.path);
        const size = parseInt(req.query.size) || 200;
        
        const thumbnailPath = await imageProcessor.generateThumbnail(
            imagePath, 
            size
        );
        
        res.sendFile(path.resolve(thumbnailPath));
    } catch (error) {
        console.error('Thumbnail generation error:', error);
        res.status(500).json({ error: 'Failed to generate thumbnail' });
    }
});
```

---

## Authentication

### Password Hashing

```javascript
// backend/auth.js
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

class Auth {
    constructor() {
        this.usersFile = path.join(__dirname, '../data/users.json');
        this.loadUsers();
    }
    
    loadUsers() {
        if (fs.existsSync(this.usersFile)) {
            const data = fs.readFileSync(this.usersFile, 'utf8');
            this.users = JSON.parse(data);
        } else {
            this.users = [];
            this.saveUsers();
        }
    }
    
    saveUsers() {
        fs.writeFileSync(
            this.usersFile, 
            JSON.stringify(this.users, null, 2)
        );
    }
    
    async hashPassword(password) {
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
    }
    
    async verifyPassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }
    
    async authenticateUser(username, password) {
        const user = this.users.find(u => u.username === username);
        
        if (!user) {
            return { success: false, message: 'Invalid credentials' };
        }
        
        const isValid = await this.verifyPassword(password, user.password);
        
        if (!isValid) {
            return { success: false, message: 'Invalid credentials' };
        }
        
        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;
        
        return { 
            success: true, 
            user: userWithoutPassword 
        };
    }
    
    getUserById(id) {
        const user = this.users.find(u => u.id === id);
        if (user) {
            const { password: _, ...userWithoutPassword } = user;
            return userWithoutPassword;
        }
        return null;
    }
}

module.exports = new Auth();
```

---

## File Management

### File Operations

```javascript
// backend/routes/file-management.js
const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

router.post('/copy', async (req, res) => {
    try {
        const { source, destination } = req.body;
        
        // Validate paths
        if (!isValidPath(source) || !isValidPath(destination)) {
            return res.status(400).json({ error: 'Invalid path' });
        }
        
        await fs.copyFile(source, destination);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/move', async (req, res) => {
    try {
        const { source, destination } = req.body;
        
        await fs.rename(source, destination);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/delete', async (req, res) => {
    try {
        const { path: filePath } = req.body;
        const stats = await fs.stat(filePath);
        
        if (stats.isDirectory()) {
            await fs.rmdir(filePath, { recursive: true });
        } else {
            await fs.unlink(filePath);
        }
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/create-folder', async (req, res) => {
    try {
        const { path: folderPath } = req.body;
        await fs.mkdir(folderPath, { recursive: true });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

---

These code examples demonstrate the key technical implementations of the Smart Solutions platform, showcasing the architecture, real-time communication, image processing, authentication, and file management capabilities.

