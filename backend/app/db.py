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
        data = json.load(f)
    return _clamp_settings(data)


def load_persona() -> str:
    path = CONFIG_DIR / "persona.md"
    return path.read_text(encoding="utf-8").strip()


def get_conn() -> sqlite3.Connection:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def _ensure_column(conn: sqlite3.Connection, table: str, column: str, decl: str) -> None:
    cols = {r[1] for r in conn.execute(f"PRAGMA table_info({table})").fetchall()}
    if column not in cols:
        conn.execute(f"ALTER TABLE {table} ADD COLUMN {column} {decl}")


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
            CREATE TABLE IF NOT EXISTS memory_items (
                id TEXT PRIMARY KEY,
                key TEXT NOT NULL UNIQUE,
                value TEXT NOT NULL,
                category TEXT NOT NULL DEFAULT 'fact',
                confidence REAL NOT NULL DEFAULT 0.8,
                source_conversation_id TEXT,
                updated_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_memory_updated
                ON memory_items(updated_at DESC);
            """
        )
        _ensure_column(conn, "conversations", "summary_text", "TEXT")
        _ensure_column(conn, "conversations", "summary_upto_message_id", "TEXT")
        _ensure_column(conn, "conversations", "summary_message_count", "INTEGER DEFAULT 0")
        _ensure_column(conn, "conversations", "session_mood", "TEXT DEFAULT 'neutral'")
        _ensure_column(conn, "memory_items", "expires_at", "TEXT")
        _ensure_column(conn, "messages", "meta_json", "TEXT")
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS research_audits (
                id TEXT PRIMARY KEY,
                conversation_id TEXT,
                message_id TEXT,
                query TEXT NOT NULL,
                status TEXT NOT NULL,
                sources_json TEXT NOT NULL,
                error TEXT,
                created_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_research_audits_created
                ON research_audits(created_at DESC);
            CREATE TABLE IF NOT EXISTS delight_daily (
                day TEXT PRIMARY KEY,
                moments INTEGER NOT NULL DEFAULT 0,
                jokes INTEGER NOT NULL DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS notes (
                id TEXT PRIMARY KEY,
                body TEXT NOT NULL,
                source_conversation_id TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_notes_updated ON notes(updated_at DESC);
            CREATE TABLE IF NOT EXISTS todos (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'open',
                source_conversation_id TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status, updated_at DESC);
            CREATE TABLE IF NOT EXISTS tool_pending (
                conversation_id TEXT PRIMARY KEY,
                tool TEXT NOT NULL,
                action TEXT NOT NULL,
                args_json TEXT NOT NULL,
                preview TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS tool_audits (
                id TEXT PRIMARY KEY,
                conversation_id TEXT,
                tool TEXT NOT NULL,
                action TEXT NOT NULL,
                args_json TEXT NOT NULL,
                status TEXT NOT NULL,
                result_json TEXT,
                created_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_tool_audits_created
                ON tool_audits(created_at DESC);
            """
        )
        conn.commit()
    finally:
        conn.close()


def _clamp_settings(current: dict[str, Any]) -> dict[str, Any]:
    """Normalize numeric / enum settings to safe ranges (Sprint 19 / 0.7.1)."""
    try:
        timeout = float(current.get("research_timeout_sec", 8))
    except (TypeError, ValueError):
        timeout = 8.0
    current["research_timeout_sec"] = max(1.0, min(60.0, timeout))

    try:
        max_src = int(current.get("research_max_sources", 5))
    except (TypeError, ValueError):
        max_src = 5
    current["research_max_sources"] = max(1, min(10, max_src))

    try:
        moments = int(current.get("delight_moments_per_day", 2))
    except (TypeError, ValueError):
        moments = 2
    current["delight_moments_per_day"] = max(0, min(20, moments))

    vol = str(current.get("ui_sound_volume", "low")).lower()
    if vol not in {"low", "medium", "high", "off"}:
        current["ui_sound_volume"] = "low"

    freq = str(current.get("delight_joke_frequency", "selten")).lower()
    if freq not in {"selten", "normal", "oft"}:
        current["delight_joke_frequency"] = "selten"

    mode = str(current.get("routing_mode", "auto")).lower()
    if mode not in {"auto", "default", "heavy"}:
        current["routing_mode"] = "auto"

    current["research_opt_in"] = bool(current.get("research_opt_in", False))
    return current


