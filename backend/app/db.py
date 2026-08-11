from __future__ import annotations

import json
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

BACKEND_ROOT = Path(__file__).resolve().parents[1]
CONFIG_DIR = BACKEND_ROOT / "config"
DATA_DIR = BACKEND_ROOT / "data"
DB_PATH = DATA_DIR / "jarvis.db"


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def load_settings() -> dict[str, Any]:
    path = CONFIG_DIR / "settings.json"
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def load_persona() -> str:
    path = CONFIG_DIR / "persona.md"
    return path.read_text(encoding="utf-8").strip()


def get_conn() -> sqlite3.Connection:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    conn = get_conn()
    try:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS conversations (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                conversation_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY(conversation_id) REFERENCES conversations(id)
            );
            CREATE INDEX IF NOT EXISTS idx_messages_conv
                ON messages(conversation_id, created_at);
            """
        )
        conn.commit()
    finally:
        conn.close()


def list_conversations() -> list[dict[str, Any]]:
    conn = get_conn()
    try:
        rows = conn.execute(
            """
            SELECT id, title, created_at, updated_at
            FROM conversations
            ORDER BY updated_at DESC
            """
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def create_conversation(title: str = "Neues Gespräch") -> dict[str, Any]:
    now = utc_now()
    item = {
        "id": str(uuid.uuid4()),
        "title": title,
        "created_at": now,
        "updated_at": now,
    }
    conn = get_conn()
    try:
        conn.execute(
            """
            INSERT INTO conversations (id, title, created_at, updated_at)
            VALUES (:id, :title, :created_at, :updated_at)
            """,
            item,
        )
        conn.commit()
    finally:
        conn.close()
    return item


def get_conversation(conversation_id: str) -> dict[str, Any] | None:
    conn = get_conn()
    try:
        row = conn.execute(
            "SELECT id, title, created_at, updated_at FROM conversations WHERE id = ?",
            (conversation_id,),
        ).fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def rename_conversation(conversation_id: str, title: str) -> None:
    conn = get_conn()
    try:
        conn.execute(
            """
            UPDATE conversations
            SET title = ?, updated_at = ?
            WHERE id = ?
            """,
            (title, utc_now(), conversation_id),
        )
        conn.commit()
    finally:
        conn.close()


def touch_conversation(conversation_id: str) -> None:
    conn = get_conn()
    try:
        conn.execute(
            "UPDATE conversations SET updated_at = ? WHERE id = ?",
            (utc_now(), conversation_id),
        )
        conn.commit()
    finally:
        conn.close()


def list_messages(conversation_id: str) -> list[dict[str, Any]]:
    conn = get_conn()
    try:
        rows = conn.execute(
            """
            SELECT id, conversation_id, role, content, created_at
            FROM messages
            WHERE conversation_id = ?
            ORDER BY created_at ASC
            """,
            (conversation_id,),
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def add_message(conversation_id: str, role: str, content: str) -> dict[str, Any]:
    item = {
        "id": str(uuid.uuid4()),
        "conversation_id": conversation_id,
        "role": role,
        "content": content,
        "created_at": utc_now(),
    }
    conn = get_conn()
    try:
        conn.execute(
            """
            INSERT INTO messages (id, conversation_id, role, content, created_at)
            VALUES (:id, :conversation_id, :role, :content, :created_at)
            """,
            item,
        )
        conn.commit()
    finally:
        conn.close()
    touch_conversation(conversation_id)
    return item


def maybe_set_title_from_first_message(conversation_id: str, content: str) -> None:
    conv = get_conversation(conversation_id)
    if not conv:
        return
    if conv["title"] not in ("Neues Gespräch", "New chat", ""):
        return
    title = content.strip().replace("\n", " ")
    if len(title) > 42:
        title = title[:39] + "…"
    if title:
        rename_conversation(conversation_id, title)
