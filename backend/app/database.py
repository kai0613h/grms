import os
from functools import lru_cache
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import declarative_base, sessionmaker


Base = declarative_base()


def _build_async_database_url() -> str:
    """Convert sync DATABASE_URL into async format for SQLAlchemy."""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL environment variable is not set.")

    if database_url.startswith("postgresql+asyncpg://"):
        return database_url

    if database_url.startswith("postgresql://"):
        return database_url.replace("postgresql://", "postgresql+asyncpg://", 1)

    if database_url.startswith("sqlite+aiosqlite://"):
        return database_url

    if database_url.startswith("sqlite://"):
        return database_url.replace("sqlite://", "sqlite+aiosqlite://", 1)

    raise RuntimeError(f"Unsupported DATABASE_URL scheme: {database_url}")


@lru_cache()
def get_async_engine():
    url = _build_async_database_url()
    return create_async_engine(url, future=True, echo=False)


@lru_cache()
def get_session_factory():
    engine = get_async_engine()
    return sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    session_factory = get_session_factory()
    async with session_factory() as session:
        yield session


async def init_db() -> None:
    """Create database tables if they do not exist."""
    engine = get_async_engine()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
