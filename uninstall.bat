@echo off
chcp 936 >nul 2>&1
title WinOJ - 卸载依赖

echo ==========================================
echo       WinOJ - 卸载依赖
echo ==========================================
echo.
echo 此脚本将删除 setup.bat 下载的依赖。
echo Node.js 不会被删除。
echo.

cd /d "%~dp0"

set /p confirm="确定要继续吗？(Y/N): "
if /i not "%confirm%"=="Y" (
    echo 已取消。
    pause
    exit /b 0
)

:: ========== 删除 Node.js 依赖 ==========
echo.
echo [..] 删除 node_modules...
if exist "backend\node_modules" (
    rmdir /s /q "backend\node_modules"
    echo [OK] node_modules 已删除
)

:: ========== 删除通过 setup.bat 安装的语言运行时 ==========
echo.
echo [..] 删除通过 setup.bat 安装的语言运行时...

if exist "tools\gcc" (
    rmdir /s /q "tools\gcc"
    echo [OK] GCC 已删除
)

if exist "tools\python" (
    rmdir /s /q "tools\python"
    echo [OK] Python 已删除
)

if exist "tools\java" (
    rmdir /s /q "tools\java"
    echo [OK] JDK 已删除
)

if exist "tools" (
    dir /b "tools" 2>nul | findstr /r "." >nul 2>&1
    if %errorlevel% neq 0 (
        rmdir /s /q "tools"
        echo [OK] tools 目录已删除
    ) else (
        echo [!!] tools 目录非空，保留
    )
)

:: ========== 询问是否删除数据库 ==========
echo.
set /p deldb="是否同时删除数据库？(Y/N): "
if /i "%deldb%"=="Y" (
    if exist "backend\data\winoj.db" (
        del "backend\data\winoj.db"
        echo [OK] 数据库已删除
    )
)

:: ========== 询问是否删除上传文件 ==========
set /p delup="是否同时删除上传文件？(Y/N): "
if /i "%delup%"=="Y" (
    if exist "data\uploads" (
        rmdir /s /q "data\uploads"
        echo [OK] 上传文件已删除
    )
)

:: ========== 完成 ==========
echo.
echo ==========================================
echo       卸载完成！
echo ==========================================
echo.
echo 如需重新安装，运行 setup.bat
echo.
pause
