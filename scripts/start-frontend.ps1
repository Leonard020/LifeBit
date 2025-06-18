# LifeBit 프론트엔드 실행 스크립트
Write-Host "🚀 LifeBit 프론트엔드 시작 (React + Vite)" -ForegroundColor Green

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootPath = Split-Path -Parent $scriptPath
Set-Location "$rootPath/apps/frontend-vite"

Write-Host "📦 의존성 설치 및 개발 서버 시작..." -ForegroundColor Yellow
pnpm dev

Write-Host "✅ 프론트엔드 서버가 http://localhost:5173 에서 실행됩니다" -ForegroundColor Green 