import io
import urllib.parse
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel, Field, validator
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db_session
from models import AbstractSubmission, ProgramRecord, SubmissionThread
from pdf_generator import (
    Presentation,
    ScheduleData,
    Session as ScheduleSession,
    compile_latex_to_pdf,
    generate_latex,
)
from pypdf import PdfReader, PdfWriter


conference_router = APIRouter(prefix="/conference", tags=["conference"])


LABORATORY_CHOICES: Dict[str, int] = {
    "黒木研究室": 1,
    "小林研究室": 2,
    "大塚研究室": 3,
    "田中研究室": 4,
}

MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


def _parse_datetime(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=f"Invalid datetime format: {value}") from exc


def _quote_filename(filename: str) -> str:
    try:
        ascii_filename = filename.encode("ascii").decode("ascii")
        return f'attachment; filename="{ascii_filename}"'
    except UnicodeEncodeError:
        quoted = urllib.parse.quote(filename)
        return f"attachment; filename*=UTF-8''{quoted}"


class ThreadCreateRequest(BaseModel):
    name: str = Field(..., max_length=200)
    description: Optional[str] = None
    submission_deadline: Optional[datetime] = None
    event_datetime: Optional[datetime] = None
    event_location: Optional[str] = Field(None, max_length=200)


class ThreadResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    submission_deadline: Optional[datetime]
    event_datetime: Optional[datetime]
    event_location: Optional[str]
    created_at: datetime
    updated_at: datetime
    submission_count: int = 0


class SubmissionResponse(BaseModel):
    id: UUID
    thread_id: UUID
    student_number: str
    student_name: str
    laboratory: str
    laboratory_id: int
    title: str
    pdf_filename: str
    pdf_size: int
    submitted_at: datetime


class ThreadDetailResponse(ThreadResponse):
    submissions: List[SubmissionResponse] = Field(default_factory=list)


class ProgramSessionInput(BaseModel):
    type: str
    startTime: str
    endTime: str
    chair: Optional[str] = None
    timekeeper: Optional[str] = None

    @validator("type")
    def validate_type(cls, value: str) -> str:
        if value not in {"session", "break"}:
            raise ValueError("type must be either 'session' or 'break'")
        return value


