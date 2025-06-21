# LifeBit Airflow 시작 스크립트 (Windows PowerShell)
# 비용 최적화된 MVP 환경

Write-Host "🚀 LifeBit Airflow 파이프라인 시작" -ForegroundColor Green

# 현재 디렉토리 확인
$currentDir = Get-Location
Write-Host "📁 현재 디렉토리: $currentDir" -ForegroundColor Yellow

# Docker가 설치되어 있는지 확인
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker 확인: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker가 설치되지 않았거나 실행되지 않고 있습니다." -ForegroundColor Red
    Write-Host "   Docker Desktop을 설치하고 실행해주세요: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Docker Compose가 설치되어 있는지 확인
try {
    $composeVersion = docker-compose --version
    Write-Host "✅ Docker Compose 확인: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose가 설치되지 않았습니다." -ForegroundColor Red
    exit 1
}

# 환경 변수 파일 확인
if (-not (Test-Path ".env")) {
    Write-Host "⚠️ .env 파일이 없습니다. 기본값으로 생성합니다." -ForegroundColor Yellow
}

# 필요한 디렉토리 생성
$dirs = @("dags", "logs", "plugins", "config")
foreach ($dir in $dirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "📁 디렉토리 생성: $dir" -ForegroundColor Blue
    }
}

# 로그 디렉토리 권한 설정 (Windows에서는 필요 없지만 정보용)
Write-Host "📝 로그 디렉토리 권한 설정 완료" -ForegroundColor Blue

Write-Host "🐳 Docker Compose로 Airflow 시작 중..." -ForegroundColor Cyan

# Docker Compose 실행
try {
    # 백그라운드에서 실행
    docker-compose up -d
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Airflow가 성공적으로 시작되었습니다!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🌐 접속 정보:" -ForegroundColor Yellow
        Write-Host "   - Airflow 웹 UI: http://localhost:8081" -ForegroundColor White
        Write-Host "   - 사용자명: admin" -ForegroundColor White
        Write-Host "   - 비밀번호: admin123!" -ForegroundColor White
        Write-Host "   - PostgreSQL: localhost:5433" -ForegroundColor White
        Write-Host ""
        Write-Host "📊 LifeBit 데이터 파이프라인:" -ForegroundColor Yellow
        Write-Host "   - DAG 이름: lifebit_health_analytics_pipeline" -ForegroundColor White
        Write-Host "   - 실행 주기: 매일 자동 실행" -ForegroundColor White
        Write-Host "   - 수동 실행: Airflow UI에서 가능" -ForegroundColor White
        Write-Host ""
        Write-Host "🔧 관리 명령어:" -ForegroundColor Yellow
        Write-Host "   - 중지: docker-compose down" -ForegroundColor White
        Write-Host "   - 로그 확인: docker-compose logs -f" -ForegroundColor White
        Write-Host "   - 재시작: docker-compose restart" -ForegroundColor White
        Write-Host ""
        Write-Host "⏳ 초기화가 완료될 때까지 2-3분 정도 기다려주세요..." -ForegroundColor Cyan
    } else {
        Write-Host "❌ Airflow 시작에 실패했습니다." -ForegroundColor Red
        Write-Host "🔍 로그 확인: docker-compose logs" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Docker Compose 실행 중 오류가 발생했습니다: $($_.Exception.Message)" -ForegroundColor Red
} 