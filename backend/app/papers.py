import json
from datetime import datetime
import urllib.parse
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel, Field, validator
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db_session
from models.paper import Paper


MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


class PaperResponse(BaseModel):
    id: UUID
    filename: str
    content_type: str
    file_size: int
    tags: List[str] = Field(default_factory=list)
    uploaded_by: Optional[str] = None
    description: Optional[str] = None
    uploaded_at: Optional[datetime] = None

    @validator("tags", pre=True, always=True)
    @classmethod
    def ensure_tags(cls, value):
        if not value:
            return []
        if isinstance(value, list):
            cleaned: List[str] = []
            for tag in value:
                if isinstance(tag, str) and tag.strip():
                    cleaned.append(tag.strip())
                elif isinstance(tag, bytes):
                    try:
                        decoded = tag.decode("utf-8").strip()
                    except UnicodeDecodeError:
                        continue
                    if decoded:
                        cleaned.append(decoded)
            return cleaned
        return []

def _paper_to_response(paper: Paper) -> PaperResponse:
    return PaperResponse(
        id=paper.id,
        filename=paper.filename,
        content_type=paper.content_type,
        file_size=paper.file_size,
        tags=list(paper.tags or []),
        uploaded_by=paper.uploaded_by,
        description=paper.description,
        uploaded_at=paper.uploaded_at,
    )


router = APIRouter(prefix="/papers", tags=["papers"])


def _parse_tags(raw_tags: Optional[str]) -> List[str]:
    if not raw_tags:
        return []

    try:
        parsed = json.loads(raw_tags)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="tags must be a JSON array of strings") from exc

    if not isinstance(parsed, list) or any(not isinstance(tag, str) for tag in parsed):
        raise HTTPException(status_code=400, detail="tags must be a JSON array of strings")

    # Remove duplicates while preserving order
    seen = set()
    unique_tags = []
    for tag in parsed:
        normalized = tag.strip()
        if normalized and normalized not in seen:
            seen.add(normalized)
            unique_tags.append(normalized)
    return unique_tags


@router.post("/", response_model=PaperResponse)
async def upload_paper(
    file: UploadFile = File(..., description="研究論文ファイル"),
    tags: Optional[str] = Form(None, description="JSON配列形式のタグ"),
    uploaded_by: Optional[str] = Form(None, description="アップロード者名"),
    description: Optional[str] = Form(None, description="補足説明"),
    session: AsyncSession = Depends(get_db_session),
) -> PaperResponse:
    data = await file.read()

    if not data:
        raise HTTPException(status_code=400, detail="空のファイルはアップロードできません。")

    if len(data) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="ファイルサイズが上限（10MB）を超えています。")

    paper = Paper(
        filename=file.filename,
        content_type=file.content_type or "application/octet-stream",
        file_size=len(data),
        tags=_parse_tags(tags),
        uploaded_by=uploaded_by.strip() if uploaded_by else None,
        description=description.strip() if description else None,
        data=data,
    )

    session.add(paper)
    await session.commit()
    await session.refresh(paper)
    return _paper_to_response(paper)


@router.get("/", response_model=List[PaperResponse])
async def list_papers(
    search: Optional[str] = Query(None, description="ファイル名または説明に対する部分一致検索"),
    tag: Optional[str] = Query(None, description="タグ名"),
    uploaded_by: Optional[str] = Query(None, description="アップロード者名の部分一致"),
    session: AsyncSession = Depends(get_db_session),
) -> List[PaperResponse]:
    stmt = select(Paper)

    if search:
        pattern = f"%{search.lower()}%"
        stmt = stmt.where(
            func.lower(Paper.filename).like(pattern)
            | func.lower(func.coalesce(Paper.description, "")).like(pattern)
        )

    if uploaded_by:
        stmt = stmt.where(
            func.lower(func.coalesce(Paper.uploaded_by, "")).like(f"%{uploaded_by.lower()}%")
        )

    stmt = stmt.order_by(Paper.uploaded_at.desc())

    result = await session.execute(stmt)
    records = result.scalars().all()

    if tag:
        lowered = tag.lower()
        records = [
            record
            for record in records
            if any(isinstance(t, str) and t.lower() == lowered for t in (record.tags or []))
        ]

    return [_paper_to_response(record) for record in records]


@router.get("/{paper_id}", response_model=PaperResponse)
async def get_paper(
    paper_id: UUID,
    session: AsyncSession = Depends(get_db_session),
) -> PaperResponse:
    result = await session.execute(select(Paper).where(Paper.id == paper_id))
    paper = result.scalars().first()
    if not paper:
        raise HTTPException(status_code=404, detail="指定された論文が見つかりません。")
    return _paper_to_response(paper)


@router.delete("/{paper_id}", status_code=204)
async def delete_paper(
    paper_id: UUID,
    session: AsyncSession = Depends(get_db_session),
):
    result = await session.execute(select(Paper).where(Paper.id == paper_id))
    paper = result.scalars().first()
    if not paper:
        raise HTTPException(status_code=404, detail="指定された論文が見つかりません。")

    await session.delete(paper)
    await session.commit()
    return Response(status_code=204)


@router.get("/{paper_id}/download")
async def download_paper(
    paper_id: UUID,
    session: AsyncSession = Depends(get_db_session),
) -> Response:
    result = await session.execute(select(Paper).where(Paper.id == paper_id))
    paper = result.scalars().first()
    if not paper:
        raise HTTPException(status_code=404, detail="指定された論文が見つかりません。")

    filename = paper.filename or f"{paper.id}.bin"
    try:
        ascii_filename = filename.encode("ascii").decode("ascii")
        content_disposition = f'attachment; filename="{ascii_filename}"'
    except UnicodeEncodeError:
        quoted = urllib.parse.quote(filename)
        content_disposition = f"attachment; filename*=UTF-8''{quoted}"

    headers = {
        "Content-Disposition": content_disposition,
    }
    return Response(content=paper.data, media_type=paper.content_type, headers=headers)
