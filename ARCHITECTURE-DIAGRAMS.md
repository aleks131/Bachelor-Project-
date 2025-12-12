# Architecture Diagrams - Smart Solutions by TripleA

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT DEVICES                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Browser    │  │   Browser    │  │   Browser    │      │
│  │  (Windows)   │  │  (Raspberry) │  │   (macOS)    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                  │               │
│         └─────────────────┼──────────────────┘               │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │
                            │ HTTP/WebSocket
                            │
┌───────────────────────────▼──────────────────────────────────┐
│                    NODE.JS SERVER                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Express.js Framework                     │   │
│  │  ┌──────────────┐  ┌──────────────┐                │   │
│  │  │ REST API     │  │ Static Files │                │   │
│  │  │ Endpoints    │  │ Server       │                │   │
│  │  └──────────────┘  └──────────────┘                │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              WebSocket Server (ws)                   │   │
│  │  Real-time bi-directional communication             │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              File Watcher (Chokidar)                 │   │
│  │  Event-driven file system monitoring                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Image Processor (Sharp)                 │   │
│  │  Resize, optimize, thumbnail generation              │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            │ File System Access
                            │
┌───────────────────────────▼──────────────────────────────────┐
│                    DATA STORAGE                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Network    │  │  JSON Files  │  │ Image Cache  │     │
│  │    Drive     │  │  (Users,     │  │  (Thumbnails, │     │
│  │              │  │   Config)     │  │  Optimized)  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Request Flow Diagram

```
User Action
    │
    ▼
┌─────────────────┐
│  Browser (JS)   │
└────────┬────────┘
         │
         │ HTTP Request (Fetch API)
         ▼
┌─────────────────┐
│  Express.js     │
│  Middleware     │
│  - Compression  │
│  - Auth Check   │
│  - Rate Limit   │
└────────┬────────┘
         │
         │ Route Handler
         ▼
┌─────────────────┐
│  Route Handler  │
│  (e.g., /api/   │
│   gallery)      │
└────────┬────────┘
         │
         │ File System / Processing
         ▼
┌─────────────────┐
│  File System    │
│  or             │
│  Image Processor│
└────────┬────────┘
         │
         │ Response Data
         ▼
┌─────────────────┐
│  JSON Response  │
└────────┬────────┘
         │
         │ HTTP Response
         ▼
┌─────────────────┐
│  Browser        │
│  (Update UI)    │
└─────────────────┘
```

## Real-Time Update Flow

```
File System Change
    │
    ▼
┌─────────────────┐
│  Chokidar       │
│  File Watcher   │
└────────┬────────┘
         │
         │ File Event
         ▼
┌─────────────────┐
│  WebSocket      │
│  Server         │
└────────┬────────┘
         │
         │ Broadcast Message
         ▼
┌─────────────────┐
│  Connected      │
│  Clients        │
│  (Browsers)     │
└────────┬────────┘
         │
         │ WebSocket Message
         ▼
┌─────────────────┐
│  Browser JS     │
│  (Update UI)    │
└─────────────────┘
```

## Authentication Flow

```
User Login Request
    │
    ▼
┌─────────────────┐
│  POST /api/login│
└────────┬────────┘
         │
         │ Validate Credentials
         ▼
┌─────────────────┐
│  bcryptjs       │
│  Password Check │
└────────┬────────┘
         │
         │ Success
         ▼
┌─────────────────┐
│  Create Session │
│  (Express-      │
│   Session)      │
└────────┬────────┘
         │
         │ Generate Tokens
         ▼
┌─────────────────┐
│  JWT Tokens     │
│  (Access +      │
│   Refresh)      │
└────────┬────────┘
         │
         │ Return to Client
         ▼
┌─────────────────┐
│  Browser        │
│  (Store Session)│
└─────────────────┘
```

## Image Processing Flow

```
Image Request
    │
    ▼
┌─────────────────┐
│  Check Cache    │
└────────┬────────┘
         │
         ├─── Cache Hit ────► Return Cached Image
         │
         └─── Cache Miss ────►
                    │
                    ▼
         ┌─────────────────┐
         │  Read Original  │
         │  Image          │
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │  Sharp          │
         │  Processing     │
         │  - Resize       │
         │  - Convert      │
         │  - Optimize     │
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │  Save to Cache  │
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │  Return         │
         │  Optimized      │
         │  Image          │
         └─────────────────┘
```

## Component Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND                              │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   HTML5      │  │    CSS3      │  │  JavaScript  │ │
│  │  Structure   │  │   Styling    │  │   Logic      │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Application Modules                 │  │
│  │  - Dashboard    - Gallery    - Daily Plan        │  │
│  │  - Admin Panel  - Monitoring - Layout Builder   │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Shared Components                   │  │
│  │  - Theme Manager  - Search    - Notifications   │  │
│  │  - File Manager   - AI Panel  - Export System  │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                            │ API Calls / WebSocket
                            │
┌───────────────────────────▼───────────────────────────────┐
│                    BACKEND                                │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Route Handlers                       │  │
│  │  - Authentication  - File Management             │  │
│  │  - Image Processing - AI Features                │  │
│  │  - Analytics      - Monitoring                  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Utilities                           │  │
│  │  - Image Processor  - AI Analyzer                 │  │
│  │  - Logger         - Validator                   │  │
│  │  - Backup         - Monitoring                  │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌─────────────┐
│   User      │
│  Action     │
└──────┬──────┘
       │
       ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  Frontend   │─────►│   Backend   │─────►│ File System│
│  (JS)       │◄─────│  (Express)  │◄─────│  (Network)  │
└─────────────┘      └──────┬──────┘      └─────────────┘
                            │
                            ▼
                    ┌─────────────┐
                    │   JSON      │
                    │   Storage   │
                    └─────────────┘
```

## Security Architecture

```
┌─────────────────────────────────────────┐
│         CLIENT REQUEST                  │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│      Rate Limiting Check               │
│      (100 req/min for API)             │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│      Security Headers                    │
│      (XSS, Clickjacking Protection)     │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│      Authentication Check                │
│      (Session/JWT Validation)            │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│      Authorization Check                │
│      (Role-Based Access Control)         │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│      Input Validation                    │
│      (Type, Length, Sanitization)        │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│      Route Handler                       │
│      (Process Request)                   │
└─────────────────────────────────────────┘
```

## Deployment Architecture

```
                    ┌─────────────────┐
                    │  Network Drive  │
                    │  (Content)      │
                    └────────┬────────┘
                             │
                             │ File Access
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Windows    │    │   Raspberry  │    │    macOS     │
│   Server     │    │     Pi       │    │   Server     │
│              │    │              │    │              │
│  Node.js     │    │  Node.js     │    │  Node.js     │
│  Express     │    │  Express     │    │  Express     │
│              │    │              │    │              │
│  Port 3000   │    │  Port 3000   │    │  Port 3000   │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                           │ HTTP/WebSocket
                           │
                    ┌──────▼──────┐
                    │   Browser   │
                    │   Clients   │
                    └─────────────┘
```

