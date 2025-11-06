import os
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# --- 基本設定 ---
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:password@db:5432/appdb")
# 接続: psql -U postgres -d appdb
# テーブル一覧: \dt
# テーブルの中身: SELECT * FROM notion;
# テーブル削除: DROP TABLE IF EXISTS notion;

# --- SQLAlchemy 設定 ---
Base = declarative_base()
engine = create_async_engine(DATABASE_URL, echo=False, future=True)
AsyncSessionLocal = sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False
)

# --- 非同期セッション取得 ---
async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session

# --- 初期化処理 ---
async def init_db() -> None:
    """DBテーブルを作成"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
