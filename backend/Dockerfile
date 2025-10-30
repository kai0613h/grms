# backend/Dockerfile
FROM python:3.11-bookworm

WORKDIR /app

# システム依存パッケージ（必要なら追加）
RUN apt-get update --fix-missing \
    && apt-get install -y --no-install-recommends gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
