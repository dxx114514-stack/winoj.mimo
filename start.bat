@echo off
chcp 936 >nul 2>&1
title WinOJ

echo ==========================================
echo       WinOJ - Windows Online Judge
echo ==========================================
echo.

cd /d "%~dp0"

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Please install Node.js first.
    echo Download: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo [OK] Node.js: %NODE_VER%

if not exist "backend\node_modules" (
    echo [..] Installing dependencies...
    cd backend
    call npm install
    cd ..
    if %errorlevel% neq 0 (
        echo [FAIL] Failed to install dependencies
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed
)

echo [..] Starting WinOJ server...
echo.

start "" http://localhost:3000

node backend\src\server.js

pause
