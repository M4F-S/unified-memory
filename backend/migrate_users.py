"""Migrate users from JSON file to PostgreSQL. Idempotent."""
import asyncio
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import asyncpg
from dotenv import load_dotenv

load_dotenv()

DATA_FILE = Path(__file__).parent.parent / "data" / "users.json"

DB_URL = os.getenv("DATABASE_URL", "postgresql://um_user:um_password_change_me@localhost:5434/unifiedmemory").replace("+asyncpg", "")

CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    stripe_customer_id VARCHAR(255),
    plan_tier VARCHAR(50) DEFAULT free,
    api_key VARCHAR(255)
);
"""

async def migrate():
    conn = await asyncpg.connect(DB_URL)
    await conn.execute(CREATE_TABLE_SQL)
    
    if not DATA_FILE.exists():
        print("No users.json found, skipping migration.")
        await conn.close()
        return
    
    users = json.loads(DATA_FILE.read_text("utf-8"))
    migrated = 0
    for user in users:
        try:
            await conn.execute(
                """
                INSERT INTO users (id, email, password_hash, created_at)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (id) DO UPDATE SET
                    email = EXCLUDED.email,
                    password_hash = EXCLUDED.password_hash,
                    created_at = EXCLUDED.created_at
                """,
                user["id"],
                user["email"],
                user["password_hash"],
                datetime.fromisoformat(user["created_at"].replace("Z", "+00:00"))
            )
            migrated += 1
        except Exception as e:
            print(f"  ⚠️  Failed to migrate {user.get(email)}: {e}")
    
    count = await conn.fetchval("SELECT COUNT(*) FROM users")
    await conn.close()
    print(f"✅ Migrated {migrated} users. Total in DB: {count}")

if __name__ == "__main__":
    asyncio.run(migrate())
