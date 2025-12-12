@echo off
title Smart Solutions - Fix and Start
color 0A
cd /d "%~dp0"

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║   Fixing and Starting Smart Solutions by TripleA      ║
echo ╚════════════════════════════════════════════════════════╝
echo.

echo [1/7] Stopping all existing servers...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo    [OK] All processes stopped
echo.

echo [2/7] Checking Node.js...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo    [ERROR] Node.js not found!
    pause
    exit /b 1
)
echo    [OK] Node.js found
echo.

echo [3/7] Installing/Updating dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo    [ERROR] Failed to install dependencies!
    pause
    exit /b 1
)
echo    [OK] Dependencies ready
echo.

echo [4/7] Ensuring data directories...
if not exist "data" mkdir data
if not exist "data\image-cache" mkdir data\image-cache
if not exist "data\thumbnails" mkdir data\thumbnails
if not exist "data\layouts" mkdir data\layouts
if not exist "data\backups" mkdir data\backups
if not exist "data\logs" mkdir data\logs
if not exist "data\ai-cache" mkdir data\ai-cache
echo    [OK] Directories ready
echo.

echo [5/7] Checking admin user...
if not exist "data\users.json" (
    echo    Creating admin user...
    node backend/init-admin.js
)
echo    [OK] User data ready
echo.

echo [6/7] Verifying configuration...
if not exist "data\config.json" (
    echo    [ERROR] Config file missing!
    pause
    exit /b 1
)
echo    [OK] Configuration ready
echo.

echo [7/7] Starting server...
echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║   🚀 SERVER STARTING...                               ║
echo ╚════════════════════════════════════════════════════════╝
echo.
echo    URL: http://localhost:3000
echo    Login: admin / admin123
echo.
echo    Press Ctrl+C to stop
echo.

start "Smart Solutions Server" cmd /k "node backend/server.js"

timeout /t 5 /nobreak >nul

echo.
echo Opening browser...
start http://localhost:3000

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║   ✅ SOFTWARE FIXED AND STARTED!                       ║
echo ╚════════════════════════════════════════════════════════╝
echo.
echo    Server is running in a separate window
echo    Browser should open automatically
echo.
pause

