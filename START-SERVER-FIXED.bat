@echo off
title Smart Solutions - Fixed Server Start
color 0A
cd /d "%~dp0"

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║   Smart Solutions by TripleA - Fixed Server Start    ║
echo ╚════════════════════════════════════════════════════════╝
echo.

echo [1] Stopping all Node processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 3 /nobreak >nul
echo    ✅ Cleaned up
echo.

echo [2] Verifying files...
if not exist "backend\server.js" (
    echo    ❌ Server file missing!
    pause
    exit /b 1
)
if not exist "data\config.json" (
    echo    ❌ Config file missing!
    pause
    exit /b 1
)
if not exist "data\users.json" (
    echo    ❌ Users file missing!
    pause
    exit /b 1
)
echo    ✅ All files present
echo.

echo [3] Checking dependencies...
if not exist "node_modules" (
    echo    ⚠️  Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo    ❌ Failed to install dependencies
        pause
        exit /b 1
    )
)
echo    ✅ Dependencies OK
echo.

echo [4] Creating data directories...
if not exist "data" mkdir data
if not exist "data\image-cache" mkdir data\image-cache
if not exist "data\thumbnails" mkdir data\thumbnails
if not exist "data\layouts" mkdir data\layouts
if not exist "data\backups" mkdir data\backups
if not exist "data\logs" mkdir data\logs
if not exist "data\ai-cache" mkdir data\ai-cache
echo    ✅ Directories ready
echo.

echo [5] Starting server...
echo.
echo ════════════════════════════════════════════════════════
echo   Server starting...
echo   Watch for errors in the window below
echo ════════════════════════════════════════════════════════
echo.

start "Smart Solutions Server" cmd /k "node backend/server.js"

timeout /t 8 /nobreak >nul

echo [6] Checking if server started...
netstat -ano | findstr ":3000" | findstr "LISTENING" >nul
if %ERRORLEVEL% EQU 0 (
    echo    ✅ Server is running on port 3000!
    echo.
    echo [7] Opening browser...
    start http://localhost:3000
    timeout /t 2 /nobreak >nul
    echo    ✅ Browser opened
    echo.
    echo ╔════════════════════════════════════════════════════════╗
    echo ║   ✅ SERVER IS RUNNING!                               ║
    echo ╚════════════════════════════════════════════════════════╝
    echo.
    echo   URL: http://localhost:3000
    echo   Login: admin / admin123
    echo.
    echo   Check the server window for any warnings
    echo   (Some network paths may not exist - that's OK)
    echo.
) else (
    echo    ❌ Server did not start on port 3000
    echo.
    echo   Please check the server window for errors
    echo   Common issues:
    echo   - Missing dependencies: Run 'npm install'
    echo   - Port in use: Stop other servers
    echo   - Syntax errors: Check backend/server.js
    echo.
)

pause

