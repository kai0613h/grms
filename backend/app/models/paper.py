import uuid

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    LargeBinary,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID

from database import Base

# 論文検索
class Paper(Base):
    """Stored research paper metadata and binary contents."""

    __tablename__ = "papers"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename = Column(String(255), nullable=False)
    content_type = Column(String(120), nullable=False)
    file_size = Column(Integer, nullable=False)
    tags = Column(JSONB, nullable=False, default=list)
    uploaded_by = Column(String(120), nullable=True)
    description = Column(Text, nullable=True)
    uploaded_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    data = Column(LargeBinary, nullable=False)


class SubmissionThread(Base):
    """Represents an abstract submission window for a specific event."""

    __tablename__ = "submission_threads"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    abstract_deadline = Column(DateTime(timezone=True), nullable=True)
    paper_deadline = Column(DateTime(timezone=True), nullable=True)
    presentation_deadline = Column(DateTime(timezone=True), nullable=True)
    has_abstract = Column(Boolean, default=True)
    has_paper = Column(Boolean, default=False)
    has_presentation = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )


class AbstractSubmission(Base):
    """Single submission belonging to a submission thread, containing up to 3 files."""

    __tablename__ = "abstract_submissions"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    thread_id = Column(PGUUID(as_uuid=True), ForeignKey("submission_threads.id", ondelete="CASCADE"), nullable=False)
    student_number = Column(String(32), nullable=False)
    student_name = Column(String(120), nullable=False)
    laboratory = Column(String(120), nullable=False)
    laboratory_id = Column(Integer, nullable=False)
    title = Column(String(255), nullable=False)
    
    # Abstract (legacy pdf_* columns)
    pdf_filename = Column(String(255), nullable=True)
    pdf_content_type = Column(String(120), nullable=True)
    pdf_size = Column(Integer, nullable=True)
    pdf_data = Column(LargeBinary, nullable=True)
    
    # Paper
    paper_filename = Column(String(255), nullable=True)
    paper_content_type = Column(String(120), nullable=True)
    paper_size = Column(Integer, nullable=True)
    paper_data = Column(LargeBinary, nullable=True)
    
    # Presentation
    presentation_filename = Column(String(255), nullable=True)
    presentation_content_type = Column(String(120), nullable=True)
    presentation_size = Column(Integer, nullable=True)
    presentation_data = Column(LargeBinary, nullable=True)

    submitted_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())


class ProgramRecord(Base):
    """Generated presentation program stored alongside metadata and PDF contents."""

    __tablename__ = "program_records"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    thread_id = Column(PGUUID(as_uuid=True), ForeignKey("submission_threads.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    program_metadata = Column(JSONB, nullable=False, default=dict)
    sessions = Column(JSONB, nullable=False, default=list)
    presentation_order = Column(JSONB, nullable=False, default=list)
    pdf_filename = Column(String(255), nullable=False)
    pdf_content_type = Column(String(120), nullable=False)
    pdf_size = Column(Integer, nullable=False)
    pdf_data = Column(LargeBinary, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
