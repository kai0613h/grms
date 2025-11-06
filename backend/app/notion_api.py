# notion_api.py
from fastapi import APIRouter, Query, Depends, HTTPException
import requests
import json
import os
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from pdf_generator import pdf_router

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, distinct
from database import get_db_session
# from models.notion import Laboratory, Year, Notion, Student, ContactTime
from models.notion import Notion, ContactTime
import uuid


# --- 🔑 Notion API 設定 ---
NOTION_TOKEN = os.getenv("NOTION_TOKEN")
HEADERS = {
    "Authorization": f"Bearer {NOTION_TOKEN}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json"
}


notion_router = APIRouter()


class StudentData(BaseModel):
    student_number: str
    student_name: str
    theme: str

class TaskData(BaseModel):
    student_name: str
    start_time: str
    end_time: str
    summary: str



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

    



def print_curl_debug(method, url, headers=None, json_payload=None):
    curl_cmd = f"curl -X {method} '{url}'"
    if headers:
        for key, value in headers.items():
            curl_cmd += f" \\\n  -H '{key}: {value}'"
    if json_payload:
        json_str = json.dumps(json_payload)
        curl_cmd += f" \\\n  -d '{json_str}'"
    curl_cmd += " | jq .\n"
    print(curl_cmd)


def extract_student_page_data(student_page):
    properties = student_page["properties"]
    student_name = properties["Name"]["title"][0]["text"]["content"] if properties["Name"]["title"] else "Unknown"
    student_number = properties["学生番号"]["number"] if "学生番号" in properties and properties["学生番号"]["number"] is not None else "Unknown"
    theme = properties["卒研テーマ"]["rich_text"][0]["text"]["content"] if properties["卒研テーマ"]["rich_text"] else "Unknown"
    total_contact_time = properties["総コンタクトタイム"]["rollup"]["number"] if properties["総コンタクトタイム"]["rollup"] else "Unknown"
    
    student_page_data = {
        "student_number": student_number,
        "student_name": student_name,
        "theme": theme,
        "total_contact_time": total_contact_time
    }

    return student_page_data


def extract_task_page_data(task_page):
    properties = task_page["properties"]
    
    student_name = "Unknown"
    if "名前" in properties and properties["名前"]["type"] == "relation" and len(properties["名前"]["relation"]) > 0:
        rel_page_id = properties["名前"]["relation"][0]["id"]
        rel_page = retrieve_page(rel_page_id)
        student_name = rel_page["properties"]["Name"]["title"][0]["plain_text"]

    start_time = properties["開始時間"]["date"]["start"] if properties["開始時間"]["date"] else "Unknown"
    end_time = properties["終了時間"]["date"]["start"] if properties["終了時間"]["date"] else "Unknown"
    summary = properties["作業要約"]["rich_text"][0]["text"]["content"] if properties["作業要約"]["rich_text"] else "Unknown"
    excluded_time = properties["除外時間(分)"]["number"] if properties["除外時間(分)"]["number"] else "Unknown"
    working_time= properties["作業時間(分)"]["formula"]["number"] if properties["作業時間(分)"]["formula"] else "Unknown"

    task_page_data = {
        "student_name": student_name,
        "start_time": start_time,
        "end_time": end_time,
        "excluded_time": excluded_time,
        "working_time": working_time,
        "summary": summary,
    }

    return task_page_data

def insert_db(laboratory_name, student_data, student_task_data, year):
    print("laboratory_name", laboratory_name, "student_data", student_data, "student_task_data", student_task_data, "year", year)
    return {
        "laboratory_name": laboratory_name,
        "year": year,
        "student_data": student_data,
        "student_task_data": student_task_data
    }



# =====================================================
# 基本APIラッパー関数
# =====================================================
def query_database(database_id, filter_json=None):
    url = f"https://api.notion.com/v1/databases/{database_id}/query"
    payload = {}
    if filter_json:
        payload["filter"] = filter_json
    print_curl_debug("POST", url, headers=HEADERS, json_payload=payload)
    res = requests.post(url, headers=HEADERS, json=payload)
    res.raise_for_status()
    return res.json()["results"]


