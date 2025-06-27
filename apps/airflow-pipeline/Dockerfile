# Base image
FROM apache/airflow:3.0.2

# Install dependencies from requirements.txt
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt 