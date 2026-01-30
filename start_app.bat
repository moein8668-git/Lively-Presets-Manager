@echo off
title Lively Presets Launcher
echo ==========================================
echo      Lively Presets Manager Launcher
echo ==========================================
echo.

:: Check for node_modules in root
if not exist "node_modules" (
    echo [INFO] Installing root dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install root dependencies.
        pause
        exit /b %errorlevel%
    )
)

:: Check for client/node_modules
if not exist "client\node_modules" (
    echo [INFO] Installing client dependencies...
    cd client
    call npm install
    cd ..
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install client dependencies.
        pause
        exit /b %errorlevel%
    )
)

:: Check if client build exists
if not exist "client\dist" (
    echo [INFO] Building client...
    call npm run build
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to build client.
        pause
        exit /b %errorlevel%
    )
)

echo.
echo [INFO] Starting Server...
echo [INFO] Opening Browser...
start "" "http://localhost:3001"
call npm start

pause
