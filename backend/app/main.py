from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import requests
import json
import os
from typing import Optional

# --- 🔑 Notion API 設定 ---
NOTION_TOKEN = os.getenv("NOTION_TOKEN")
HEADERS = {
    "Authorization": f"Bearer {NOTION_TOKEN}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json"
}

app = FastAPI()

# CORS設定（フロントエンドが http://localhost:3000 で動いている想定）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 🔧 APIラッパー関数 ---
def query_database(database_id, filter_json=None):
    url = f"https://api.notion.com/v1/databases/{database_id}/query"
    payload = {}
    if filter_json:
        payload["filter"] = filter_json
    res = requests.post(url, headers=HEADERS, json=payload)
    res.raise_for_status()
    return res.json()["results"]

def get_block_children(block_id):
    url = f"https://api.notion.com/v1/blocks/{block_id}/children"
    res = requests.get(url, headers=HEADERS)
    res.raise_for_status()
    return res.json()["results"]

def retrieve_page(page_id):
    url = f"https://api.notion.com/v1/pages/{page_id}"
    res = requests.get(url, headers=HEADERS)
    res.raise_for_status()
    return res.json()

# --- データ抽出関数 ---
def extract_student_page_data(student_page):
    properties = student_page["properties"]
    student_name = properties["Name"]["title"][0]["text"]["content"] if properties["Name"]["title"] else "Unknown"
    student_number = properties.get("学生番号", {}).get("number") or "Unknown"
    theme = properties.get("卒研テーマ", {}).get("rich_text", [{}])[0].get("text", {}).get("content", "Unknown")

    return {
        "student_number": student_number,
        "student_name": student_name,
        "theme": theme,
    }

def extract_task_page_data(task_page):
    properties = task_page["properties"]

    student_name = "Unknown"
    if "名前" in properties and properties["名前"]["type"] == "relation" and properties["名前"]["relation"]:
        rel_page_id = properties["名前"]["relation"][0]["id"]
        rel_page = retrieve_page(rel_page_id)
        student_name = rel_page["properties"]["Name"]["title"][0]["plain_text"]

    start_time = properties.get("開始時間", {}).get("date", {}).get("start", "Unknown")
    end_time = properties.get("終了時間", {}).get("date", {}).get("start", "Unknown")
    summary = properties.get("作業要約", {}).get("rich_text", [{}])[0].get("text", {}).get("content", "Unknown")

    return {
        "student_name": student_name,
        "start_time": start_time,
        "end_time": end_time,
        "summary": summary,
    }

# --- 再帰的に探索 ---
def walk_nested_structure(root_database_id, year: int):
    laboratory_database = query_database(root_database_id)

    results = []

    for laboratory_page in laboratory_database:
        page_id = laboratory_page["id"]
        blocks = get_block_children(page_id)

        for block in blocks:
            if block["type"] == "child_database":
                laboratory_name = laboratory_page["properties"]["名前"]["title"][0]["text"]["content"]

                student_data = []
                student_task_data = {}

                child_db_id = block["id"]
                filtered_pages = query_database(child_db_id, {
                    "property": "年度",
                    "number": {"equals": year}
                })

                for subpage in filtered_pages:
                    subpage_id = subpage["id"]
                    sub_blocks = get_block_children(subpage_id)

                    for inner_block in sub_blocks:
                        if inner_block["type"] == "child_database":
                            title = inner_block["child_database"].get("title", "")
                            nested_database_id = inner_block["id"]

                            if title == "学生":
                                student_pages = query_database(nested_database_id)
                                for student_page in student_pages:
                                    student_page_data = extract_student_page_data(student_page)
                                    if student_page_data["student_name"] == "共通":
                                        continue
                                    student_data.append(student_page_data)

                            elif title == "卒研作業タスク":
                                task_pages = query_database(nested_database_id)
                                for task_page in task_pages:
                                    task_page_data = extract_task_page_data(task_page)
                                    student_task_data.setdefault(task_page_data["student_name"], []).append(task_page_data)

                results.append({
                    "laboratory_name": laboratory_name,
                    "student_data": student_data,
                    "student_task_data": student_task_data,
                    "year": year
                })

    return results

# --- FastAPI エンドポイント ---
@app.get("/notion-data")
def get_notion_data(root_database_id: str = Query(...), year: int = Query(7)):
    """
    Notionから研究室データを取得
    - `root_database_id`: Notion の最上位DB ID
    - `year`: 年度 (例: 7)
    """
    try:
        data = walk_nested_structure(root_database_id, year)
        return {"status": "ok", "data": data}
    except Exception as e:
        return {"status": "error", "message": str(e)}
