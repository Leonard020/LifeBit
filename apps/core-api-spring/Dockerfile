# Build stage
FROM maven:3.9.5-amazoncorretto-21 AS build

WORKDIR /app

# Maven 의존성 캐싱을 위해 pom.xml을 먼저 복사
COPY pom.xml .
RUN mvn dependency:go-offline -B

# 소스 코드 복사 및 빌드
COPY src ./src
RUN mvn clean package -DskipTests

# Runtime stage
FROM amazoncorretto:21-alpine

WORKDIR /app

# 빌드된 JAR 파일 복사
COPY --from=build /app/target/*.jar app.jar

# 포트 노출
EXPOSE 8080

# 환경 변수 설정
ENV JAVA_OPTS="-Xmx512m -Xms256m"
ENV SPRING_PROFILES_ACTIVE=docker

# 애플리케이션 실행
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"] 