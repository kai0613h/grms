import asyncio
from sqlalchemy import text
from database import engine

async def migrate():
    try:
        async with engine.begin() as conn:
            await conn.execute(text("ALTER TABLE abstract_submissions ALTER COLUMN pdf_filename DROP NOT NULL;"))
            await conn.execute(text("ALTER TABLE abstract_submissions ALTER COLUMN pdf_content_type DROP NOT NULL;"))
            await conn.execute(text("ALTER TABLE abstract_submissions ALTER COLUMN pdf_size DROP NOT NULL;"))
            await conn.execute(text("ALTER TABLE abstract_submissions ALTER COLUMN pdf_data DROP NOT NULL;"))
        print("Migration to fix nullable columns completed successfully.")
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    asyncio.run(migrate())
