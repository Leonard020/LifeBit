# LifeBit Core API Startup Script
Write-Host "🏗️ Starting LifeBit Core API (Spring Boot)" -ForegroundColor Green

# Set UTF-8 encoding for proper Korean character handling
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# Determine project root
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$ROOT_DIR   = Split-Path -Parent $SCRIPT_DIR

# Load environment variables from .env if it exists
$envFile = Join-Path $ROOT_DIR ".env"
if (Test-Path $envFile) {
    Write-Host "📄 Loading environment variables from .env" -ForegroundColor Green
    Get-Content $envFile | ForEach-Object {
        if ($_ -and -not $_.StartsWith('#') -and $_.Contains('=')) {
            $parts = $_.Split('=',2)
            $key   = $parts[0].Trim()
            $value = $parts[1].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

# Set active profile
[Environment]::SetEnvironmentVariable("SPRING_PROFILES_ACTIVE", "development", "Process")

Write-Host "Starting Spring Boot Core API in development mode..." -ForegroundColor Yellow
Write-Host "Active profile: $env:SPRING_PROFILES_ACTIVE" -ForegroundColor Cyan

# Move to Spring Boot project directory
Set-Location "$ROOT_DIR/apps/core-api-spring"

# Run Maven command using cmd directly
cmd /c "mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=development"

Write-Host "✅ Core API server is running at http://localhost:8080" -ForegroundColor Green 