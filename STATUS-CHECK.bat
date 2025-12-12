@echo off
title Smart Solutions - Status Check
color 0B
cd /d "%~dp0"

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║   Smart Solutions by TripleA - Status Check          ║
echo ╚════════════════════════════════════════════════════════╝
echo.

echo [1] Checking Node.js processes...
tasklist /FI "IMAGENAME eq node.exe" 2>nul | find /I "node.exe" >nul
if %ERRORLEVEL% EQU 0 (
    echo    [OK] Node.js processes running
    tasklist /FI "IMAGENAME eq node.exe" | find "node.exe"
) else (
    echo    [INFO] No Node.js processes found
)
echo.

echo [2] Checking port 3000...
netstat -an | findstr ":3000" >nul
if %ERRORLEVEL% EQU 0 (
    echo    [OK] Port 3000 is in use (server likely running)
    netstat -an | findstr ":3000"
) else (
    echo    [WARNING] Port 3000 is not in use
    echo    Server may not be running
)
echo.

echo [3] Testing server response...
curl -s http://localhost:3000 >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo    [OK] Server is responding!
    echo    [OK] Software is working!
) else (
    echo    [WARNING] Server not responding
    echo    Try running: FIX-AND-START.bat
)
echo.

echo ════════════════════════════════════════════════════════
echo.
echo Status Check Complete!
echo.
echo If server is not running, use:
echo   - FIX-AND-START.bat (recommended)
echo   - START-SERVER.bat
echo   - LAUNCH-PERFECT.bat
echo.
pause

