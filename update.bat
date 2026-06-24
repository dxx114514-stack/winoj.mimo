@echo off
chcp 936 >nul 2>&1
title WinOJ - 一键更新

echo ==========================================
echo       WinOJ - 一键更新
echo ==========================================
echo.

cd /d "%~dp0"

:: ========== 检查 Git ==========
where git >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] 未检测到 Git，无法自动更新
    echo 请手动下载最新代码，或安装 Git: https://git-scm.com/
    pause
    exit /b 1
)

:: ========== 检查是否有本地修改 ==========
echo [..] 检查本地修改...
git status --porcelain | findstr /r "." >nul 2>&1
if %errorlevel% eq 0 (
    echo [!!] 检测到本地修改，正在暂存...
    git stash
    set STASHED=1
)

:: ========== 拉取最新代码 ==========
echo [..] 拉取最新代码...
git pull
if %errorlevel% neq 0 (
    echo [ERROR] 拉取代码失败
    if defined STASHED git stash pop
    pause
    exit /b 1
)

:: ========== 恢复本地修改 ==========
if defined STASHED (
    echo [..] 恢复本地修改...
    git stash pop
)

:: ========== 更新 Node.js 依赖 ==========
echo.
echo [..] 更新 Node.js 依赖...
cd backend
call npm install
cd ..

:: ========== 完成 ==========
echo.
echo ==========================================
echo       更新完成！
echo ==========================================
echo.
echo 如有数据库结构变更，重启服务器将自动迁移。
echo.
pause
