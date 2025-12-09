import asyncio
from sqlalchemy import text
from database import engine

async def migrate():
    try:
        async with engine.begin() as conn:
            await conn.execute(text("ALTER TABLE submission_threads ADD COLUMN IF NOT EXISTS allowed_extensions JSONB;"))
            await conn.execute(text("ALTER TABLE submission_threads DROP COLUMN IF EXISTS event_location;"))
        print("Migration completed successfully.")
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    asyncio.run(migrate())