class ProgramCreateRequest(BaseModel):
    thread_id: UUID
    courseName: str
    eventName: str
    eventTheme: str
    dateTime: str
    venue: str
    presentationDurationMinutes: int = 15
    sessions: List[ProgramSessionInput]
    title: Optional[str] = None
    description: Optional[str] = None

    @validator("presentationDurationMinutes")
    def validate_duration(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("presentationDurationMinutes must be positive")
        return value


class ProgramResponse(BaseModel):
    id: UUID
    thread_id: Optional[UUID]
    title: str
    description: Optional[str]
    metadata: Dict[str, Any] = Field(default_factory=dict)
    sessions: List[dict]
    presentation_order: List[dict]
    created_at: datetime
    updated_at: datetime


def _thread_to_response(thread: SubmissionThread, submission_count: int) -> ThreadResponse:
    return ThreadResponse(
        id=thread.id,
        name=thread.name,
        description=thread.description,
        submission_deadline=thread.submission_deadline,
        event_datetime=thread.event_datetime,
        event_location=thread.event_location,
        created_at=thread.created_at,
        updated_at=thread.updated_at,
        submission_count=submission_count,
    )


def _submission_to_response(submission: AbstractSubmission) -> SubmissionResponse:
    return SubmissionResponse(
        id=submission.id,
        thread_id=submission.thread_id,
        student_number=submission.student_number,
        student_name=submission.student_name,
        laboratory=submission.laboratory,
        laboratory_id=submission.laboratory_id,
        title=submission.title,
        pdf_filename=submission.pdf_filename,
        pdf_size=submission.pdf_size,
        submitted_at=submission.submitted_at,
    )


def _program_to_response(record: ProgramRecord) -> ProgramResponse:
    return ProgramResponse(
        id=record.id,
        thread_id=record.thread_id,
        title=record.title,
        description=record.description,
        metadata=record.program_metadata or {},
        sessions=record.sessions or [],
        presentation_order=record.presentation_order or [],
        created_at=record.created_at,
        updated_at=record.updated_at,
    )


@conference_router.post("/threads", response_model=ThreadResponse)
async def create_thread(
    payload: ThreadCreateRequest,
    session: AsyncSession = Depends(get_db_session),
) -> ThreadResponse:
    thread = SubmissionThread(
        name=payload.name.strip(),
        description=payload.description.strip() if payload.description else None,
        submission_deadline=payload.submission_deadline,
        event_datetime=payload.event_datetime,
        event_location=payload.event_location.strip() if payload.event_location else None,
    )
    session.add(thread)
    await session.commit()
    await session.refresh(thread)
    return _thread_to_response(thread, submission_count=0)


@conference_router.get("/threads", response_model=List[ThreadResponse])
async def list_threads(session: AsyncSession = Depends(get_db_session)) -> List[ThreadResponse]:
    stmt = (
        select(SubmissionThread, func.count(AbstractSubmission.id))
        .outerjoin(AbstractSubmission, SubmissionThread.id == AbstractSubmission.thread_id)
        .group_by(SubmissionThread.id)
        .order_by(SubmissionThread.created_at.desc())
    )
    result = await session.execute(stmt)
    threads = result.all()
    return [_thread_to_response(thread, count) for thread, count in threads]


@conference_router.get("/threads/{thread_id}", response_model=ThreadDetailResponse)
async def get_thread(
    thread_id: UUID,
    session: AsyncSession = Depends(get_db_session),
) -> ThreadDetailResponse:
    result = await session.execute(select(SubmissionThread).where(SubmissionThread.id == thread_id))
    thread = result.scalars().first()
    if not thread:
        raise HTTPException(status_code=404, detail="指定された提出スレッドが見つかりません。")

    submissions_stmt = (
        select(AbstractSubmission)
        .where(AbstractSubmission.thread_id == thread_id)
        .order_by(AbstractSubmission.submitted_at.asc())
    )
    submissions_result = await session.execute(submissions_stmt)
    submissions = submissions_result.scalars().all()

    base_response = _thread_to_response(thread, len(submissions))
    return ThreadDetailResponse(
        **base_response.dict(),
        submissions=[_submission_to_response(sub) for sub in submissions],
    )


@conference_router.post(
    "/threads/{thread_id}/submissions",
    response_model=SubmissionResponse,
)
async def create_submission(
    thread_id: UUID,
    student_number: str = Form(...),
    student_name: str = Form(...),
    laboratory: str = Form(...),
    title: str = Form(...),
    pdf: UploadFile = File(...),
    session: AsyncSession = Depends(get_db_session),
) -> SubmissionResponse:
    result = await session.execute(select(SubmissionThread).where(SubmissionThread.id == thread_id))
    thread = result.scalars().first()
    if not thread:
        raise HTTPException(status_code=404, detail="指定された提出スレッドが見つかりません。")

    if laboratory not in LABORATORY_CHOICES:
        raise HTTPException(status_code=400, detail="無効な研究室が選択されました。")

    pdf_bytes = await pdf.read()
    if not pdf_bytes:
        raise HTTPException(status_code=400, detail="空のファイルはアップロードできません。")
    if len(pdf_bytes) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="ファイルサイズが上限（10MB）を超えています。")

    submission = AbstractSubmission(
        thread_id=thread_id,
        student_number=student_number.strip(),
        student_name=student_name.strip(),
        laboratory=laboratory,
        laboratory_id=LABORATORY_CHOICES[laboratory],
        title=title.strip(),
        pdf_filename=pdf.filename,
        pdf_content_type=pdf.content_type or "application/pdf",
        pdf_size=len(pdf_bytes),
        pdf_data=pdf_bytes,
    )

    session.add(submission)
    await session.commit()
    await session.refresh(submission)
    return _submission_to_response(submission)


@conference_router.get(
    "/threads/{thread_id}/submissions",
    response_model=List[SubmissionResponse],
)
async def list_submissions(
    thread_id: UUID,
    session: AsyncSession = Depends(get_db_session),
) -> List[SubmissionResponse]:
    result = await session.execute(select(SubmissionThread).where(SubmissionThread.id == thread_id))
    if not result.scalars().first():
        raise HTTPException(status_code=404, detail="指定された提出スレッドが見つかりません。")

    stmt = (
        select(AbstractSubmission)
        .where(AbstractSubmission.thread_id == thread_id)
        .order_by(AbstractSubmission.submitted_at.asc())
    )
    submissions_result = await session.execute(stmt)
    return [_submission_to_response(submission) for submission in submissions_result.scalars().all()]


