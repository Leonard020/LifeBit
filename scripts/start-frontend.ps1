# LifeBit Frontend Startup Script
Write-Host "🚀 Starting LifeBit Frontend (React + Vite)" -ForegroundColor Green

# Set UTF-8 encoding for proper Korean character handling
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# Determine project root
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$ROOT_DIR   = Split-Path -Parent $SCRIPT_DIR

# Move to frontend source directory
Set-Location "$ROOT_DIR/apps/frontend-vite"

# Launch Vite development server
Write-Host "🚀 Starting development server..." -ForegroundColor Yellow
& pnpm dev 