def get_block_children(block_id):
    url = f"https://api.notion.com/v1/blocks/{block_id}/children"
    print_curl_debug("GET", url, headers=HEADERS)
    res = requests.get(url, headers=HEADERS)
    res.raise_for_status()
    data = res.json()
    print(f"    📡 [DEBUG] Response from Notion: {json.dumps(data, indent=2)}")
    return res.json()["results"]


def retrieve_page(page_id):
    url = f"https://api.notion.com/v1/pages/{page_id}"
    print_curl_debug("GET", url, headers=HEADERS)
    res = requests.get(url, headers=HEADERS)
    res.raise_for_status()
    return res.json()


def find_toggle_by_text(blocks, keyword):
    for block in blocks:
        if block["type"] == "toggle":
            rich_texts = block.get("toggle", {}).get("rich_text", [])
            for text in rich_texts:
                if text.get("type") == "text" and keyword in text["text"]["content"]:
                    return block
    return None

def get_database_properties(database_id):
    url = f"https://api.notion.com/v1/databases/{database_id}"
    print_curl_debug("GET", url, headers=HEADERS)
    res = requests.get(url, headers=HEADERS)
    res.raise_for_status()
    return res.json()

def find_toggle_by_text(blocks, keyword):
    """
    トグルを検索し、指定されたキーワードが含まれるトグルを返す
    """
    for block in blocks:
        if block["type"] == "toggle":
            rich_texts = block.get("toggle", {}).get("rich_text", [])
            for text in rich_texts:
                if text.get("type") == "text" and keyword in text["text"]["content"]:
                    return block
    return None



# =====================================================
# 研究室のnotion情報を取得
# =====================================================
def get_year_database_blocks(laboratory_page_id: str) -> List[Dict[str, Any]]:
    """研究室ページ配下の年度データベース(child_database)ブロックを取得"""
    blocks = get_block_children(laboratory_page_id)
    return [b for b in blocks if b["type"] == "child_database"]


def get_thesis_pages(year_database_id: str) -> List[Dict[str, Any]]:
    """年度データベース内の年度ページ情報を取得"""
    pages = query_database(year_database_id)
    thesis_pages = []
    for p in pages:
        subpage_id = p["id"]
        title = p["properties"]["名前"]["title"][0]["text"]["content"] if "名前" in p["properties"] else "No Title"
        year = p["properties"]["年度"]["number"] if "年度" in p["properties"] else None
        thesis_pages.append({
            "title": title,
            "year": year,
            "thesis_page_id": subpage_id
        })
    return thesis_pages


def get_student_and_task_page_ids(thesis_page_id: str) -> Dict[str, Optional[str]]:
    """年度ページ（thesis_page）内の「学生」「卒研作業タスク」DBのIDを取得"""
    student_page_id = None
    task_page_id = None

    sub_blocks = get_block_children(thesis_page_id)
    toggle = find_toggle_by_text(sub_blocks, "共通データベース")
    if not toggle:
        print(f"⚠️ 共通データベーストグルが見つかりません ({thesis_page_id})")
        return {
            "student_page_id": None,
            "task_page_id": None
        }

    toggle_children = get_block_children(toggle["id"])
    for inner_block in toggle_children:
        if inner_block["type"] != "child_database":
            continue
        db_title = inner_block["child_database"].get("title", "")
        db_id = inner_block["id"]
        if db_title == "学生":
            student_page_id = db_id
            print(f"👩‍🎓 学生DB ID: {db_id}")
        elif db_title == "卒研作業タスク":
            task_page_id = db_id
            print(f"🧩 卒研作業タスクDB ID: {db_id}")

    return {
        "student_page_id": student_page_id,
        "task_page_id": task_page_id
    }

# =====================================================
# DB連携
# =====================================================
# # 研究室情報とその関連する年度ページを一度に取得
# async def get_laboratory_with_theses(db: AsyncSession, laboratory_name: str):
#     stmt = select(Laboratory).filter(Laboratory.name == laboratory_name).options(selectinload(Laboratory.thesis_pages))
#     result = await db.execute(stmt)
#     laboratory = result.scalar_one_or_none()
    
