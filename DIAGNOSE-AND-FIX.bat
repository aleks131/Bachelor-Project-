@echo off
title Smart Solutions - Diagnose and Fix
color 0E
cd /d "%~dp0"

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║   Smart Solutions - Complete Diagnosis & Fix         ║
echo ╚════════════════════════════════════════════════════════╝
echo.

echo [STEP 1] Checking Node.js installation...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo    ❌ Node.js is NOT installed!
    echo    Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)
node --version
echo    ✅ Node.js is installed
echo.

echo [STEP 2] Stopping all existing Node processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo    ✅ Cleaned up
echo.

echo [STEP 3] Checking project files...
set MISSING=0
if not exist "backend\server.js" (
    echo    ❌ backend\server.js MISSING
    set MISSING=1
)
if not exist "data\config.json" (
    echo    ❌ data\config.json MISSING
    set MISSING=1
)
if not exist "data\users.json" (
    echo    ❌ data\users.json MISSING
    set MISSING=1
)
if not exist "package.json" (
    echo    ❌ package.json MISSING
    set MISSING=1
)
if %MISSING% EQU 1 (
    echo    ❌ Critical files are missing!
    pause
    exit /b 1
)
echo    ✅ All critical files present
echo.

echo [STEP 4] Checking dependencies...
if not exist "node_modules" (
    echo    ⚠️  node_modules not found - installing...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo    ❌ Failed to install dependencies
        pause
        exit /b 1
    )
    echo    ✅ Dependencies installed
) else (
    echo    ✅ Dependencies exist
)
echo.

echo [STEP 5] Testing server syntax...
node -c backend/server.js >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo    ❌ Server has syntax errors!
    echo    Please check backend/server.js
    pause
    exit /b 1
)
echo    ✅ Server syntax is valid
echo.

echo [STEP 6] Checking port availability...
netstat -ano | findstr ":3000" | findstr "LISTENING" >nul
if %ERRORLEVEL% EQU 0 (
    echo    ⚠️  Port 3000 is already in use
    echo    Attempting to free it...
    for /f "tokens=5" %%p in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
        taskkill /PID %%p /F >nul 2>&1
    )
    timeout /t 2 /nobreak >nul
    echo    ✅ Port should be free now
) else (
    echo    ✅ Port 3000 is available
)
echo.

echo [STEP 7] Creating required directories...
if not exist "data" mkdir data
if not exist "data\image-cache" mkdir data\image-cache
if not exist "data\thumbnails" mkdir data\thumbnails
if not exist "data\layouts" mkdir data\layouts
if not exist "data\backups" mkdir data\backups
if not exist "data\logs" mkdir data\logs
if not exist "data\ai-cache" mkdir data\ai-cache
echo    ✅ Directories ready
echo.

echo [STEP 8] Starting server...
echo.
echo ════════════════════════════════════════════════════════
echo   Starting server in new window...
echo   Watch for startup messages
echo ════════════════════════════════════════════════════════
echo.

start "Smart Solutions Server" cmd /k "node backend/server.js"

timeout /t 10 /nobreak >nul

echo [STEP 9] Verifying server started...
netstat -ano | findstr ":3000" | findstr "LISTENING" >nul
if %ERRORLEVEL% EQU 0 (
    echo    ✅✅✅ SERVER IS RUNNING! ✅✅✅
    echo.
    echo [STEP 10] Opening browser...
    start http://localhost:3000
    timeout /t 2 /nobreak >nul
    echo    ✅ Browser opened
    echo.
    echo ╔════════════════════════════════════════════════════════╗
    echo ║                                                       ║
    echo ║   ✅✅✅ SUCCESS! SERVER IS WORKING! ✅✅✅          ║
    echo ║                                                       ║
    echo ╚════════════════════════════════════════════════════════╝
    echo.
    echo   URL: http://localhost:3000
    echo   Login: admin / admin123
    echo.
    echo   The server window is open separately
    echo   Check it for any warnings (non-existent paths are OK)
    echo.
) else (
    echo    ❌ Server did not start
    echo.
    echo   Please check the server window for errors
    echo   Common issues:
    echo   - Missing npm packages: Delete node_modules and run npm install
    echo   - Syntax errors: Check backend/server.js
    echo   - Port conflicts: Restart computer
    echo.
)

pause

