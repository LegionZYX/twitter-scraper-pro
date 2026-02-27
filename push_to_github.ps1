# Twitter Scraper Pro - GitHub 推送脚本 (PowerShell)
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Twitter Scraper Pro - GitHub 推送" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Git
try {
    $null = git --version
    Write-Host "[✓] Git 已安装" -ForegroundColor Green
} catch {
    Write-Host "[✗] 未检测到 Git，请先安装" -ForegroundColor Red
    Write-Host "下载：https://git-scm.com/" -ForegroundColor Yellow
    pause
    exit 1
}

# 配置远程仓库
$repoUrl = "https://github.com/LegionZYX/twitter-scraper-pro.git"
Write-Host ""
Write-Host "[信息] 配置远程仓库..." -ForegroundColor Yellow
git remote remove origin 2>$null
git remote add origin $repoUrl

if ($LASTEXITCODE -eq 0) {
    Write-Host "[✓] 远程仓库已配置" -ForegroundColor Green
} else {
    Write-Host "[✗] 配置失败" -ForegroundColor Red
    pause
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  推送前准备" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. 请先在 GitHub 创建空仓库：" -ForegroundColor Yellow
Write-Host "   访问：https://github.com/new" -ForegroundColor White
Write-Host "   仓库名：twitter-scraper-pro" -ForegroundColor White
Write-Host "   不要勾选 Initialize with README" -ForegroundColor White
Write-Host ""
Write-Host "2. 准备 Personal Access Token：" -ForegroundColor Yellow
Write-Host "   访问：https://github.com/settings/tokens" -ForegroundColor White
Write-Host "   权限：勾选 repo" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$continue = Read-Host "是否已创建仓库并准备好 Token？(y/n)"
if ($continue -ne "y") {
    Write-Host "推送已取消" -ForegroundColor Red
    pause
    exit 1
}

Write-Host ""
Write-Host "[信息] 开始推送到 GitHub..." -ForegroundColor Yellow
Write-Host ""

# 执行推送
git push -u origin master

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ✓ 推送成功！" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "仓库地址：" -ForegroundColor Cyan
    Write-Host "https://github.com/LegionZYX/twitter-scraper-pro" -ForegroundColor White
    Write-Host ""
    Write-Host "按任意键打开浏览器..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    Start-Process "https://github.com/LegionZYX/twitter-scraper-pro"
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  ✗ 推送失败" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "可能的原因：" -ForegroundColor Yellow
    Write-Host "1. 仓库未创建 - 请先在 GitHub 创建空仓库" -ForegroundColor White
    Write-Host "2. Token 错误 - 请检查 Personal Access Token" -ForegroundColor White
    Write-Host "3. 网络问题 - 请检查网络连接" -ForegroundColor White
    Write-Host ""
    Write-Host "详细指南：查看 GITHUB_PUSH_GUIDE.md" -ForegroundColor Cyan
    Write-Host ""
}

pause
