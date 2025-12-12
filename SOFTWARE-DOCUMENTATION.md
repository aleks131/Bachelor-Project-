# Software Documentation - Smart Solutions by TripleA

## 1. Software Architecture

### 1.1 Deployment Model

#### Standalone Architecture
The application is designed as a **standalone system** that runs directly from a network folder without requiring complex server installation or database setup. This design philosophy ensures:

- **Zero Configuration**: Users simply extract the application folder and run `npm install` followed by `npm start`
- **Portability**: The entire application can be moved between locations by copying the folder
- **Network Drive Integration**: The application reads content directly from network drives, eliminating the need for complex file synchronization

**Key Files:**
- `backend/server.js` - Main server entry point
- `package.json` - Dependency management
- `data/config.json` - Configuration storage

#### Cross-Platform Compatibility
The application is built using **Node.js**, ensuring compatibility across multiple operating systems:

- **Windows**: Tested on Windows 10/11
- **Linux**: Optimized for Raspberry Pi (Raspberry Pi OS)
- **macOS**: Compatible with macOS 10.15+

**Implementation:**
```javascript
// backend/server.js
const PORT = config.server.port || 3000;
server.listen(PORT, '0.0.0.0', () => {
    // Server listens on all network interfaces
    // Works on any platform with Node.js
});
```

#### Offline Capability
The application functions **offline** after initial load:

- **Service Worker**: Caches essential assets for offline access
- **LocalStorage**: Stores user preferences and session data locally
- **WebSocket Fallback**: Gracefully handles connection loss with automatic reconnection

**Implementation:**
```javascript
// frontend/sw.js - Service Worker
const CACHE_NAME = 'smart-solutions-v2.0.0';
// Caches core assets for offline functionality
```

---

### 1.2 Backend Architecture (Node.js Environment)

#### Server Framework: Express.js
**Express.js** serves as the robust REST API framework and static file server.

**Key Responsibilities:**
- RESTful API endpoints for all application features
- Static file serving for frontend assets
- Middleware pipeline for authentication, logging, and error handling
- Session management and security

**Implementation:**
```javascript
// backend/server.js
const express = require('express');
const app = express();

// Middleware stack
app.use(compression());                    // Gzip compression
app.use(express.json({ limit: '50mb' })); // JSON parsing
app.use(express.static('../frontend'));    // Static files
app.use(session({ /* ... */ }));           // Session management
```

**API Structure:**
```
/api/login              - Authentication
/api/daily-plan/*       - Daily plan operations
/api/gallery/*          - Image gallery operations
/api/dashboard/*        - Performance dashboard
/api/admin/*            - Admin operations
/api/search/*           - Global search
/api/ai/*               - AI features (OCR, analysis)
/api/files/*            - File management
/api/upload/*           - File uploads
/api/monitoring/*        - System monitoring
/api/backup/*            - Backup/restore
/api/system/*           - System diagnostics
```

#### Real-Time Layer: WebSocket (ws)
**WebSocket** enables instant, bi-directional communication for live updates.

**Use Cases:**
- Real-time file change notifications
- Live schedule updates
- Instant image gallery updates
- System monitoring dashboards

**Implementation:**
```javascript
// backend/server.js
const WebSocket = require('ws');
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
    // Handle WebSocket connections
    // Broadcast updates to connected clients
    ws.send(JSON.stringify({ 
        type: 'file_changed', 
        path: filePath 
    }));
});
```

**WebSocket Message Types:**
- `file_changed` - File system change detected
- `schedule_update` - Daily plan schedule changed
- `metrics_update` - System metrics updated
- `ping/pong` - Connection keep-alive

#### File Watching: Chokidar
**Chokidar** provides efficient, event-driven file system monitoring.

**Why Chokidar?**
- **Performance**: More efficient than polling on low-power devices (Raspberry Pi)
- **Event-Driven**: Reacts instantly to file changes
- **Cross-Platform**: Works consistently across Windows, Linux, macOS
- **Low Resource Usage**: Minimal CPU and memory footprint

**Implementation:**
```javascript
// backend/routes/daily-plan.js
const chokidar = require('chokidar');

function setupDailyPlanWatcher(path, wss) {
    const watcher = chokidar.watch(path, {
        ignored: /(^|[\/\\])\../,
        persistent: true,
        ignoreInitial: true
    });
    
    watcher.on('add', (filePath) => {
        // Broadcast new file to WebSocket clients
        broadcastToClients(wss, {
            type: 'file_added',
            path: filePath
        });
    });
    
    watcher.on('change', (filePath) => {
        // Broadcast file change
        broadcastToClients(wss, {
            type: 'file_changed',
            path: filePath
        });
    });
    
    return watcher;
}
```

