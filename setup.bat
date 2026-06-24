@echo off
chcp 936 >nul 2>&1
title WinOJ - 安装部署

echo ==========================================
echo       WinOJ - 一键安装部署
echo ==========================================
echo.

cd /d "%~dp0"

:: ========== 预留端口 ==========
echo [..] 预留端口 3000...
net stop winnat >nul 2>&1
netsh int ipv4 add excludedportrange protocol=tcp startport=3000 numberofports=1 store=persistent >nul 2>&1
net start winnat >nul 2>&1
echo [OK] 端口 3000 已预留

:: ========== 检查 Node.js ==========
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] 未检测到 Node.js，请先安装 Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo [OK] Node.js %NODE_VER%

:: ========== 检查 Git ==========
where git >nul 2>&1
set HAS_GIT=0
if %errorlevel% equ 0 set HAS_GIT=1

:: ========== 安装 Node.js 依赖 ==========
if not exist "backend\node_modules" (
    echo [..] 安装 Node.js 依赖...
    cd backend
    call npm install
    cd ..
    echo [OK] Node.js 依赖安装完成
) else (
    echo [OK] Node.js 依赖已存在，跳过
)

:: ========== 检查并安装 GCC ==========
echo.
echo [..] 检查 GCC/G++...
where gcc >nul 2>&1
if %errorlevel% neq 0 (
    echo [!!] 未检测到 GCC，尝试安装...
    if not exist "tools" mkdir tools
    if not exist "tools\gcc" (
        echo [..] 下载 MinGW-w64...
        powershell -Command "Invoke-WebRequest -Uri 'https://github.com/niXman/mingw-builds-binaries/releases/download/14.2.0-rt_v12-rev1/x86_64-14.2.0-release-posix-seh-ucrt-rt_v12-rev1.7z' -OutFile 'tools\gcc.7z'"
        echo [..] 解压中（可能需要几分钟）...
        powershell -Command "Expand-Archive -Path 'tools\gcc.7z' -DestinationPath 'tools\gcc-tmp' -Force" 2>nul
        if exist "tools\gcc-tmp" (
            for /d %%d in (tools\gcc-tmp\*) do move "%%d" "tools\gcc" >nul 2>&1
            rmdir /s /q "tools\gcc-tmp" >nul 2>&1
        )
        if exist "tools\gcc.7z" del "tools\gcc.7z"
    )
    if exist "tools\gcc\mingw64\bin" (
        set "PATH=%~dp0tools\gcc\mingw64\bin;%PATH%"
        echo [OK] GCC 已安装到 tools\gcc
        echo [!!] 请将 tools\gcc\mingw64\bin 添加到系统 PATH 环境变量
    ) else (
        echo [ERROR] GCC 安装失败，请手动安装 MinGW-w64
        echo 下载地址: https://github.com/niXman/mingw-builds-binaries/releases
    )
) else (
    echo [OK] GCC 已安装
)

:: ========== 检查并安装 Python ==========
echo.
echo [..] 检查 Python...
where python >nul 2>&1
if %errorlevel% neq 0 (
    where py >nul 2>&1
    if %errorlevel% neq 0 (
        echo [!!] 未检测到 Python，尝试安装...
        if not exist "tools" mkdir tools
        if not exist "tools\python" (
            echo [..] 下载 Python 3.12...
            powershell -Command "Invoke-WebRequest -Uri 'https://www.python.org/ftp/python/3.12.4/python-3.12.4-amd64.exe' -OutFile 'tools\python-installer.exe'"
            echo [..] 静默安装 Python...
            start /wait tools\python-installer.exe /quiet InstallAllUsers=1 PrependPath=1 Include_test=0 TargetDir=tools\python
            if exist "tools\python-installer.exe" del "tools\python-installer.exe"
        )
        if exist "tools\python\python.exe" (
            set "PATH=%~dp0tools\python;%~dp0tools\python\Scripts;%PATH%"
            echo [OK] Python 已安装到 tools\python
            echo [!!] 请将 tools\python 添加到系统 PATH 环境变量
        ) else (
            echo [ERROR] Python 安装失败，请手动安装 Python 3
            echo 下载地址: https://www.python.org/downloads/
        )
    ) else (
        echo [OK] Python 已安装（py 启动器）
    )
) else (
    echo [OK] Python 已安装
)

:: ========== 检查并安装 JDK ==========
echo.
echo [..] 检查 Java...
where javac >nul 2>&1
if %errorlevel% neq 0 (
    echo [!!] 未检测到 JDK，尝试安装...
    if not exist "tools" mkdir tools
    if not exist "tools\java" (
        echo [..] 下载 OpenJDK 21...
        powershell -Command "Invoke-WebRequest -Uri 'https://download.oracle.com/java/21/archive/jdk-21.0.3_windows-x64_bin.zip' -OutFile 'tools\java.zip'"
        echo [..] 解压 JDK...
        powershell -Command "Expand-Archive -Path 'tools\java.zip' -DestinationPath 'tools\java-tmp' -Force" 2>nul
        if exist "tools\java-tmp" (
            for /d %%d in (tools\java-tmp\*) do move "%%d" "tools\java" >nul 2>&1
            rmdir /s /q "tools\java-tmp" >nul 2>&1
        )
        if exist "tools\java.zip" del "tools\java.zip"
    )
    if exist "tools\java\bin\javac.exe" (
        set "PATH=%~dp0tools\java\bin;%PATH%"
        echo [OK] JDK 已安装到 tools\java
        echo [!!] 请将 tools\java\bin 添加到系统 PATH 环境变量
    ) else (
        echo [ERROR] JDK 安装失败，请手动安装 JDK
        echo 下载地址: https://adoptium.net/
    )
) else (
    echo [OK] JDK 已安装
)

:: ========== 初始化数据库 ==========
echo.
echo [..] 初始化数据库...
if not exist "backend\data" mkdir backend\data
node -e "const {initDB}=require('./backend/database/db');initDB().then(()=>{console.log('[OK] 数据库初始化完成');process.exit(0)}).catch(e=>{console.error('[ERROR]',e.message);process.exit(1)})"

:: ========== 完成 ==========
echo.
echo ==========================================
echo       安装部署完成！
echo ==========================================
echo.
echo 使用方法:
echo   双击 start.bat 启动服务器
echo   或运行: cd backend ^& npm start
echo.
echo 默认管理员: admin / admin123
echo.
pause
