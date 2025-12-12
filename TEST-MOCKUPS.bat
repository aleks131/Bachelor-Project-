@echo off
title Smart Solutions - Test Mockups
color 0B
cd /d "%~dp0"

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║   Testing Mockup Images Access                        ║
echo ╚════════════════════════════════════════════════════════╝
echo.

echo [1] Checking if mockups folder exists...
if exist "mockups" (
    echo    ✅ Mockups folder found
    dir /b mockups\*.png
    echo.
) else (
    echo    ❌ Mockups folder NOT found!
    pause
    exit /b 1
)

echo [2] Checking if server is running...
netstat -ano | findstr ":3000" | findstr "LISTENING" >nul
if %ERRORLEVEL% EQU 0 (
    echo    ✅ Server is running
    echo.
    echo [3] Testing mockup URLs...
    echo    Open these URLs in your browser:
    echo.
    echo    http://localhost:3000/mockups/login-screen.png
    echo    http://localhost:3000/mockups/dashboard.png
    echo    http://localhost:3000/mockups/daily-plan-viewer.png
    echo    http://localhost:3000/mockups/image-gallery.png
    echo    http://localhost:3000/mockups/performance-dashboard.png
    echo    http://localhost:3000/mockups/admin-panel.png
    echo.
    echo    If images load, mockups are working!
    echo    If not, check browser console (F12) for errors
    echo.
) else (
    echo    ❌ Server is NOT running
    echo    Please start the server first using START-HERE.bat
    echo.
)

pause

