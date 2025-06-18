# LifeBit Frontend Startup Script
Write-Host "🚀 Starting LifeBit Frontend (React + Vite)" -ForegroundColor Green

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootPath = Split-Path -Parent $scriptPath
Set-Location "$rootPath/apps/frontend-vite"

Write-Host "📦 Installing dependencies and starting dev server..." -ForegroundColor Yellow
pnpm dev

Write-Host "✅ Frontend server is running at http://localhost:5173" -ForegroundColor Green 