#     if laboratory:
#         return {
#             "laboratory_name": laboratory.name,
#             "thesis_pages": [{
#                 "year": thesis_page.year,
#                 "thesis_page_id": thesis_page.thesis_page_id,
#                 "student_page_id": thesis_page.student_page_id,
#                 "task_page_id": thesis_page.task_page_id
#             } for thesis_page in laboratory.thesis_pages]
#         }
#     return None

# async def save_laboratories_to_db(labs: List[dict], db: AsyncSession):
#     """
#     Notionから取得した研究室情報をDBに保存
#     """
#     for lab in labs:
#         # 既存の研究室がある場合は取得、なければ作成
#         stmt = select(Laboratory).where(Laboratory.name == lab["laboratory_name"])
#         result = await db.execute(stmt)
#         laboratory = result.scalar_one_or_none()
        
#         if not laboratory:
#             laboratory = Laboratory(name=lab["laboratory_name"])
#             db.add(laboratory)
#             await db.flush()  # id を取得するために flush

#         for page in lab["thesis_pages"]:
#             # すでに存在するか確認
#             stmt2 = select(ThesisPage).where(ThesisPage.thesis_page_id == page["thesis_page_id"])
#             result2 = await db.execute(stmt2)
#             thesis_page = result2.scalar_one_or_none()

#             if not thesis_page:
#                 thesis_page = ThesisPage(
#                     thesis_page_id=page["thesis_page_id"],
#                     year=page["year"],
#                     student_page_id=page["student_page_id"],
#                     task_page_id=page["task_page_id"],
#                     laboratory=laboratory
#                 )
#                 db.add(thesis_page)

#     await db.commit()


# =====================================================
# APIエンドポイント
# =====================================================

@notion_router.post("/laboratories/reflesh")
async def update_laboratory_notion_data(
    root_database_id: str = Query(..., description="NotionのルートデータベースID"),
    db: AsyncSession = Depends(get_db_session),
):
    """Notionの最新研究室データをDBに保存するEP"""
    laboratory_database = query_database(root_database_id)

    print(f"🟦 Root Database: {root_database_id}")

    for lab_page in laboratory_database:
        try:
            # 研究室名を取得
            laboratory_name = lab_page["properties"]["名前"]["title"][0]["text"]["content"]
            print(f"研究室名: {laboratory_name}")
            lab_page_id = lab_page["id"]

            if not laboratory_name:
                raise ValueError(f"研究室名が空です (page_id={lab_page_id})")

            # 年度データベース(child_database)を取得
            for year_block in get_year_database_blocks(lab_page_id):
                year_database_id = year_block["id"]
                print(f"  📘 年度DB ID: {year_database_id}")

                # 年度ページ(卒研テーマページ)を取得
                thesis_pages = get_thesis_pages(year_database_id)
                for page in thesis_pages:
                    # page から直接 title と year を取得
                    title = page.get("title", "No Title")
                    year = page.get("year", None)

                    # 学生DBとタスクDBのIDを取得
                    ids = get_student_and_task_page_ids(page["thesis_page_id"])

                    # UUID チェック
                    print(f"UUID チェック")
                    if not all([page["thesis_page_id"], ids.get("student_page_id"), ids.get("task_page_id")]):
                        raise ValueError(
                            f"Thesis/Student/Task UUID が不正です (thesis_page_id={page.get('thesis_page_id')})"
                        )

                    # DBに保存
                    notion_entry = Notion(
                        laboratory_name=laboratory_name,
                        title=title,
                        year=year,
                        thesis_page_id=uuid.UUID(page["thesis_page_id"]),
                        student_page_id=uuid.UUID(ids["student_page_id"]),
                        task_page_id=uuid.UUID(ids["task_page_id"]),
                    )
                    db.add(notion_entry)

        except Exception as e:
            # データ不備や KeyError はここでログ出力
            print(f"⚠️ データ不備: {e}")
            continue

    # コミット
    await db.commit()
    return {"message": "NotionデータをDBに保存しました"}


