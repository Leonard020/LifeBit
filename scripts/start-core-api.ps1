# 스크립트 디렉토리 설정
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootPath = Split-Path -Parent $scriptPath

# 환경변수 로드 (.env 파일이 있는 경우)
$envFilePath = Join-Path $rootPath ".env"
if (Test-Path $envFilePath) {
    Write-Host "Loading environment variables from .env file..." -ForegroundColor Green
    
    # .env 파일 읽기 및 환경변수 설정
    Get-Content $envFilePath | ForEach-Object {
        if ($_ -and !$_.StartsWith('#') -and $_.Contains('=')) {
            $key, $value = $_.Split('=', 2)
            $key = $key.Trim()
            $value = $value.Trim()
            
            # 따옴표 제거 (있는 경우)
            if ($value.StartsWith('"') -and $value.EndsWith('"')) {
                $value = $value.Substring(1, $value.Length - 2)
            }
            if ($value.StartsWith("'") -and $value.EndsWith("'")) {
                $value = $value.Substring(1, $value.Length - 2)
            }
            
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

# 개발환경 설정
$env:SPRING_PROFILES_ACTIVE = "development"

Write-Host "Starting Spring Boot Core API in development mode..." -ForegroundColor Yellow
Write-Host "Active profile: $env:SPRING_PROFILES_ACTIVE" -ForegroundColor Cyan

# Spring Boot 애플리케이션 시작
Set-Location "$rootPath/apps/core-api-spring"
& ./mvnw spring-boot:run -D"spring-boot.run.profiles=development" 