# LifeBit AI API Startup Script
Write-Host "🤖 Starting LifeBit AI API (FastAPI)" -ForegroundColor Green

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootPath = Split-Path -Parent $scriptPath
Set-Location "$rootPath/apps/ai-api-fastapi"

Write-Host "📦 Activating virtual environment..." -ForegroundColor Yellow

# PowerShell에서 가상환경 활성화 (올바른 방법)
if (Test-Path "venv/Scripts/Activate.ps1") {
    # 현재 세션에서 가상환경 활성화
    & "$PWD/venv/Scripts/Activate.ps1"
    Write-Host "✅ Virtual environment activated" -ForegroundColor Green
} else {
    Write-Host "❌ Virtual environment not found at venv/Scripts/Activate.ps1" -ForegroundColor Red
    exit 1
}

Write-Host "🚀 Starting FastAPI server..." -ForegroundColor Yellow
# 가상환경이 활성화된 상태에서 uvicorn 실행
uvicorn main:app --host 0.0.0.0 --port 8001 --reload

Write-Host "✅ AI API server is running at http://localhost:8001" -ForegroundColor Green 