@notion_router.get("/laboratories")
async def get_laboratory_notion_data(
    root_database_id: str = Query(None, description="NotionのルートデータベースID"),
    db: AsyncSession = Depends(get_db_session),
):
    """DBに保存されたNotionデータを返す。なければNotion APIから取得。保存も行う"""
    """
    指定された root_database_id から:
      ・研究室名
      ・年度データベースID
      ・各年度ページの情報（タイトル・年度・ID）
      ・各年度ページに紐づく「学生」DBと「卒研作業タスク」DBのID
    を返すAPI
    """
    result = []

    notion_entries = await db.execute(select(Notion))
    notion_entries = notion_entries.scalars().all()

    # root_database_id が指定されていない場合は最新情報取得をスキップ
    if not notion_entries and root_database_id:
        # データがなければNotion APIから取得してDBに保存
        await update_laboratory_notion_data(root_database_id=root_database_id, db=db)
        notion_entries = await db.execute(select(Notion))
        notion_entries = notion_entries.scalars().all()

    # データがない場合は 404
    if not notion_entries:
        raise HTTPException(status_code=404, detail="Notionデータが存在しません")

    
    lab_dict = {}
    for entry in notion_entries:
        lab_name = entry.laboratory_name or "不明"
        if lab_name not in lab_dict:
            lab_dict[lab_name] = []
        lab_dict[lab_name].append({
            "title": entry.title,
            "year": entry.year,
            "thesis_page_id": str(entry.thesis_page_id),
            "student_page_id": str(entry.student_page_id),
            "task_page_id": str(entry.task_page_id)
        })

    for lab_name, thesis_pages in lab_dict.items():
        result.append({
            "laboratory_name": lab_name,
            "thesis_pages": thesis_pages
        })

    return {"count": len(result), "laboratories": result}


@notion_router.get("/laboratory_name")
async def get_laboratory_name(
    year: int | None = Query(None, description="年度でフィルター"),
    db: AsyncSession = Depends(get_db_session),
):
    """
    研究室名を重複なしで取得する。
    year が指定されていればその年度の研究室のみ返す。
    """
    query = select(distinct(Notion.laboratory_name))
    if year is not None:
        query = query.where(Notion.year == year)

    result = await db.execute(query)
    laboratories = result.scalars().all()

    if not laboratories:
        raise HTTPException(status_code=404, detail="該当する研究室データが存在しません")

    return {"count": len(laboratories), "laboratories": laboratories}


@notion_router.get("/laboratory_students")
async def get_students_by_lab_and_year(
    laboratory_name: str = Query(..., description="研究室名"),
    year: int = Query(..., description="年度"),
    db: AsyncSession = Depends(get_db_session),
):
    """
    年度と研究室名から student_page_id を取得し、そのDBの学生情報を返す
    """
    # DBから該当する student_page_id を取得
    query = select(Notion.student_page_id).where(
        Notion.laboratory_name == laboratory_name,
        Notion.year == year
    )
    result = await db.execute(query)
    student_page_id = result.scalar()

    if not student_page_id:
        raise HTTPException(status_code=404, detail="指定された研究室・年度の学生データが存在しません")

    # student_page_id を使って Notion データ取得
    student_pages = query_database(str(student_page_id))
    students = []
    for student_page in student_pages:
        student_data = extract_student_page_data(student_page)
        if student_data.get("student_name") == "共通":
            continue
        students.append(student_data)

    students_sorted = sorted(students, key=lambda x: x['student_number'])

    return {"students": students_sorted}