def save_settings(patch: dict[str, Any]) -> dict[str, Any]:
    """Merge patch into settings.json (only known top-level keys overwritten)."""
    path = CONFIG_DIR / "settings.json"
    current = load_settings()
    allowed = set(current.keys()) | {
        "research_opt_in",
        "research_providers",
        "research_allowlist",
        "research_timeout_sec",
        "research_max_sources",
        "delight_moments",
        "delight_moments_per_day",
        "delight_jokes",
        "delight_joke_frequency",
        "easter_eggs_enabled",
        "ui_sounds",
        "ui_sound_volume",
        "routing_mode",
        "model_default",
        "model_heavy",
        "fallback_model",
    }
    for k, v in patch.items():
        if k in allowed:
            current[k] = v
    current = _clamp_settings(current)
    path.write_text(json.dumps(current, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return current


def list_conversations() -> list[dict[str, Any]]:
    conn = get_conn()
    try:
        rows = conn.execute(
            """
            SELECT id, title, created_at, updated_at,
                   summary_text, summary_upto_message_id, summary_message_count
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
        "summary_text": None,
        "summary_upto_message_id": None,
        "summary_message_count": 0,
    }
    conn = get_conn()
    try:
        conn.execute(
            """
            INSERT INTO conversations
            (id, title, created_at, updated_at, summary_text, summary_upto_message_id, summary_message_count)
            VALUES (:id, :title, :created_at, :updated_at, :summary_text,
                    :summary_upto_message_id, :summary_message_count)
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
            """
            SELECT id, title, created_at, updated_at,
                   summary_text, summary_upto_message_id, summary_message_count
            FROM conversations WHERE id = ?
            """,
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


def get_conversation_mood(conversation_id: str) -> str:
    conn = get_conn()
    try:
        row = conn.execute(
            "SELECT session_mood FROM conversations WHERE id = ?",
            (conversation_id,),
        ).fetchone()
        if not row:
            return "neutral"
        mood = (row["session_mood"] if isinstance(row, dict) or hasattr(row, "keys") else row[0]) or "neutral"
        mood = str(mood).lower()
        return mood if mood in {"neutral", "kante", "ruhe"} else "neutral"
    finally:
        conn.close()


def set_conversation_mood(conversation_id: str, mood: str) -> None:
    mood_n = str(mood or "neutral").lower()
    if mood_n not in {"neutral", "kante", "ruhe"}:
        mood_n = "neutral"
    conn = get_conn()
    try:
        conn.execute(
            "UPDATE conversations SET session_mood = ?, updated_at = ? WHERE id = ?",
            (mood_n, utc_now(), conversation_id),
        )
        conn.commit()
    finally:
        conn.close()


def get_delight_daily(day: str) -> tuple[int, int]:
    conn = get_conn()
    try:
        row = conn.execute(
            "SELECT moments, jokes FROM delight_daily WHERE day = ?",
            (day,),
        ).fetchone()
        if not row:
            return 0, 0
        return int(row["moments"] if hasattr(row, "keys") else row[0]), int(
            row["jokes"] if hasattr(row, "keys") else row[1]
        )
    finally:
        conn.close()


def bump_delight_daily(day: str, *, moments: int = 0, jokes: int = 0) -> None:
    conn = get_conn()
    try:
        conn.execute(
            """
            INSERT INTO delight_daily (day, moments, jokes) VALUES (?, ?, ?)
            ON CONFLICT(day) DO UPDATE SET
                moments = moments + excluded.moments,
                jokes = jokes + excluded.jokes
            """,
            (day, max(0, moments), max(0, jokes)),
        )
        conn.commit()
    finally:
        conn.close()


def update_conversation_summary(
    conversation_id: str,
    summary_text: str,
    summary_upto_message_id: str | None,
    summary_message_count: int,
) -> None:
    conn = get_conn()
    try:
        conn.execute(
            """
            UPDATE conversations
            SET summary_text = ?,
                summary_upto_message_id = ?,
                summary_message_count = ?,
                updated_at = ?
            WHERE id = ?
            """,
            (
                summary_text,
                summary_upto_message_id,
                summary_message_count,
                utc_now(),
                conversation_id,
            ),
        )
        conn.commit()
    finally:
        conn.close()


def _parse_meta(raw: str | None) -> dict[str, Any] | None:
    if not raw:
        return None
    try:
        data = json.loads(raw)
        return data if isinstance(data, dict) else None
    except json.JSONDecodeError:
        return None


def list_messages(conversation_id: str) -> list[dict[str, Any]]:
    conn = get_conn()
    try:
        rows = conn.execute(
            """
            SELECT id, conversation_id, role, content, created_at, meta_json
            FROM messages
            WHERE conversation_id = ?
            ORDER BY created_at ASC
            """,
            (conversation_id,),
        ).fetchall()
        out: list[dict[str, Any]] = []
        for r in rows:
            item = dict(r)
            item["meta"] = _parse_meta(item.pop("meta_json", None))
            out.append(item)
        return out
    finally:
        conn.close()


def add_message(
    conversation_id: str,
    role: str,
    content: str,
    *,
    meta: dict[str, Any] | None = None,
) -> dict[str, Any]:
    item = {
        "id": str(uuid.uuid4()),
        "conversation_id": conversation_id,
        "role": role,
        "content": content,
        "created_at": utc_now(),
        "meta_json": json.dumps(meta, ensure_ascii=False) if meta else None,
    }
    conn = get_conn()
    try:
        conn.execute(
            """
            INSERT INTO messages (id, conversation_id, role, content, created_at, meta_json)
            VALUES (:id, :conversation_id, :role, :content, :created_at, :meta_json)
            """,
            item,
        )
        conn.commit()
    finally:
        conn.close()
    touch_conversation(conversation_id)
    public = {k: v for k, v in item.items() if k != "meta_json"}
    public["meta"] = meta
    return public


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


def delete_conversation(conversation_id: str) -> bool:
    conn = get_conn()
    try:
        exists = conn.execute(
            "SELECT 1 FROM conversations WHERE id = ?",
            (conversation_id,),
        ).fetchone()
        if not exists:
            return False
        conn.execute("DELETE FROM messages WHERE conversation_id = ?", (conversation_id,))
        conn.execute(
            "DELETE FROM research_audits WHERE conversation_id = ?", (conversation_id,)
        )
        conn.execute("DELETE FROM conversations WHERE id = ?", (conversation_id,))
        conn.commit()
        return True
    finally:
        conn.close()


def add_research_audit(
    *,
    conversation_id: str | None,
    message_id: str | None,
    query: str,
    status: str,
    sources: list[dict[str, Any]],
    error: str | None = None,
) -> dict[str, Any]:
    item = {
        "id": str(uuid.uuid4()),
        "conversation_id": conversation_id,
        "message_id": message_id,
        "query": query,
        "status": status,
        "sources_json": json.dumps(sources, ensure_ascii=False),
        "error": error,
        "created_at": utc_now(),
    }
    conn = get_conn()
    try:
        conn.execute(
            """
            INSERT INTO research_audits
            (id, conversation_id, message_id, query, status, sources_json, error, created_at)
            VALUES
            (:id, :conversation_id, :message_id, :query, :status, :sources_json, :error, :created_at)
            """,
            item,
        )
        conn.commit()
    finally:
        conn.close()
    public = dict(item)
    public["sources"] = sources
    del public["sources_json"]
    return public


def list_research_audits(limit: int = 50) -> list[dict[str, Any]]:
    conn = get_conn()
    try:
        rows = conn.execute(
            """
            SELECT id, conversation_id, message_id, query, status,
                   sources_json, error, created_at
            FROM research_audits
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()
        out: list[dict[str, Any]] = []
        for r in rows:
            item = dict(r)
            try:
                item["sources"] = json.loads(item.pop("sources_json") or "[]")
            except json.JSONDecodeError:
                item["sources"] = []
                item.pop("sources_json", None)
            out.append(item)
        return out
    finally:
        conn.close()


def get_research_audit(audit_id: str) -> dict[str, Any] | None:
    conn = get_conn()
    try:
        row = conn.execute(
            """
            SELECT id, conversation_id, message_id, query, status,
                   sources_json, error, created_at
            FROM research_audits WHERE id = ?
            """,
            (audit_id,),
        ).fetchone()
        if not row:
            return None
        item = dict(row)
        try:
            item["sources"] = json.loads(item.pop("sources_json") or "[]")
        except json.JSONDecodeError:
            item["sources"] = []
            item.pop("sources_json", None)
        return item
    finally:
        conn.close()


def recent_assistant_texts(conversation_id: str, limit: int = 5) -> list[str]:
    messages = list_messages(conversation_id)
    return [m["content"] for m in messages if m["role"] == "assistant"][-limit:]


# --- Long-term memory ---


def list_memory_items(
    limit: int = 100,
    *,
    category: str | None = None,
    include_expired: bool = True,
) -> list[dict[str, Any]]:
    conn = get_conn()
    try:
        rows = conn.execute(
            """
            SELECT id, key, value, category, confidence,
                   source_conversation_id, updated_at, expires_at
            FROM memory_items
            ORDER BY updated_at DESC
            LIMIT ?
            """,
            (max(limit * 3, limit),),
        ).fetchall()
        now = utc_now()
        out: list[dict[str, Any]] = []
        for r in rows:
            item = dict(r)
            exp = item.get("expires_at")
            if not include_expired and exp and exp <= now:
                continue
            if category and item.get("category") != category:
                continue
            out.append(item)
            if len(out) >= limit:
                break
        return out
    finally:
        conn.close()


def upsert_memory_item(
    *,
    key: str,
    value: str,
    category: str = "fact",
    confidence: float = 0.8,
    source_conversation_id: str | None = None,
    expires_at: str | None = None,
) -> dict[str, Any]:
    key_n = key.strip().lower().replace(" ", "_")[:80]
    value_n = value.strip()[:500]
    category_n = category if category in {"pref", "fact", "open_loop", "boundary", "joke"} else "fact"
    now = utc_now()
    conn = get_conn()
    try:
        existing = conn.execute(
            "SELECT id FROM memory_items WHERE key = ?",
            (key_n,),
        ).fetchone()
        if existing:
            conn.execute(
                """
                UPDATE memory_items
                SET value = ?, category = ?, confidence = ?,
                    source_conversation_id = ?, updated_at = ?, expires_at = ?
                WHERE key = ?
                """,
                (
                    value_n,
                    category_n,
                    confidence,
                    source_conversation_id,
                    now,
                    expires_at,
                    key_n,
                ),
            )
            item_id = existing["id"]
        else:
            item_id = str(uuid.uuid4())
            conn.execute(
                """
                INSERT INTO memory_items
                (id, key, value, category, confidence, source_conversation_id, updated_at, expires_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    item_id,
                    key_n,
                    value_n,
                    category_n,
                    confidence,
                    source_conversation_id,
                    now,
                    expires_at,
                ),
            )
        conn.commit()
        row = conn.execute(
            """
            SELECT id, key, value, category, confidence,
                   source_conversation_id, updated_at, expires_at
            FROM memory_items WHERE id = ?
            """,
            (item_id,),
        ).fetchone()
        return dict(row)
    finally:
        conn.close()


def delete_memory_item(item_id: str) -> bool:
    conn = get_conn()
    try:
        cur = conn.execute("DELETE FROM memory_items WHERE id = ?", (item_id,))
        conn.commit()
        return cur.rowcount > 0
    finally:
        conn.close()


def delete_memory_by_key_substring(query: str) -> int:
    q = query.strip().lower()
    if not q:
        return 0
    conn = get_conn()
    try:
        rows = conn.execute("SELECT id, key, value FROM memory_items").fetchall()
        deleted = 0
        for r in rows:
            blob = f"{r['key']} {r['value']}".lower()
            if q in blob or q.replace(" ", "_") in r["key"]:
                conn.execute("DELETE FROM memory_items WHERE id = ?", (r["id"],))
                deleted += 1
        conn.commit()
        return deleted
    finally:
        conn.close()


def clear_all_memory() -> int:
    conn = get_conn()
    try:
        cur = conn.execute("DELETE FROM memory_items")
        conn.commit()
        return cur.rowcount
    finally:
        conn.close()


# ── Notes / Todos / Tool pending (Sprint 28) ─────────────────


def create_note(*, body: str, conversation_id: str | None = None) -> dict[str, Any]:
    now = utc_now()
    item = {
        "id": str(uuid.uuid4()),
        "body": body.strip()[:500],
        "source_conversation_id": conversation_id,
        "created_at": now,
        "updated_at": now,
    }
    conn = get_conn()
    try:
        conn.execute(
            """
            INSERT INTO notes (id, body, source_conversation_id, created_at, updated_at)
            VALUES (:id, :body, :source_conversation_id, :created_at, :updated_at)
            """,
            item,
        )
        conn.commit()
    finally:
        conn.close()
    return item


def list_notes(*, limit: int = 20) -> list[dict[str, Any]]:
    conn = get_conn()
    try:
        rows = conn.execute(
            "SELECT id, body, source_conversation_id, created_at, updated_at "
            "FROM notes ORDER BY updated_at DESC LIMIT ?",
            (max(1, min(limit, 50)),),
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def search_notes(query: str, *, limit: int = 10) -> list[dict[str, Any]]:
    q = (query or "").strip().lower()
    if not q:
        return list_notes(limit=limit)
    conn = get_conn()
    try:
        rows = conn.execute(
            "SELECT id, body, source_conversation_id, created_at, updated_at "
            "FROM notes ORDER BY updated_at DESC LIMIT 80"
        ).fetchall()
        hits = [dict(r) for r in rows if q in str(r["body"]).lower()]
        return hits[: max(1, min(limit, 30))]
    finally:
        conn.close()


def create_todo(*, title: str, conversation_id: str | None = None) -> dict[str, Any]:
    now = utc_now()
    item = {
        "id": str(uuid.uuid4()),
        "title": title.strip()[:200],
        "status": "open",
        "source_conversation_id": conversation_id,
        "created_at": now,
        "updated_at": now,
    }
    conn = get_conn()
    try:
        conn.execute(
            """
            INSERT INTO todos (id, title, status, source_conversation_id, created_at, updated_at)
            VALUES (:id, :title, :status, :source_conversation_id, :created_at, :updated_at)
            """,
            item,
        )
        conn.commit()
    finally:
        conn.close()
    return item


def list_todos(*, status: str = "open", limit: int = 20) -> list[dict[str, Any]]:
    st = status if status in {"open", "done", "all"} else "open"
    conn = get_conn()
    try:
        if st == "all":
            rows = conn.execute(
                "SELECT id, title, status, source_conversation_id, created_at, updated_at "
                "FROM todos ORDER BY updated_at DESC LIMIT ?",
                (max(1, min(limit, 50)),),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT id, title, status, source_conversation_id, created_at, updated_at "
                "FROM todos WHERE status = ? ORDER BY updated_at DESC LIMIT ?",
                (st, max(1, min(limit, 50))),
            ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def complete_todo_by_title(title: str) -> dict[str, Any] | None:
    needle = (title or "").strip().lower()
    if not needle:
        return None
    conn = get_conn()
    try:
        rows = conn.execute(
            "SELECT id, title, status FROM todos WHERE status = 'open' ORDER BY updated_at DESC"
        ).fetchall()
        match = None
        for r in rows:
            t = str(r["title"]).lower()
            if needle == t or needle in t or t in needle:
                match = r
                break
        if not match:
            return None
        now = utc_now()
        conn.execute(
            "UPDATE todos SET status = 'done', updated_at = ? WHERE id = ?",
            (now, match["id"]),
        )
        conn.commit()
        return {
            "id": match["id"],
            "title": match["title"],
            "status": "done",
            "updated_at": now,
        }
    finally:
        conn.close()


def set_tool_pending(
    conversation_id: str,
    *,
    tool: str,
    action: str,
    args: dict[str, Any],
    preview: str,
) -> None:
    conn = get_conn()
    try:
        conn.execute(
            """
            INSERT INTO tool_pending (conversation_id, tool, action, args_json, preview, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(conversation_id) DO UPDATE SET
                tool = excluded.tool,
                action = excluded.action,
                args_json = excluded.args_json,
                preview = excluded.preview,
                created_at = excluded.created_at
            """,
            (
                conversation_id,
                tool,
                action,
                json.dumps(args, ensure_ascii=False),
                preview,
                utc_now(),
            ),
        )
        conn.commit()
    finally:
        conn.close()


def get_tool_pending(conversation_id: str) -> dict[str, Any] | None:
    conn = get_conn()
    try:
        row = conn.execute(
            "SELECT conversation_id, tool, action, args_json, preview, created_at "
            "FROM tool_pending WHERE conversation_id = ?",
            (conversation_id,),
        ).fetchone()
        if not row:
            return None
        data = dict(row)
        try:
            data["args"] = json.loads(data.pop("args_json") or "{}")
        except json.JSONDecodeError:
            data["args"] = {}
        return data
    finally:
        conn.close()


def clear_tool_pending(conversation_id: str) -> None:
    conn = get_conn()
    try:
        conn.execute("DELETE FROM tool_pending WHERE conversation_id = ?", (conversation_id,))
        conn.commit()
    finally:
        conn.close()


def add_tool_audit(
    *,
    conversation_id: str | None,
    tool: str,
    action: str,
    args: dict[str, Any],
    status: str,
    result: dict[str, Any] | None = None,
) -> dict[str, Any]:
    item = {
        "id": str(uuid.uuid4()),
        "conversation_id": conversation_id,
        "tool": tool,
        "action": action,
        "args_json": json.dumps(args or {}, ensure_ascii=False),
        "status": status,
        "result_json": json.dumps(result or {}, ensure_ascii=False),
        "created_at": utc_now(),
    }
    conn = get_conn()
    try:
        conn.execute(
            """
            INSERT INTO tool_audits
            (id, conversation_id, tool, action, args_json, status, result_json, created_at)
            VALUES
            (:id, :conversation_id, :tool, :action, :args_json, :status, :result_json, :created_at)
            """,
            item,
        )
        conn.commit()
    finally:
        conn.close()
    return item
