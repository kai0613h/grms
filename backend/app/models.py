import uuid

from sqlalchemy import Column, DateTime, Integer, LargeBinary, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID

from database import Base


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