@notion_router.get("/laboratory_tasks")
async def get_tasks_by_lab_and_year(
    laboratory_name: str = Query(..., description="研究室名"),
    year: int = Query(..., description="年度"),
    student_name: str = Query(None, description="学生名（任意）"),
    db: AsyncSession = Depends(get_db_session),
):
    """
    年度と研究室名から task_page_id を取得し、そのDBのコンタクトタイム情報を返す
    """
    # DBから該当する task_page_id を取得
    query = select(Notion.task_page_id).where(
        Notion.laboratory_name == laboratory_name,
        Notion.year == year
    )
    result = await db.execute(query)
    task_page_id = result.scalar()

    task_pages = query_database(task_page_id)
    student_tasks = {}

    for task_page in task_pages:
        task_data = extract_task_page_data(task_page)

        # student_nameが指定されている場合、フィルタリング
        if student_name and task_data["student_name"] != student_name:
            continue
        
        # 学生ごとにタスク情報をまとめる
        student_tasks.setdefault(task_data["student_name"], []).append(task_data)

    # student_nameが指定されている場合、その学生のタスクだけ返す
    if student_name:
        # 指定された学生のタスク情報を返す
        student_info = student_tasks.get(student_name, [])
        # 学生ごとの作業時間合計を計算
        total_working_time = sum(task["working_time"] for task in student_info)
        for task in student_info:
            task["total_working_time"] = total_working_time
        
        return {student_name: student_info}
    
    # student_nameが指定されていない場合、全学生のタスク情報をまとめて返す
    else:
        # 学生ごとに作業時間合計を計算
        for student_name, tasks in student_tasks.items():
            total_working_time = sum(task["working_time"] for task in tasks)
            for task in tasks:
                task["total_working_time"] = total_working_time
        
        return student_tasks



"""
# ROOT_DATABASE_ID: 20ab77e257b580d0a8d4fffaeb4f02f9
{
  "count": 2,
  "laboratories": [
    {
      "laboratory_name": "小林研究室",
      "thesis_pages": [
        {
          "title": "令和7年度卒研",
          "year": 2025,
          "thesis_page_id": "20ab77e2-57b5-80f6-b5de-cbaa96a91cc2",
          "student_page_id": "20ab77e2-57b5-811e-b77c-caddd72f6f1f",
          "task_page_id": "20ab77e2-57b5-81b1-a770-ca8ebcfa5a56"
        },
        {
          "title": "令和8年度卒研",
          "year": 2026,
          "thesis_page_id": "227b77e2-57b5-809e-8e90-fc0d4e134c22",
          "student_page_id": "227b77e2-57b5-81b4-ab19-d7c3a6da0e78",
          "task_page_id": "227b77e2-57b5-818e-9f04-c9306ee4a5b5"
        }
      ]
    },
    {
      "laboratory_name": "佐藤研究室",
      "thesis_pages": [
        {
          "title": "令和7年度卒研",
          "year": 2025,
          "thesis_page_id": "296b77e2-57b5-81ac-8415-f2175caebb84",
          "student_page_id": "296b77e2-57b5-8176-9eee-d84b82c7bd3a",
          "task_page_id": "296b77e2-57b5-8173-a6af-c0af0b632456"
        },
        {
          "title": "令和8年度卒研",
          "year": 2026,
          "thesis_page_id": "296b77e2-57b5-81c4-bcaa-e5228dc40fc4",
          "student_page_id": "296b77e2-57b5-8161-86bd-f20b939d993f",
          "task_page_id": "296b77e2-57b5-8177-8dc1-f5f3cebbc612"
        }
      ]
    }
  ]
}
"""


"""
{
  "青木": [
    {
      "student_name": "青木",
      "start_time": "2025-07-04T09:06:00.000+09:00",
      "end_time": "2025-07-04T09:08:00.000+09:00",
      "excluded_time": "Unknown",
      "working_time": 2,
      "summary": "AI導入の作業記録では、振り返りとして「とても良かった」と評価されています。",
      "total_working_time": 9
    },
    {
      "student_name": "青木",
      "start_time": "2025-10-24T09:30:00.000+09:00",
      "end_time": "2025-10-24T09:39:00.000+09:00",
      "excluded_time": 2,
      "working_time": 7,
      "summary": "システムの構築が行われ、作業はとても良かったと振り返られています。開始時間は2025年10月24日9:30 (JST)で、除外時間は2分です。",
      "total_working_time": 9
    }
  ]
}"""