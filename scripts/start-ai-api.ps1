# LifeBit AI API Startup Script
Write-Host "🤖 Starting LifeBit AI API (FastAPI)" -ForegroundColor Green

# Set UTF-8 encoding for proper Korean character handling
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
[Environment]::SetEnvironmentVariable("PYTHONIOENCODING", "utf-8", "Process")

# Determine project root
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$ROOT_DIR   = Split-Path -Parent $SCRIPT_DIR

Set-Location "$ROOT_DIR/apps/ai-api-fastapi"

# Activate virtual environment (if it exists)
$activateScript = "venv\Scripts\Activate.ps1"
if (Test-Path $activateScript) {
    & $activateScript
    Write-Host "✅ Virtual environment activated" -ForegroundColor Green
} else {
    Write-Error "❌ Virtual environment not found at $activateScript"
    exit 1
}

# Start FastAPI development server
Write-Host "🚀 Starting FastAPI server..." -ForegroundColor Yellow
& uvicorn main:app --reload --port 8001

Write-Host "✅ AI API server is running at http://localhost:8001" -ForegroundColor Green 