from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pdf_generator import pdf_router
from notion_api import notion_router



app = FastAPI()
app.include_router(pdf_router, prefix="/pdf")
app.include_router(notion_router, prefix="/notion")


# CORS設定（フロントエンドが http://localhost:3000 で動いている想定）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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

    


