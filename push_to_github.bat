@echo off
chcp 65001 >nul
echo ========================================
echo   Twitter Scraper Pro - GitHub 推送脚本
echo ========================================
echo.

:: 检查 git 是否安装
git --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Git，请先安装 Git
    echo 下载地址：https://git-scm.com/
    pause
    exit /b 1
)

echo [1/5] 检查 Git 安装... ✓
echo.

:: 获取仓库信息
echo 请输入你的 GitHub 用户名（例如：your-username）:
set /p GITHUB_USER=

if "%GITHUB_USER%"=="" (
    echo [错误] 用户名不能为空
    pause
    exit /b 1
)

echo.
echo 请输入仓库名（例如：twitter-scraper-pro）:
set /p REPO_NAME=

if "%REPO_NAME%"=="" (
    echo [错误] 仓库名不能为空
    pause
    exit /b 1
)

echo.
echo [2/5] 配置信息:
echo     GitHub 用户：%GITHUB_USER%
echo     仓库名：%REPO_NAME%
echo.

:: 设置远程仓库地址
set REPO_URL=https://github.com/%GITHUB_USER%/%REPO_NAME%.git

echo [3/5] 添加远程仓库...
git remote remove origin >nul 2>&1
git remote add origin %REPO_URL%

if errorlevel 1 (
    echo [错误] 添加远程仓库失败
    pause
    exit /b 1
)
echo     ✓ 远程仓库已配置
echo.

:: 查看远程仓库
echo [4/5] 验证远程仓库配置...
git remote -v
echo.

:: 推送到 GitHub
echo [5/5] 推送到 GitHub...
echo.
echo ========================================
echo   重要提示：
echo ========================================
echo.
echo 1. 如果这是新仓库，请先在 GitHub 创建空仓库
echo    访问：https://github.com/new
echo    仓库名：%REPO_NAME%
echo    不要勾选"Initialize with README"
echo.
echo 2. 推送时需要输入 GitHub 账号密码
echo    密码使用 Personal Access Token
echo    获取：https://github.com/settings/tokens
echo.
echo ========================================
echo.
echo 准备推送...
echo.

git push -u origin master

if errorlevel 1 (
    echo.
    echo ========================================
    echo   [警告] 推送失败
    echo ========================================
    echo.
    echo 可能的原因：
    echo 1. 仓库不存在 - 请先在 GitHub 创建空仓库
    echo 2. 认证失败 - 请使用 Personal Access Token
    echo 3. 网络问题 - 请检查网络连接
    echo.
    echo 仓库地址：%REPO_URL%
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   ✓ 推送成功！
echo ========================================
echo.
echo 仓库地址：
echo %REPO_URL%
echo.
echo 在线查看：
echo https://github.com/%GITHUB_USER%/%REPO_NAME%
echo.
echo ========================================
echo.
pause
