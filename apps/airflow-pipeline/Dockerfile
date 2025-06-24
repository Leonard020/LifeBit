FROM apache/airflow:2.7.1-python3.11

# 사용자를 root로 변경하여 패키지 설치
USER root

# 시스템 패키지 설치
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# airflow 사용자로 돌아가기
USER airflow

# requirements.txt 복사 및 패키지 설치
COPY requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

# DAG 파일들 복사
COPY dags/ ${AIRFLOW_HOME}/dags/

# 환경 변수 설정
ENV AIRFLOW__CORE__EXECUTOR=LocalExecutor
ENV AIRFLOW__DATABASE__SQL_ALCHEMY_CONN=postgresql+psycopg2://lifebit_user:lifebit_password@postgres-db:5432/lifebit_db
ENV AIRFLOW__CORE__FERNET_KEY=your-fernet-key-here
ENV AIRFLOW__WEBSERVER__SECRET_KEY=your-secret-key-here

# 포트 노출
EXPOSE 8080

# Airflow 웹서버 시작
CMD ["airflow", "webserver"] 