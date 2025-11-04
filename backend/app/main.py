from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from notion_api import notion_router
from papers import router as papers_router
from pdf_generator import pdf_router
from conference_api import conference_router

# Import models to ensure metadata is registered before startup
import models  # noqa: F401

app = FastAPI()
app.include_router(pdf_router, prefix="/pdf")
app.include_router(notion_router, prefix="/notion")
app.include_router(papers_router)
app.include_router(conference_router)


# CORS設定（フロントエンドが http://localhost:3000 で動いている想定）
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://0.0.0.0:3000",
    "http://0.0.0.0:5173",
    "http://host.docker.internal:3000",
    "http://host.docker.internal:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

"""
contact_time_data = {
    "studentName": ,
    "laboratory": ,
    "theme": ,
    "reportDate": ,
    "startTime": ,
    "endTime": ,
    "summary": ,
    "details": ,
}
"""

"""
student = {
    "student_number": ,
    "student_name": ,
    "laboratory": ,
    "theme": ,
    "year": ,
}
"""


@app.on_event("startup")
async def on_startup():
    await init_db()
