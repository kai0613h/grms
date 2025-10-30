# notion_api.py
from fastapi import APIRouter, Query
import requests
import json
import os
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from pdf_generator import pdf_router


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
    
    student_page_data = {
        "student_number": student_number,
        "student_name": student_name,
        "theme": theme,
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

    task_page_data = {
        "student_name": student_name,
        "start_time": start_time,
        "end_time": end_time,
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


def get_student_and_task_database_ids(thesis_page_id: str) -> Dict[str, Optional[str]]:
    """年度ページ（thesis_page）内の「学生」「卒研作業タスク」DBのIDを取得"""
    student_database_id = None
    task_database_id = None

    sub_blocks = get_block_children(thesis_page_id)
    toggle = find_toggle_by_text(sub_blocks, "共通データベース")
    if not toggle:
        print(f"⚠️ 共通データベーストグルが見つかりません ({thesis_page_id})")
        return {
            "student_database_id": None,
            "task_database_id": None
        }

    toggle_children = get_block_children(toggle["id"])
    for inner_block in toggle_children:
        if inner_block["type"] != "child_database":
            continue
        db_title = inner_block["child_database"].get("title", "")
        db_id = inner_block["id"]
        if db_title == "学生":
            student_database_id = db_id
            print(f"👩‍🎓 学生DB ID: {db_id}")
        elif db_title == "卒研作業タスク":
            task_database_id = db_id
            print(f"🧩 卒研作業タスクDB ID: {db_id}")

    return {
        "student_database_id": student_database_id,
        "task_database_id": task_database_id
    }

# =====================================================
# APIエンドポイント
# =====================================================

@notion_router.get("/laboratories")
def get_laboratory_data(
    root_database_id: str = Query(..., description="NotionのルートデータベースID")
):
    """
    指定された root_database_id から:
      ・研究室名
      ・年度データベースID
      ・各年度ページの情報（タイトル・年度・ID）
      ・各年度ページに紐づく「学生」DBと「卒研作業タスク」DBのID
    を返すAPI
    """
    results = []

    print(f"🟦 Root Database: {root_database_id}")
    laboratory_database = query_database(root_database_id)

    for laboratory_page in laboratory_database:
        try:
            laboratory_name = laboratory_page["properties"]["名前"]["title"][0]["text"]["content"]
            print(f"研究室名: {laboratory_name}")
            lab_page_id = laboratory_page["id"]

            thesis_pages_all = []
            # 年度データベース(child_database)を探す
            for year_block in get_year_database_blocks(lab_page_id):
                year_database_id = year_block["id"]
                year_db_title = year_block["child_database"].get("title", "No Title")
                print(f"  📘 年度DB: {year_db_title} (ID: {year_database_id})")

                # 年度ページを取得
                thesis_pages = get_thesis_pages(year_database_id)

                # 各年度ページに「学生」「タスク」DB IDを付与
                for page in thesis_pages:
                    ids = get_student_and_task_database_ids(page["thesis_page_id"])
                    page.update(ids)
                    thesis_pages_all.append(page)

            results.append({
                "laboratory_name": laboratory_name,
                "thesis_pages": thesis_pages_all
            })

        except Exception as e:
            print(f"⚠️ エラー: {e}")
            continue

    return {"count": len(results), "laboratories": results}


@notion_router.get("/students")
def get_students(student_database_id: str = Query(..., description="学生データベースID")):
    """
    指定した学生データベースIDから学生情報を取得して返す
    """
    student_pages = query_database(student_database_id)
    results = []

    for student_page in student_pages:
        student_data = extract_student_page_data(student_page)
        if student_data["student_name"] == "共通":  # 共通データは除外
            continue
        results.append(student_data)

    return {"student_database_id": student_database_id, "students": results}


@notion_router.get("/tasks")
def get_tasks(task_database_id: str = Query(..., description="卒研作業タスクデータベースID")):
    """
    指定したタスクデータベースIDから卒研作業タスク情報を取得して返す
    """
    task_pages = query_database(task_database_id)
    results = []

    for task_page in task_pages:
        task_data = extract_task_page_data(task_page)
        results.append(task_data)

    return {"task_database_id": task_database_id, "tasks": results}



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
          "student_database_id": "20ab77e2-57b5-811e-b77c-caddd72f6f1f",
          "task_database_id": "20ab77e2-57b5-81b1-a770-ca8ebcfa5a56"
        },
        {
          "title": "令和8年度卒研",
          "year": 2026,
          "thesis_page_id": "227b77e2-57b5-809e-8e90-fc0d4e134c22",
          "student_database_id": "227b77e2-57b5-81b4-ab19-d7c3a6da0e78",
          "task_database_id": "227b77e2-57b5-818e-9f04-c9306ee4a5b5"
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
          "student_database_id": "296b77e2-57b5-8176-9eee-d84b82c7bd3a",
          "task_database_id": "296b77e2-57b5-8173-a6af-c0af0b632456"
        },
        {
          "title": "令和8年度卒研",
          "year": 2026,
          "thesis_page_id": "296b77e2-57b5-81c4-bcaa-e5228dc40fc4",
          "student_database_id": "296b77e2-57b5-8161-86bd-f20b939d993f",
          "task_database_id": "296b77e2-57b5-8177-8dc1-f5f3cebbc612"
        }
      ]
    }
  ]
}
"""
