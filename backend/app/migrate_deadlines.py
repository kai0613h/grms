import asyncio
from sqlalchemy import text
from database import engine

async def migrate():
    try:
        async with engine.begin() as conn:
            # Add new deadline columns
            await conn.execute(text("ALTER TABLE submission_threads ADD COLUMN IF NOT EXISTS abstract_deadline TIMESTAMPTZ;"))
            await conn.execute(text("ALTER TABLE submission_threads ADD COLUMN IF NOT EXISTS paper_deadline TIMESTAMPTZ;"))
            await conn.execute(text("ALTER TABLE submission_threads ADD COLUMN IF NOT EXISTS presentation_deadline TIMESTAMPTZ;"))
            
            # Remove old columns
            await conn.execute(text("ALTER TABLE submission_threads DROP COLUMN IF EXISTS submission_deadline;"))
            await conn.execute(text("ALTER TABLE submission_threads DROP COLUMN IF EXISTS event_datetime;"))

        print("Migration completed successfully.")
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    asyncio.run(migrate())
