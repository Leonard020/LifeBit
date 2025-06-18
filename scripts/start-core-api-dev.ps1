# 개발 환경에서 Spring Boot API 실행 (실무 표준 패턴)
Write-Host "🚀 LifeBit Core API 시작 (개발 환경 + Flyway)" -ForegroundColor Green

# 개발 환경 프로필로 실행
Set-Location "apps\core-api-spring"

Write-Host "📦 Maven 컴파일 중..." -ForegroundColor Yellow
./mvnw clean compile

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 컴파일 완료" -ForegroundColor Green
    Write-Host "🗄️ Flyway 마이그레이션 실행 중..." -ForegroundColor Cyan
    
    # Flyway 마이그레이션 먼저 실행
    ./mvnw flyway:migrate -Dspring.profiles.active=dev
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ 데이터베이스 마이그레이션 완료" -ForegroundColor Green
        Write-Host "🔄 개발 환경으로 애플리케이션 시작 중..." -ForegroundColor Yellow
        
        # 개발 프로필로 실행 (Flyway 관리 + 실제 DB 데이터)
        ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
    } else {
        Write-Host "❌ 마이그레이션 실패" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ 컴파일 실패" -ForegroundColor Red
    exit 1
}

Set-Location "..\..\" 