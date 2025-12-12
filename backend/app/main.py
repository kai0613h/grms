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

# --- CORS設定 ---
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

env_frontend_url = os.getenv("FRONTEND_URL")
if env_frontend_url:
    origins.extend([url.strip() for url in env_frontend_url.split(",")])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pdf_router, prefix="/pdf")
app.include_router(notion_router, prefix="/notion")
app.include_router(papers_router)
app.include_router(conference_router)

# --- 起動時処理 ---
@app.on_event("startup")
async def on_startup():
    await init_db()
