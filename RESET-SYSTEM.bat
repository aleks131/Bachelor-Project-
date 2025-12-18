@echo off
setlocal
echo ===================================================
echo     SMART SOLUTIONS - SYSTEM RESET & RESTART
echo ===================================================
echo.
echo [1/5] Stopping all Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/5] Cleaning temporary files...
if exist "data\image-cache" (
    echo    - Clearing image cache...
    del /q "data\image-cache\*.*" >nul 2>&1
)
if exist "data\thumbnails" (
    echo    - Clearing thumbnails...
    del /q "data\thumbnails\*.*" >nul 2>&1
)

echo [3/5] Verifying system integrity...
if not exist "data\users.json" (
    echo    ! WARNING: Users file missing. Run SETUP.bat first.
    pause
    exit /b 1
)

echo [4/5] Checking configuration...
if not exist "data\config.json" (
    echo    ! WARNING: Config file missing. Run SETUP.bat first.
    pause
    exit /b 1
)

echo [5/5] Restarting server...
echo.
echo    System is clean and ready.
echo    Server starting in new window...
echo.
echo    NOTE: If your browser still shows errors, please
echo          press CTRL + F5 to force refresh the page.
echo.

start cmd /k "node backend/server.js"
timeout /t 5 /nobreak >nul

echo    Opening Admin Panel...
start http://localhost:3000/admin

echo.
echo ===================================================
echo     RESET COMPLETE - WINDOW WILL CLOSE
echo ===================================================
timeout /t 3 /nobreak >nul
exit

