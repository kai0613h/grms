# backend/Dockerfile
FROM python:3.11-bookworm

# 作業ディレクトリ
WORKDIR /app

# システム依存パッケージ（LaTeX用）
RUN apt-get update --fix-missing \
    && apt-get install -y --no-install-recommends \
       gcc \
       libpq-dev \
       texlive-base \
       texlive-latex-base \
       texlive-latex-recommended \
       texlive-lang-japanese \
       latexmk \
    && rm -rf /var/lib/apt/lists/*

# Pythonパッケージ
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションコピー
COPY backend/app/ .

# コンテナ起動コマンド
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