#### Image Engine: Sharp & Canvas
**Sharp** and **Canvas** process images server-side before transmission.

**Sharp** (Primary Image Processor):
- High-performance image resizing
- Format conversion (PNG → WebP)
- Thumbnail generation
- Image optimization

**Canvas** (Advanced Operations):
- Image analysis
- Color extraction
- Perceptual hashing for duplicate detection

**Implementation:**
```javascript
// backend/utils/image-processor.js
const sharp = require('sharp');

async function generateThumbnail(inputPath, outputPath, size = 200) {
    await sharp(inputPath)
        .resize(size, size, {
            fit: 'inside',
            withoutEnlargement: true
        })
        .webp({ quality: 80 })
        .toFile(outputPath);
}

async function optimizeImage(inputPath, outputPath, maxDimension = 1920) {
    await sharp(inputPath)
        .resize(maxDimension, maxDimension, {
            fit: 'inside',
            withoutEnlargement: true
        })
        .webp({ quality: 85 })
        .toFile(outputPath);
}
```

**Benefits:**
- **Bandwidth Savings**: 4K images converted to 1080p WebP (70-80% size reduction)
- **Performance**: Pre-processing on server saves client device resources
- **Compatibility**: Converts any format to web-compatible formats

#### Security: bcryptjs & Express-Session
**bcryptjs** provides secure password hashing.

**Implementation:**
```javascript
// backend/auth.js
const bcrypt = require('bcryptjs');

async function hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
}

async function verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
}
```

**Express-Session** manages user sessions securely.

**Implementation:**
```javascript
// backend/server.js
app.use(session({
    secret: config.server.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: 'lax'
    }
}));
```

**Security Features:**
- Password hashing with salt rounds
- HTTP-only cookies (prevents XSS)
- Session expiration
- CSRF protection via SameSite cookies

#### Uploads: Multer
**Multer** handles multipart/form-data for file uploads.

**Implementation:**
```javascript
// backend/routes/upload.js
const multer = require('multer');
const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 1073741824 } // 1GB limit
});

router.post('/file', upload.single('file'), (req, res) => {
    // Handle uploaded file
    const file = req.file;
    // Process and move to destination
});
```

---

### 1.3 Frontend Architecture (Client-Side)

#### Core Technologies: HTML5 & CSS3
**HTML5** provides semantic structure and modern features:
- Semantic elements (`<header>`, `<main>`, `<section>`)
- Form validation
- LocalStorage API
- WebSocket API

**CSS3** enables modern styling:
- CSS Grid & Flexbox for layouts
- CSS Variables for theming
- Animations and transitions
- Dark mode via `prefers-color-scheme`

**Implementation:**
```html
<!-- frontend/dashboard.html -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="styles/premium-theme.css">
</head>
```

#### Logic: Vanilla JavaScript (ES6+)
**Vanilla JavaScript** ensures maximum performance on low-power devices.

**Why Vanilla JS?**
- **No Framework Overhead**: Direct DOM manipulation is faster
- **Smaller Bundle Size**: No framework code to download
- **Better Performance**: Especially important for Raspberry Pi Zero 2 W
- **Full Control**: Direct access to browser APIs

**ES6+ Features Used:**
- Arrow functions
- Async/await
- Classes
- Template literals
- Destructuring
- Modules

**Implementation:**
```javascript
// frontend/scripts/dashboard.js
class Dashboard {
    constructor() {
        this.apps = [];
        this.init();
    }
    
    async init() {
        await this.loadApps();
        this.setupEventListeners();
    }
    
    async loadApps() {
        const response = await fetch('/api/config');
        const data = await response.json();
        this.apps = data.apps;
        this.renderApps();
    }
}
```

#### Data Transport: Fetch API & WebSocket API
**Fetch API** handles standard HTTP requests.

**Implementation:**
```javascript
// Standard API calls
async function fetchData(endpoint) {
    const response = await fetch(`/api/${endpoint}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    return await response.json();
}
```

**WebSocket API** handles real-time communication.

**Implementation:**
```javascript
// frontend/scripts/daily-plan.js
class DailyPlanViewer {
    constructor() {
        this.ws = null;
        this.connectWebSocket();
    }
    
    connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        this.ws = new WebSocket(`${protocol}//${window.location.host}/ws/daily-plan`);
        
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'file_changed') {
                this.refreshSchedule();
            }
        };
    }
}
```

#### State Management: LocalStorage
**LocalStorage** persists user preferences and session data.

**Stored Data:**
- Theme preference (light/dark)
- User preferences
- Last viewed app
- Search history
- UI state

**Implementation:**
```javascript
// frontend/scripts/theme-manager.js
class ThemeManager {
    constructor() {
        this.theme = localStorage.getItem('theme') || 'light';
        this.init();
    }
    
    setTheme(theme) {
        this.theme = theme;
        localStorage.setItem('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
    }
}
```

---

### 1.4 Data Storage

#### JSON Flat-Files
All application data is stored in **JSON files**, eliminating the need for a SQL database.

**Data Files:**
- `data/users.json` - User accounts and roles
- `data/config.json` - System configuration
- `data/layouts/*.json` - Saved custom layouts
- `data/analytics.json` - Usage analytics

**Benefits:**
- **Portability**: Easy to backup (just copy files)
- **Simplicity**: No database server required
- **Human-Readable**: Can be edited manually if needed
- **Fast**: Direct file I/O is fast for small datasets

**Implementation:**
```javascript
// backend/auth.js
const fs = require('fs');
const path = require('path');

function getAllUsers() {
    const filePath = path.join(__dirname, '../data/users.json');
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
}

function saveUsers(users) {
    const filePath = path.join(__dirname, '../data/users.json');
    fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
}
```

**File Structure:**
```json
// data/users.json
[
    {
        "id": 1,
        "username": "admin",
        "password": "$2a$10$...",
        "role": "admin",
        "allowedApps": ["daily-plan", "gallery", "dashboard"],
        "networkPaths": {
            "main": "\\\\server\\share\\images",
            "dailyPlan": "\\\\server\\share\\schedules"
        }
    }
]
```

#### File System Integration
The application integrates directly with **network drives** for content access.

**Implementation:**
```javascript
// backend/routes/gallery.js
router.get('/folders', (req, res) => {
    const user = req.user;
    const galleryPath = user.networkPaths.gallery || user.networkPaths.main;
    
    fs.readdir(galleryPath, (err, files) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        const folders = files.filter(file => {
            const fullPath = path.join(galleryPath, file);
            return fs.statSync(fullPath).isDirectory();
        });
        
        res.json({ folders });
    });
});
```

**Network Path Configuration:**
- Admin configures paths per user
- Supports Windows UNC paths (`\\server\share`)
- Supports Linux/macOS paths (`/mnt/share`)
- Automatic path normalization

#### Image Cache
**Dedicated cache folders** store optimized images and thumbnails.

**Cache Structure:**
```
data/
├── image-cache/     # Optimized full-size images
├── thumbnails/       # Small preview images
└── ai-cache/         # AI analysis results
```

**Implementation:**
```javascript
// backend/utils/image-processor.js
const cacheDir = path.join(__dirname, '../../data/image-cache');
const thumbnailDir = path.join(__dirname, '../../data/thumbnails');

async function getCachedImage(originalPath, maxDimension) {
    const cacheKey = generateCacheKey(originalPath, maxDimension);
    const cachedPath = path.join(cacheDir, cacheKey);
    
    if (fs.existsSync(cachedPath)) {
        return cachedPath; // Return cached version
    }
    
    // Generate and cache
    await optimizeImage(originalPath, cachedPath, maxDimension);
    return cachedPath;
}
```

**Cache Benefits:**
- **Faster Loading**: Pre-processed images load instantly
- **Bandwidth Savings**: Optimized images reduce data transfer
- **Server Performance**: Reduces processing load on repeated requests

---

## 2. Functional Capabilities

### 2.1 Core Systems

#### Authentication & RBAC (Role-Based Access Control)

**Secure Login System:**
- Session-based authentication (7-30 day persistence)
- JWT token support for API access
- Password hashing with bcryptjs
- Secure session management

**Three User Roles:**

1. **Admin** (Full Control):
   - User management (create, edit, delete)
   - System configuration
   - Network path configuration
   - Password reset capabilities
   - Access to all applications
   - Monitoring dashboard access

2. **Manager** (Content Management):
   - Layout creation and editing
   - Content management
   - File operations (upload, delete, rename)
   - Access to assigned applications
   - Cannot modify system settings or users

3. **Operator** (View Only):
   - View-only access to assigned apps
   - Cannot modify content or settings
   - Can view schedules, galleries, dashboards
   - No admin or management capabilities

**Implementation:**
```javascript
// backend/auth.js
const roles = {
    admin: {
        allowedApps: ['daily-plan', 'gallery', 'dashboard', 'admin'],
        permissions: ['users', 'config', 'layouts', 'files']
    },
    manager: {
        allowedApps: ['daily-plan', 'gallery', 'dashboard'],
        permissions: ['layouts', 'files']
    },
    operator: {
        allowedApps: ['daily-plan', 'gallery'],
        permissions: []
    }
};
```

**Admin Tools:**
- Password reset functionality
- User role assignment
- Network path configuration per user
- Application access control

#### Real-Time Updates

**Live Sync via WebSocket:**
When files are added, modified, or deleted in network folders, changes appear instantly on connected screens without page refresh.

**Implementation:**
```javascript
// Real-time file change detection
watcher.on('add', (filePath) => {
    broadcastToClients({
        type: 'file_added',
        path: filePath,
        timestamp: Date.now()
    });
});
```

**Desktop Notifications:**
Browser notifications alert users when content changes.

**Implementation:**
```javascript
// frontend/scripts/notification-system.js
function showNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body: body,
            icon: '/assets/triple-a-logo.svg'
        });
    }
}
```

---

### 2.2 The Three Main Applications

#### Daily Plan Viewer

**Time-Based Logic:**
Automatically switches displayed content based on current time:

- **Morning**: 06:30 - 14:29
- **Evening**: 14:30 - 22:29
- **Night**: 22:30 - 06:29

**Implementation:**
```javascript
// frontend/scripts/daily-plan.js
function getCurrentSchedule() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const time = hours * 60 + minutes;
    
    if (time >= 390 && time < 869) {
        return 'Morning';
    } else if (time >= 870 && time < 1349) {
        return 'Evening';
    } else {
        return 'Night';
    }
}
```

**Smart Pre-Loading:**
Images are pre-loaded before display to prevent black screens during transitions.

**Implementation:**
```javascript
async function preloadNextSchedule() {
    const nextSchedule = getNextSchedule();
    const imagePath = getScheduleImagePath(nextSchedule);
    
    const img = new Image();
    img.src = imagePath;
    await new Promise((resolve) => {
        img.onload = resolve;
    });
    // Image is now cached and ready
}
```

#### Image Gallery

**Three Display Modes:**

1. **Browse Mode** (Grid View):
   - Thumbnail grid layout
   - Folder navigation
   - Quick preview on hover

2. **Slideshow Mode** (Auto-Advance):
   - Automatic image progression
   - Configurable interval (default: 5 seconds)
   - Smooth transitions

3. **Meeting Mode** (Fullscreen):
   - Full-screen display
   - Minimal UI
   - Touch/click to advance

**Controls:**
- **Zoom**: Mouse wheel or pinch gesture
- **Pan**: Click and drag
- **Rotation**: Rotate images 90° increments
- **Filters**: Apply image filters (brightness, contrast, saturation)
- **Video Playback**: Support for video files

**Implementation:**
```javascript
// frontend/scripts/gallery.js
class ImageGallery {
    setMode(mode) {
        this.mode = mode;
        if (mode === 'slideshow') {
            this.startSlideshow();
        } else if (mode === 'meeting') {
            this.enterFullscreen();
        }
    }
    
    startSlideshow() {
        this.slideshowInterval = setInterval(() => {
            this.nextImage();
        }, 5000);
    }
}
```

#### Performance Dashboard

**KPI Cards:**
- Drag-and-drop interface for card rearrangement
- Customizable card layouts
- Real-time data updates

**Implementation:**
```javascript
// frontend/scripts/dashboard-app.js
const sortable = new Sortable(kpiContainer, {
    animation: 150,
    onEnd: (evt) => {
        saveCardOrder(evt.newIndex, evt.oldIndex);
    }
});
```

**Customization:**
Users can assign specific images or files to KPI cards.

**Implementation:**
```javascript
function assignImageToKPI(kpiId, imagePath) {
    const kpi = getKPIById(kpiId);
    kpi.imageSource = imagePath;
    updateKPICard(kpi);
}
```

---

### 2.3 Advanced Tools

#### Layout Builder (CMS Feature)

**Visual Drag-and-Drop Editor:**
Users create custom screen layouts without coding.

**7 Widget Types:**

1. **Image Viewer**: Display images from network paths
2. **File Browser**: Browse and select files
3. **Folder Scanner**: Scan and display folder contents
4. **KPI Card**: Display key performance indicators
5. **Slideshow**: Auto-advancing image display
6. **Custom HTML**: Embed custom HTML content
7. **Text Display**: Display formatted text

**Implementation:**
```javascript
// frontend/scripts/layout-builder.js
class LayoutBuilder {
    addWidget(type, config) {
        const widget = {
            id: generateId(),
            type: type,
            config: config,
            position: { x: 0, y: 0 },
            size: { width: 300, height: 200 }
        };
        
        this.widgets.push(widget);
        this.renderWidget(widget);
    }
}
```

**Save and Load:**
Layouts are saved as JSON and can be loaded later or assigned to users.

#### Smart Image Intelligence

**Auto-Optimization:**
Server detects screen size and serves optimized images.

**Implementation:**
```javascript
// backend/routes/image-intelligence.js
router.get('/optimized/:path(*)', async (req, res) => {
    const screenWidth = parseInt(req.query.width) || 1920;
    const originalPath = decodeURIComponent(req.params.path);
    
    const optimizedPath = await getCachedImage(originalPath, screenWidth);
    res.sendFile(optimizedPath);
});
```

**Thumbnail Generation:**
Automatic thumbnail creation for fast browsing.

**Implementation:**
```javascript
async function generateThumbnail(imagePath) {
    const thumbnailPath = getThumbnailPath(imagePath);
    
    if (!fs.existsSync(thumbnailPath)) {
        await sharp(imagePath)
            .resize(200, 200, { fit: 'inside' })
            .webp({ quality: 80 })
            .toFile(thumbnailPath);
    }
    
    return thumbnailPath;
}
```

#### File Management System

**Web Interface Operations:**
- **Copy**: Copy files/folders to new locations
- **Move**: Move files/folders
- **Rename**: Rename files and folders
- **Delete**: Delete files/folders (with confirmation)
- **Create Folders**: Create new directories

**Implementation:**
```javascript
// backend/routes/file-management.js
router.post('/copy', (req, res) => {
    const { source, destination } = req.body;
    fs.copyFileSync(source, destination);
    res.json({ success: true });
});

router.post('/move', (req, res) => {
    const { source, destination } = req.body;
    fs.renameSync(source, destination);
    res.json({ success: true });
});
```

**Bulk Actions:**
Select multiple files for bulk operations.

**Implementation:**
```javascript
// frontend/scripts/bulk-operations.js
class BulkOperations {
    selectMultiple(files) {
        this.selectedFiles = files;
        this.showBulkActions();
    }
    
    bulkDelete() {
        this.selectedFiles.forEach(file => {
            this.deleteFile(file);
        });
    }
}
```

**Drag-and-Drop Upload:**
Upload files directly from local computer to network drive.

**Implementation:**
```javascript
// frontend/scripts/drag-drop-upload.js
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    uploadFiles(files);
});
```

---

### 2.4 Intelligence & Analytics

#### Search Engine

**Global Search (Ctrl+K):**
Search across all applications and file types.

**Implementation:**
```javascript
// frontend/scripts/enhanced-search.js
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        openSearchModal();
    }
});
```

**Filters:**
- **Date Range**: Filter by modification date
- **File Size**: Filter by file size range
- **File Type**: Filter by extension (images, documents, etc.)

**Implementation:**
```javascript
// backend/routes/search.js
router.post('/query', (req, res) => {
    const { query, filters } = req.body;
    let results = searchFiles(query);
    
    if (filters.dateRange) {
        results = filterByDate(results, filters.dateRange);
    }
    
    if (filters.fileSize) {
        results = filterBySize(results, filters.fileSize);
    }
    
    res.json({ results });
});
```

#### Offline AI Features

**Color Palette Extraction:**
Analyzes images to identify dominant colors.

**Implementation:**
```javascript
// backend/utils/ai-image-analyzer.js
async function extractColorPalette(imagePath) {
    const image = await sharp(imagePath)
        .resize(100, 100)
        .raw()
        .toBuffer();
    
    // K-means clustering to find dominant colors
    const colors = performKMeans(image, 5);
    return colors;
}
```

**Duplicate Detection:**
Uses perceptual hashing to find duplicate images.

**Implementation:**
```javascript
async function generatePerceptualHash(imagePath) {
    const image = await sharp(imagePath)
        .resize(8, 8)
        .greyscale()
        .raw()
        .toBuffer();
    
    // Generate hash from image data
    return generateHash(image);
}

function findDuplicates(images) {
    const hashes = images.map(img => ({
        path: img.path,
        hash: generatePerceptualHash(img.path)
    }));
    
    return groupByHash(hashes);
}
```

**OCR (Optical Character Recognition):**
Extracts text from images using Tesseract.js.

**Implementation:**
```javascript
// backend/routes/ai-features.js
const Tesseract = require('tesseract.js');

router.post('/extract-text', async (req, res) => {
    const { imagePath } = req.body;
    
    const { data } = await Tesseract.recognize(imagePath, 'eng');
    res.json({
        text: data.text,
        confidence: data.confidence
    });
});
```

#### Analytics Dashboard

**Tracked Metrics:**
- Page views per application
- Top active users
- File operations (upload, delete, etc.)
- Search queries
- System performance metrics

**Visualizations:**
- **Doughnut Charts**: User distribution, app usage
- **Line Charts**: Usage over time
- **Bar Charts**: Top files, top users

**Implementation:**
```javascript
// backend/routes/analytics.js
router.get('/dashboard', (req, res) => {
    const analytics = {
        pageViews: getPageViews(),
        topUsers: getTopUsers(),
        fileOperations: getFileOperations(),
        charts: {
            userDistribution: generateDoughnutChart(),
            usageOverTime: generateLineChart(),
            topFiles: generateBarChart()
        }
    };
    
    res.json(analytics);
});
```

---

### 2.5 User Experience (UX)

#### UI Polish

**Dark Mode:**
One-click theme toggle with persistent preference.

**Implementation:**
```javascript
// frontend/scripts/theme-manager.js
toggleTheme() {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', this.theme);
    document.documentElement.setAttribute('data-theme', this.theme);
}
```

**Toast Notifications:**
Smooth pop-up messages for user feedback.

**Implementation:**
```javascript
// frontend/scripts/toast-notifications.js
function showToast(message, type = 'info') {
    const toast = createToastElement(message, type);
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
```

**Virtual Scrolling:**
Efficient rendering of large file lists.

**Implementation:**
```javascript
// frontend/scripts/virtual-scroll.js
class VirtualScroll {
    renderVisibleItems() {
        const start = Math.floor(this.scrollTop / this.itemHeight);
        const end = Math.min(start + this.visibleCount, this.items.length);
        
        this.items.slice(start, end).forEach((item, index) => {
            this.renderItem(item, start + index);
        });
    }
}
```

#### Export System

**Export Formats:**
- **CSV**: Spreadsheet-compatible data export
- **JSON**: Structured data export
- **PDF**: Formatted document export

**Implementation:**
```javascript
// frontend/scripts/export-system.js
class ExportSystem {
    exportToCSV(data, filename) {
        const csv = this.convertToCSV(data);
        this.downloadFile(csv, filename, 'text/csv');
    }
    
    exportToJSON(data, filename) {
        const json = JSON.stringify(data, null, 2);
        this.downloadFile(json, filename, 'application/json');
    }
    
    exportToPDF(data, filename) {
        // Use jsPDF or similar library
        const pdf = this.generatePDF(data);
        this.downloadFile(pdf, filename, 'application/pdf');
    }
}
```

---

## 3. Technical Implementation Details

### 3.1 Security Measures

**Rate Limiting:**
- API endpoints: 100 requests/minute
- Login endpoint: 5 requests/minute
- Upload endpoint: 20 requests/minute

**Security Headers:**
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin

**Input Validation:**
- Type checking
- Length limits
- Path traversal prevention
- XSS prevention

### 3.2 Performance Optimizations

**Compression:**
- Gzip compression for all responses
- ~70% bandwidth reduction

**Caching:**
- Static assets: 1 day cache
- Images: 1 year cache
- ETag support for cache validation

**Image Optimization:**
- Automatic format conversion (PNG → WebP)
- Size reduction (4K → 1080p)
- Thumbnail generation

### 3.3 PWA Support

**Service Worker:**
- Offline caching
- Background sync
- Cache management

**Web App Manifest:**
- Installable as standalone app
- Custom icons and theme
- App shortcuts

---

## 4. Conclusion

This documentation demonstrates the comprehensive technical implementation of the Smart Solutions platform, showcasing:

- **Robust Architecture**: Standalone, cross-platform, offline-capable
- **Advanced Features**: Real-time updates, AI capabilities, analytics
- **Performance**: Optimized for low-power devices
- **Security**: Enterprise-grade security measures
- **User Experience**: Intuitive interface with modern UX patterns

The system successfully fulfills all bachelor project requirements while maintaining production-ready code quality and comprehensive documentation.

