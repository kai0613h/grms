import asyncio
from sqlalchemy import text
from database import engine

async def migrate():
    try:
        async with engine.begin() as conn:
            # submission_threads changes
            await conn.execute(text("ALTER TABLE submission_threads ADD COLUMN IF NOT EXISTS has_abstract BOOLEAN DEFAULT TRUE;"))
            await conn.execute(text("ALTER TABLE submission_threads ADD COLUMN IF NOT EXISTS has_paper BOOLEAN DEFAULT FALSE;"))
            await conn.execute(text("ALTER TABLE submission_threads ADD COLUMN IF NOT EXISTS has_presentation BOOLEAN DEFAULT FALSE;"))
            await conn.execute(text("ALTER TABLE submission_threads DROP COLUMN IF EXISTS allowed_extensions;"))

            # abstract_submissions changes (adding paper and presentation columns)
            # Paper
            await conn.execute(text("ALTER TABLE abstract_submissions ADD COLUMN IF NOT EXISTS paper_filename VARCHAR(255);"))
            await conn.execute(text("ALTER TABLE abstract_submissions ADD COLUMN IF NOT EXISTS paper_content_type VARCHAR(120);"))
            await conn.execute(text("ALTER TABLE abstract_submissions ADD COLUMN IF NOT EXISTS paper_size INTEGER;"))
            await conn.execute(text("ALTER TABLE abstract_submissions ADD COLUMN IF NOT EXISTS paper_data BYTEA;"))
            
            # Presentation
            await conn.execute(text("ALTER TABLE abstract_submissions ADD COLUMN IF NOT EXISTS presentation_filename VARCHAR(255);"))
            await conn.execute(text("ALTER TABLE abstract_submissions ADD COLUMN IF NOT EXISTS presentation_content_type VARCHAR(120);"))
            await conn.execute(text("ALTER TABLE abstract_submissions ADD COLUMN IF NOT EXISTS presentation_size INTEGER;"))
            await conn.execute(text("ALTER TABLE abstract_submissions ADD COLUMN IF NOT EXISTS presentation_data BYTEA;"))

            # Rename pdf columns to abstract columns conceptually? No, just keep them as is to avoid data loss/complexity.
            # We will treat pdf_* as the abstract.

        print("Migration completed successfully.")
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    asyncio.run(migrate())
