from sqlalchemy import Column, Integer, String, ForeignKey, Date, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database import Base



class Year(Base):
    __tablename__ = "years"

    id = Column(Integer, primary_key=True, index=True)
    year = Column(Integer, nullable=False)


class Laboratory(Base):
    __tablename__ = "laboratories"

    id = Column(Integer, primary_key=True, index=True)
    laboratory_name = Column(String, nullable=False)
    year = Column(Integer, nullable=True) 
    

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    student_number = Column(Integer, nullable=False)
    student_name = Column(String, nullable=False)
    laboratory_name = Column(String, nullable=False)
    theme = Column(String, nullable=True)
    total_contact_time = Column(String, nullable=True)
    year = Column(Integer, nullable=True) 

class ContactTime(Base):
    __tablename__ = "contact_times"

    id = Column(Integer, primary_key=True, index=True)
    data = Column(JSON, nullable=False)
    laboratory_name = Column(String, nullable=False)
    year = Column(Integer, nullable=True) 
    date = Column(Date, nullable=False)


class Notion(Base):
    __tablename__ = "notion"

    id = Column(Integer, primary_key=True)
    laboratory_name = Column(String, nullable=False)
    title = Column(String, nullable=False)
    year = Column(Integer, nullable=True) 
    thesis_page_id = Column(UUID(as_uuid=True))
    student_page_id = Column(UUID(as_uuid=True))
    task_page_id = Column(UUID(as_uuid=True))