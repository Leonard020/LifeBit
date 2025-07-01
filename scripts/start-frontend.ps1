# LifeBit Frontend Startup Script
Write-Host "🚀 Starting LifeBit Frontend (React + Vite)" -ForegroundColor Green

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootPath = Split-Path -Parent $scriptPath
Set-Location "$rootPath/apps/frontend-vite"

# pnpm 설치 확인
try {
    $pnpmVersion = pnpm --version
    Write-Host "📦 pnpm version: $pnpmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ pnpm is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install pnpm: npm install -g pnpm" -ForegroundColor Yellow
    exit 1
}

# node_modules 확인
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    pnpm install
}

Write-Host "🚀 Starting development server..." -ForegroundColor Yellow
pnpm dev

Write-Host "✅ Frontend server is running at http://localhost:5173" -ForegroundColor Green 