@conference_router.get("/threads/{thread_id}/submissions/{submission_id}/download")
async def download_submission(
    thread_id: UUID,
    submission_id: UUID,
    session: AsyncSession = Depends(get_db_session),
) -> Response:
    stmt = select(AbstractSubmission).where(
        AbstractSubmission.thread_id == thread_id,
        AbstractSubmission.id == submission_id,
    )
    result = await session.execute(stmt)
    submission = result.scalars().first()
    if not submission:
        raise HTTPException(status_code=404, detail="指定された抄録が見つかりません。")

    headers = {
        "Content-Disposition": _quote_filename(submission.pdf_filename or f"{submission.id}.pdf"),
    }
    return Response(content=submission.pdf_data, media_type=submission.pdf_content_type, headers=headers)


@conference_router.delete("/threads/{thread_id}", status_code=204)
async def delete_thread(
    thread_id: UUID,
    session: AsyncSession = Depends(get_db_session),
) -> Response:
    result = await session.execute(select(SubmissionThread).where(SubmissionThread.id == thread_id))
    thread = result.scalars().first()
    if not thread:
        raise HTTPException(status_code=404, detail="指定された提出スレッドが見つかりません。")

    await session.execute(delete(ProgramRecord).where(ProgramRecord.thread_id == thread_id))
    await session.delete(thread)
    await session.commit()
    return Response(status_code=204)


@conference_router.delete("/threads/{thread_id}/submissions/{submission_id}", status_code=204)
async def delete_submission(
    thread_id: UUID,
    submission_id: UUID,
    session: AsyncSession = Depends(get_db_session),
) -> Response:
    stmt = select(AbstractSubmission).where(
        AbstractSubmission.thread_id == thread_id,
        AbstractSubmission.id == submission_id,
    )
    result = await session.execute(stmt)
    submission = result.scalars().first()
    if not submission:
        raise HTTPException(status_code=404, detail="指定された抄録が見つかりません。")

    await session.delete(submission)
    await session.commit()
    return Response(status_code=204)


def _to_minutes(time_str: str) -> int:
    try:
        hours, minutes = map(int, time_str.split(":"))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=f"無効な時刻形式です: {time_str}") from exc
    return hours * 60 + minutes


