"""Local tools runtime — Sprint 28 / 0.9.0.

Confirm-before-write for notes & todos. Read ops execute immediately.
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any, Literal

from . import db

ToolName = Literal["notes", "todo"]
ToolAction = Literal["create", "list", "search", "done"]

ALLOWLIST: set[tuple[str, str]] = {
    ("notes", "create"),
    ("notes", "list"),
    ("notes", "search"),
    ("todo", "create"),
    ("todo", "list"),
    ("todo", "done"),
}

_NOTE_WRITE_RE = re.compile(
    r"(?is)^\s*(?:notiz(?:e)?|notiere|notiz:)\s*[:\-]?\s*(.+)$"
)
_TODO_WRITE_RE = re.compile(
    r"(?is)^\s*(?:todo|to-?do|aufgabe)\s*[:\-]?\s*(.+)$"
)
_TODO_LIST_RE = re.compile(
    r"(?is)\b("
    r"offene\s+todos?|"
    r"meine\s+todos?|"
    r"zeig(?:e)?\s+(?:mir\s+)?(?:die\s+)?todos?|"
    r"todos?\s+(?:liste|auflisten)|"
    r"was\s+(?:steht|habe\s+ich)\s+(?:auf\s+)?(?:der\s+)?(?:todo|to-?do)"
    r")\b"
)
_NOTE_LIST_RE = re.compile(
    r"(?is)\b("
    r"meine\s+notizen|"
    r"zeig(?:e)?\s+(?:mir\s+)?(?:die\s+)?notizen|"
    r"was\s+steht\s+in\s+meinen\s+notizen|"
    r"notizen\s+(?:liste|auflisten|suchen)"
    r")\b"
)
_NOTE_SEARCH_RE = re.compile(
    r"(?is)\b(?:notiz|notizen).{0,40}?\b(?:zu|über|mit)\s+(.+?)(?:\?|$)"
)
_TODO_DONE_RE = re.compile(
    r"(?is)^\s*(?:erledige|done|abhak(?:e)?|todo\s+fertig)\s*[:\-]?\s*(.+)$"
)
_CONFIRM_RE = re.compile(
    r"(?is)^\s*("
    r"ja(?:\s+bitte)?|"
    r"ok(?:ay)?|"
    r"speichern|"
    r"so\s+speichern|"
    r"machen|"
    r"tu\s+das|"
    r"bitte\s+speichern|"
    r"bestätig(?:e|en)?"
    r")\s*[.!]?\s*$"
)


@dataclass
class ToolProposal:
    tool: ToolName
    action: ToolAction
    args: dict[str, Any]
    needs_confirm: bool
    preview: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "tool": self.tool,
            "action": self.action,
            "args": self.args,
            "needs_confirm": self.needs_confirm,
            "preview": self.preview,
        }


def looks_like_tool_confirm(text: str) -> bool:
    return bool(_CONFIRM_RE.match((text or "").strip()))


def parse_tool_request(text: str) -> ToolProposal | None:
    """Heuristic parse — no LLM required for v1."""
    stripped = (text or "").strip()
    if not stripped:
        return None

    m = _TODO_DONE_RE.match(stripped)
    if m:
        title = m.group(1).strip()[:200]
        return ToolProposal(
            tool="todo",
            action="done",
            args={"title": title},
            needs_confirm=True,
            preview=f"Todo erledigen: {title}",
        )

    m = _TODO_WRITE_RE.match(stripped)
    if m:
        title = m.group(1).strip()[:200]
        if title:
            return ToolProposal(
                tool="todo",
                action="create",
                args={"title": title},
                needs_confirm=True,
                preview=f"Todo anlegen: {title}",
            )

    m = _NOTE_WRITE_RE.match(stripped)
    if m:
        body = m.group(1).strip()[:500]
        if body:
            return ToolProposal(
                tool="notes",
                action="create",
                args={"body": body},
                needs_confirm=True,
                preview=f"Notiz anlegen: {body[:80]}",
            )

    if _TODO_LIST_RE.search(stripped):
        return ToolProposal(
            tool="todo",
            action="list",
            args={"status": "open"},
            needs_confirm=False,
            preview="Offene Todos listen",
        )

    m = _NOTE_SEARCH_RE.search(stripped)
    if m:
        q = m.group(1).strip()[:80]
        return ToolProposal(
            tool="notes",
            action="search",
            args={"query": q},
            needs_confirm=False,
            preview=f"Notizen suchen: {q}",
        )

    if _NOTE_LIST_RE.search(stripped):
        return ToolProposal(
            tool="notes",
            action="list",
            args={},
            needs_confirm=False,
            preview="Notizen listen",
        )

    return None


def validate(proposal: ToolProposal) -> str | None:
    key = (proposal.tool, proposal.action)
    if key not in ALLOWLIST:
        return (
            f"Aktion nicht erlaubt ({proposal.tool}.{proposal.action}). "
            "Erlaubt: Notiere:/Todo: anlegen, listen, Todo erledigen."
        )
    if proposal.action == "create":
        if proposal.tool == "notes" and not str(proposal.args.get("body") or "").strip():
            return "Leere Notiz — bitte Text nach „Notiere:“."
        if proposal.tool == "todo" and not str(proposal.args.get("title") or "").strip():
            return "Leeres Todo — bitte Titel nach „Todo:“."
    if proposal.action == "done" and not str(proposal.args.get("title") or "").strip():
        return "Was erledigen? z.B. „Erledige: Milch“."
    if proposal.action == "search" and not str(proposal.args.get("query") or "").strip():
        return "Wonach in den Notizen suchen?"
    return None


def confirm_prompt(proposal: ToolProposal) -> str:
    return f"{proposal.preview}. So speichern?"


def execute(
    proposal: ToolProposal,
    *,
    conversation_id: str | None = None,
) -> tuple[str, dict[str, Any]]:
    """Execute allowlisted tool. Returns (reply, result_dict)."""
    err = validate(proposal)
    if err:
        db.add_tool_audit(
            conversation_id=conversation_id,
            tool=proposal.tool,
            action=proposal.action,
            args=proposal.args,
            status="error",
            result={"error": err},
        )
        return f"Tool abgelehnt: {err}.", {"ok": False, "error": err}

    result: dict[str, Any]
    if proposal.tool == "notes" and proposal.action == "create":
        item = db.create_note(
            body=str(proposal.args["body"]),
            conversation_id=conversation_id,
        )
        result = {"ok": True, "id": item["id"], "body": item["body"]}
        reply = f"Notiz gespeichert: {item['body'][:120]}"
    elif proposal.tool == "notes" and proposal.action == "list":
        items = db.list_notes(limit=20)
        result = {"ok": True, "items": items}
        if not items:
            reply = "Keine Notizen bisher."
        else:
            lines = [f"• {it['body'][:100]}" for it in items[:10]]
            reply = "Notizen:\n" + "\n".join(lines)
    elif proposal.tool == "notes" and proposal.action == "search":
        q = str(proposal.args.get("query") or "")
        items = db.search_notes(q, limit=10)
        result = {"ok": True, "items": items, "query": q}
        if not items:
            reply = f"Keine Notizen zu „{q}“."
        else:
            lines = [f"• {it['body'][:100]}" for it in items]
            reply = f"Notizen zu „{q}“:\n" + "\n".join(lines)
    elif proposal.tool == "todo" and proposal.action == "create":
        title = str(proposal.args["title"])
        existing = db.find_open_todo_by_title(title)
        if existing:
            result = {
                "ok": True,
                "id": existing["id"],
                "title": existing["title"],
                "duplicate": True,
            }
            reply = (
                f"Todo „{existing['title']}“ ist schon offen — nichts Neues angelegt. "
                "Offene Todos? oder erledigen mit „Erledige: …“."
            )
        else:
            item = db.create_todo(
                title=title,
                conversation_id=conversation_id,
            )
            result = {"ok": True, "id": item["id"], "title": item["title"]}
            reply = f"Todo gespeichert: {item['title']}"
    elif proposal.tool == "todo" and proposal.action == "list":
        items = db.list_todos(status=str(proposal.args.get("status") or "open"), limit=20)
        result = {"ok": True, "items": items}
        if not items:
            reply = "Keine offenen Todos."
        else:
            lines = [f"• {it['title']}" for it in items[:15]]
            reply = "Offene Todos:\n" + "\n".join(lines)
    elif proposal.tool == "todo" and proposal.action == "done":
        title = str(proposal.args.get("title") or "")
        item = db.complete_todo_by_title(title)
        if not item:
            result = {"ok": False, "error": "not_found"}
            reply = f"Kein offenes Todo passend zu „{title}“."
        else:
            result = {"ok": True, "id": item["id"], "title": item["title"]}
            reply = f"Todo erledigt: {item['title']}"
    else:
        result = {"ok": False, "error": "unknown"}
        reply = "Unbekanntes Tool."

    db.add_tool_audit(
        conversation_id=conversation_id,
        tool=proposal.tool,
        action=proposal.action,
        args=proposal.args,
        status="ok" if result.get("ok") else "error",
        result=result,
    )
    return reply, result


PENDING_TTL_SEC = 600  # Sprint 29 H3: 10 min


def pending_is_expired(pending: dict[str, Any] | None) -> bool:
    if not pending:
        return True
    created = str(pending.get("created_at") or "")
    if not created:
        return False
    try:
        from datetime import datetime, timezone

        ts = datetime.fromisoformat(created.replace("Z", "+00:00"))
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        age = (datetime.now(timezone.utc) - ts).total_seconds()
        return age > PENDING_TTL_SEC
    except ValueError:
        return False


def looks_like_false_tool_claim(text: str) -> bool:
    return bool(
        re.search(
            r"(?i)\b("
            r"notiz\s+gespeichert|"
            r"todo\s+(?:gespeichert|angelegt|erledigt)|"
            r"hab(?:e)?\s+(?:es\s+)?notiert|"
            r"ist\s+notiert|"
            r"auf\s+die\s+todo[\-\s]?liste|"
            r"hab(?:e)?\s+(?:mir\s+)?(?:das\s+)?(?:todo|notiz)"
            r")\b",
            text or "",
        )
    )
