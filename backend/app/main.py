import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from notion_api import notion_router
from papers import router as papers_router
from pdf_generator import pdf_router
from conference_api import conference_router

# --- FastAPI アプリ ---
app = FastAPI()
app.include_router(pdf_router, prefix="/pdf")
app.include_router(notion_router, prefix="/notion")
app.include_router(papers_router)
app.include_router(conference_router)

# --- CORS設定 ---
# 環境変数 FRONTEND_URL を直接使用
FRONTEND_URL = os.getenv("FRONTEND_URL")
if not FRONTEND_URL:
    raise RuntimeError("FRONTEND_URL environment variable is not set.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_URL,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 起動時処理 ---
@app.on_event("startup")
async def on_startup():
    await init_db()