def _assign_presentations(
    submissions: List[AbstractSubmission],
    sessions: List[ProgramSessionInput],
    presentation_duration: int,
) -> List[List[AbstractSubmission]]:
    presentation_sessions = [s for s in sessions if s.type == "session"]
    if not presentation_sessions:
        raise HTTPException(status_code=400, detail="発表セッションが設定されていません。")

    lab_groups: Dict[int, List[AbstractSubmission]] = {}
    for submission in submissions:
        lab_groups.setdefault(submission.laboratory_id, []).append(submission)

    for group in lab_groups.values():
        group.sort(key=lambda sub: sub.student_number)

    session_capacities = []
    for session_info in presentation_sessions:
        duration = _to_minutes(session_info.endTime) - _to_minutes(session_info.startTime)
        if duration <= 0:
            raise HTTPException(status_code=400, detail="セッションの時間が正しく設定されていません。")
        session_capacities.append(max(1, duration // presentation_duration))

    total_capacity = sum(session_capacities)
    if total_capacity < len(submissions):
        raise HTTPException(
            status_code=400,
            detail="発表者数に対してセッションの時間枠が不足しています。セッションの時間を延長するか追加してください。",
        )

    if lab_groups:
        smallest_lab_size = min(len(group) for group in lab_groups.values())
        if len(presentation_sessions) > smallest_lab_size:
            raise HTTPException(
                status_code=400,
                detail="セッション数が最小人数の研究室の学生数を上回っています。セッション数を調整してください。",
            )

    session_assignments: List[List[AbstractSubmission]] = [list() for _ in presentation_sessions]
    lab_ids = list(lab_groups.keys())

    for session_index in range(len(presentation_sessions)):
        for lab_id in lab_ids:
            group = lab_groups.get(lab_id, [])
            if group:
                session_assignments[session_index].append(group.pop(0))

    remaining = []
    for group in lab_groups.values():
        remaining.extend(group)
    remaining.sort(key=lambda sub: sub.student_number)

    for idx, capacity in enumerate(session_capacities):
        while len(session_assignments[idx]) < capacity and remaining:
            session_assignments[idx].append(remaining.pop(0))

    for assignments in session_assignments:
        assignments.sort(key=lambda sub: sub.student_number)

    return session_assignments


@conference_router.post("/programs", response_model=ProgramResponse)
async def create_program(
    payload: ProgramCreateRequest,
    session: AsyncSession = Depends(get_db_session),
) -> ProgramResponse:
    thread_stmt = select(SubmissionThread).where(SubmissionThread.id == payload.thread_id)
    thread_result = await session.execute(thread_stmt)
    thread = thread_result.scalars().first()
    if not thread:
        raise HTTPException(status_code=404, detail="指定された提出スレッドが見つかりません。")

    submissions_stmt = (
        select(AbstractSubmission)
        .where(AbstractSubmission.thread_id == payload.thread_id)
        .order_by(AbstractSubmission.submitted_at.asc())
    )
    submissions_result = await session.execute(submissions_stmt)
    submissions = submissions_result.scalars().all()
    if not submissions:
        raise HTTPException(status_code=400, detail="この提出スレッドには抄録が登録されていません。")

    session_assignments = _assign_presentations(submissions, payload.sessions, payload.presentationDurationMinutes)

    schedule_sessions: List[ScheduleSession] = []
    presentation_order: List[dict] = []
    presentation_counter = 1

    assignment_index = 0
    for session_info in payload.sessions:
        if session_info.type == "break":
            schedule_sessions.append(
                ScheduleSession(
                    type="break",
                    startTime=session_info.startTime,
                    endTime=session_info.endTime,
                )
            )
            continue

        assigned_submissions = session_assignments[assignment_index]
        assignment_index += 1

        presentations: List[Presentation] = []
        for order_in_session, submission in enumerate(assigned_submissions, start=1):
            try:
                student_number_int = int(submission.student_number)
            except ValueError:
                student_number_int = 0

            presentation = Presentation(
                id=presentation_counter,
                student_number=student_number_int,
                student_name=submission.student_name,
                laboratory_id=submission.laboratory_id,
                theme=submission.title,
                years_id=0,
            )
            presentations.append(presentation)

            presentation_order.append(
                {
                    "submission_id": str(submission.id),
                    "student_number": submission.student_number,
                    "student_name": submission.student_name,
                    "laboratory": submission.laboratory,
                    "laboratory_id": submission.laboratory_id,
                    "title": submission.title,
                    "session_index": len(schedule_sessions),
                    "session_start_time": session_info.startTime,
                    "session_end_time": session_info.endTime,
                    "order_in_session": order_in_session,
                    "global_order": presentation_counter,
                }
            )
            presentation_counter += 1

        schedule_sessions.append(
            ScheduleSession(
                type="session",
                startTime=session_info.startTime,
                endTime=session_info.endTime,
                chair=session_info.chair,
                timekeeper=session_info.timekeeper,
                presentations=presentations,
            )
        )

    schedule_data = ScheduleData(
        courseName=payload.courseName,
        eventName=payload.eventName,
        eventTheme=payload.eventTheme,
        dateTime=payload.dateTime,
        venue=payload.venue,
        sessions=schedule_sessions,
    )

    latex = generate_latex(schedule_data)
    pdf_bytes = compile_latex_to_pdf(latex)

    program_record = ProgramRecord(
        thread_id=payload.thread_id,
        title=payload.title or payload.eventName,
        description=payload.description,
        program_metadata={
            "courseName": payload.courseName,
            "eventName": payload.eventName,
            "eventTheme": payload.eventTheme,
            "dateTime": payload.dateTime,
            "venue": payload.venue,
            "presentationDurationMinutes": payload.presentationDurationMinutes,
        },
        sessions=[
            {
                "type": session_obj.type,
                "startTime": session_obj.startTime,
                "endTime": session_obj.endTime,
                "chair": session_obj.chair,
                "timekeeper": session_obj.timekeeper,
                "presentations": [
                    {
                        "submission_id": order_entry["submission_id"],
                        "student_name": order_entry["student_name"],
                        "title": order_entry["title"],
                        "laboratory": order_entry["laboratory"],
                        "laboratory_id": order_entry["laboratory_id"],
                        "global_order": order_entry["global_order"],
                        "order_in_session": order_entry["order_in_session"],
                    }
                    for order_entry in presentation_order
                    if order_entry["session_index"] == idx and session_obj.type == "session"
                ],
            }
            for idx, session_obj in enumerate(schedule_sessions)
        ],
        presentation_order=presentation_order,
        pdf_filename="program.pdf",
        pdf_content_type="application/pdf",
        pdf_size=len(pdf_bytes),
        pdf_data=pdf_bytes,
    )

    session.add(program_record)
    await session.commit()
    await session.refresh(program_record)
    return _program_to_response(program_record)


@conference_router.get("/programs", response_model=List[ProgramResponse])
async def list_programs(
    thread_id: Optional[UUID] = Query(None),
    session: AsyncSession = Depends(get_db_session),
) -> List[ProgramResponse]:
    stmt = select(ProgramRecord).order_by(ProgramRecord.created_at.desc())
    if thread_id:
        stmt = stmt.where(ProgramRecord.thread_id == thread_id)
    result = await session.execute(stmt)
    records = result.scalars().all()
    return [_program_to_response(record) for record in records]


@conference_router.get("/programs/{program_id}", response_model=ProgramResponse)
async def get_program(
    program_id: UUID,
    session: AsyncSession = Depends(get_db_session),
) -> ProgramResponse:
    result = await session.execute(select(ProgramRecord).where(ProgramRecord.id == program_id))
    record = result.scalars().first()
    if not record:
        raise HTTPException(status_code=404, detail="指定されたプログラムが見つかりません。")
    return _program_to_response(record)


@conference_router.get("/programs/{program_id}/download")
async def download_program_pdf(
    program_id: UUID,
    session: AsyncSession = Depends(get_db_session),
) -> Response:
    result = await session.execute(select(ProgramRecord).where(ProgramRecord.id == program_id))
    record = result.scalars().first()
    if not record:
        raise HTTPException(status_code=404, detail="指定されたプログラムが見つかりません。")

    headers = {
        "Content-Disposition": _quote_filename(record.pdf_filename or "program.pdf"),
    }
    return Response(content=record.pdf_data, media_type=record.pdf_content_type, headers=headers)


@conference_router.get("/programs/{program_id}/booklet")
async def download_program_with_abstracts(
    program_id: UUID,
    session: AsyncSession = Depends(get_db_session),
) -> Response:
    result = await session.execute(select(ProgramRecord).where(ProgramRecord.id == program_id))
    program = result.scalars().first()
    if not program:
        raise HTTPException(status_code=404, detail="指定されたプログラムが見つかりません。")

    if not program.presentation_order:
        raise HTTPException(status_code=400, detail="このプログラムには発表順が登録されていません。")

    submission_ids = [UUID(entry["submission_id"]) for entry in program.presentation_order]
    submissions_stmt = (
        select(AbstractSubmission)
        .where(AbstractSubmission.id.in_(submission_ids))
    )
    submissions_result = await session.execute(submissions_stmt)
    submissions_map = {submission.id: submission for submission in submissions_result.scalars().all()}

    writer = PdfWriter()

    def append_reader(pdf_reader: PdfReader) -> None:
        for page in pdf_reader.pages:
            writer.add_page(page)

    program_reader = PdfReader(io.BytesIO(program.pdf_data))
    append_reader(program_reader)

    for entry in program.presentation_order:
        submission_id = UUID(entry["submission_id"])
        submission = submissions_map.get(submission_id)
        if not submission:
            continue
        append_reader(PdfReader(io.BytesIO(submission.pdf_data)))

    output_buffer = io.BytesIO()
    writer.write(output_buffer)
    writer.close()
    combined_bytes = output_buffer.getvalue()

    headers = {
        "Content-Disposition": _quote_filename(f"{program.title}-booklet.pdf"),
    }
    return Response(content=combined_bytes, media_type="application/pdf", headers=headers)


@conference_router.delete("/programs/{program_id}", status_code=204)
async def delete_program(
    program_id: UUID,
    session: AsyncSession = Depends(get_db_session),
) -> Response:
    result = await session.execute(select(ProgramRecord).where(ProgramRecord.id == program_id))
    program = result.scalars().first()
    if not program:
        raise HTTPException(status_code=404, detail="指定されたプログラムが見つかりません。")

    await session.delete(program)
    await session.commit()
    return Response(status_code=204)
