"""Local tools runtime — Sprint 28–30.

Confirm-before-write for notes & todos. Read ops execute immediately.
Sprint 30: list filters, numbered lists, multi-turn ordinal continuity.
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
    # Singular write only — avoid eating „Todos zu …“ / „Todos suchen“
    r"(?is)^\s*(?:todo|to-?do|aufgabe)(?![sS])\s*[:\-]?\s*(.+)$"
)
_TODO_LIST_DONE_RE = re.compile(
    r"(?is)\b(?:zeig(?:e)?\s+(?:mir\s+)?)?(?:die\s+)?erledigte[ns]?\s+todos?\b"
    r"|\btodos?\s+erledigt\b"
)
_TODO_LIST_ALL_RE = re.compile(
    r"(?is)\b(?:zeig(?:e)?\s+(?:mir\s+)?)?(?:die\s+)?alle\s+todos?\b"
    r"|\btodos?\s+alle\b"
)
_TODO_SEARCH_RE = re.compile(
    r"(?is)\b(?:todos?|aufgaben)\s+(?:suchen[:\s]+|zu|mit|über)\s*(.+?)(?:\?|$)"
)
_TODO_LIST_RE = re.compile(
    r"(?is)\b("
    r"offene\s+todos?|"
    r"meine\s+todos?|"
    r"zeig(?:e)?\s+(?:mir\s+)?(?:die\s+)?(?:offene\s+)?todos?|"
    r"todos?\s+(?:liste|auflisten)|"
    r"was\s+(?:steht|habe\s+ich)\s+(?:auf\s+)?(?:der\s+)?(?:todo|to-?do)"
    r")\b"
)
_NOTE_LIST_RE = re.compile(
    r"(?is)\b("
    r"meine\s+notizen|"
    r"zeig(?:e)?\s+(?:mir\s+)?(?:die\s+)?notizen|"
    r"was\s+steht\s+in\s+meinen\s+notizen|"
    r"notizen\s+(?:liste|auflisten)"
    r")\b"
)
_NOTE_SEARCH_RE = re.compile(
    r"(?is)\b(?:notiz|notizen).{0,40}?\b(?:zu|über|mit|suchen[:\s]+)\s*(.+?)(?:\?|$)"
)
# Sprint 30 P1: ordinal / anaphora before generic title-done
_ORDINAL_DONE_RE = re.compile(
    r"(?is)^\s*(?:erledige|done|abhak(?:e)?|hak\s+(?:das\s+)?ab|todo\s+fertig)\s+"
    r"(?:(?:das|den|die)\s+)?"
    r"(?:"
    r"(?P<word>erste[ns]?|zweite[ns]?|dritte[ns]?|vierte[ns]?|fünfte[ns]?|"
    r"sechste[ns]?|siebte[ns]?|achte[ns]?|neunte[ns]?|zehnte[ns]?|letzte[ns]?)|"
    r"(?:nr\.?|nummer|#)\s*(?P<n>\d+)|"
    r"(?P<n2>\d+)\."
    r")"
    r"\s*[!?.]*\s*$"
)
_ANAPHORA_DONE_RE = re.compile(
    r"(?is)^\s*(?:erledige|done|abhak(?:e)?|hak\s+ab)\s+"
    r"(?:das|es|den|die)\s*[!?.]*\s*$"
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

_ORDINAL_WORDS: dict[str, int] = {
    "erste": 0,
    "erster": 0,
    "erstes": 0,
    "ersten": 0,
    "zweite": 1,
    "zweiter": 1,
    "zweites": 1,
    "zweiten": 1,
    "dritte": 2,
    "dritter": 2,
    "drittes": 2,
    "dritten": 2,
    "vierte": 3,
    "vierter": 3,
    "viertes": 3,
    "vierten": 3,
    "fünfte": 4,
    "fünfter": 4,
    "fünftes": 4,
    "fünften": 4,
    "sechste": 5,
    "sechster": 5,
    "sechstes": 5,
    "sechsten": 5,
    "siebte": 6,
    "siebter": 6,
    "siebtes": 6,
    "siebten": 6,
    "achte": 7,
    "achter": 7,
    "achtes": 7,
    "achten": 7,
    "neunte": 8,
    "neunter": 8,
    "neuntes": 8,
    "neunten": 8,
    "zehnte": 9,
    "zehnter": 9,
    "zehntes": 9,
    "zehnten": 9,
    "letzte": -1,
    "letzter": -1,
    "letztes": -1,
    "letzten": -1,
}


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


def _ordinal_from_match(m: re.Match[str]) -> int:
    word = (m.group("word") or "").lower()
    if word:
        return _ORDINAL_WORDS.get(word, 0)
    for key in ("n", "n2"):
        raw = m.groupdict().get(key)
        if raw:
            n = int(raw)
            return max(0, n - 1)
    return 0


def parse_tool_request(text: str) -> ToolProposal | None:
    """Heuristic parse — no LLM required for v1."""
    stripped = (text or "").strip()
    if not stripped:
        return None

    # P1: list continuity — ordinal / anaphora before titled done
    m = _ORDINAL_DONE_RE.match(stripped)
    if m:
        idx = _ordinal_from_match(m)
        return ToolProposal(
            tool="todo",
            action="done",
            args={"ordinal": idx, "title": "", "continuity": True},
            needs_confirm=False,
            preview="Todo erledigen (Liste)",
        )
    if _ANAPHORA_DONE_RE.match(stripped):
        return ToolProposal(
            tool="todo",
            action="done",
            args={"ordinal": 0, "title": "", "continuity": True, "anaphora": True},
            needs_confirm=False,
            preview="Todo erledigen (Bezug)",
        )

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

    # P2: list filters before generic open list
    if _TODO_LIST_DONE_RE.search(stripped):
        return ToolProposal(
            tool="todo",
            action="list",
            args={"status": "done"},
            needs_confirm=False,
            preview="Erledigte Todos listen",
        )
    if _TODO_LIST_ALL_RE.search(stripped):
        return ToolProposal(
            tool="todo",
            action="list",
            args={"status": "all"},
            needs_confirm=False,
            preview="Alle Todos listen",
        )
    m = _TODO_SEARCH_RE.search(stripped)
    if m:
        q = m.group(1).strip()[:80]
        if q:
            return ToolProposal(
                tool="todo",
                action="search",
                args={"query": q},
                needs_confirm=False,
                preview=f"Todos suchen: {q}",
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


def resolve_continuity_title(
    proposal: ToolProposal,
    *,
    conversation_id: str,
) -> str | None:
    """Fill title from last todo list context. Returns error message or None."""
    if not proposal.args.get("continuity"):
        return None
    ctx = db.get_tool_list_context(conversation_id)
    if not ctx or ctx.get("kind") != "todo":
        return "Keine Todo-Liste im Kontext — zuerst „Offene Todos?“."
    items = ctx.get("items") or []
    if not items:
        return "Die letzte Todo-Liste war leer."
    idx = int(proposal.args.get("ordinal", 0))
    if idx < 0:
        idx = len(items) - 1
    if idx >= len(items):
        return f"Nur {len(items)} Einträge in der letzten Liste (1–{len(items)})."
    title = str(items[idx].get("title") or "").strip()
    if not title:
        return "Eintrag ohne Titel in der Liste."
    proposal.args["title"] = title
    proposal.preview = f"Todo erledigen: {title}"
    return None


def validate(proposal: ToolProposal) -> str | None:
    key = (proposal.tool, proposal.action)
    # search on todos uses list path with filter — allow via special case
    if proposal.tool == "todo" and proposal.action == "search":
        if not str(proposal.args.get("query") or "").strip():
            return "Wonach in den Todos suchen?"
        return None
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
    if proposal.action == "done":
        if proposal.args.get("continuity") and not str(proposal.args.get("title") or "").strip():
            return None  # resolved later
        if not str(proposal.args.get("title") or "").strip():
            return "Was erledigen? z.B. „Erledige: Milch“ oder „Erledige das erste“."
    if proposal.action == "search" and not str(proposal.args.get("query") or "").strip():
        return "Wonach in den Notizen suchen?"
    return None


def confirm_prompt(proposal: ToolProposal) -> str:
    return f"{proposal.preview}. So speichern?"


def _format_todo_lines(items: list[dict[str, Any]], *, with_status: bool = False) -> list[str]:
    lines: list[str] = []
    for i, it in enumerate(items[:15], 1):
        title = str(it.get("title") or "")
        if with_status:
            st = str(it.get("status") or "open")
            mark = "✓" if st == "done" else "·"
            lines.append(f"{i}. [{mark}] {title}")
        else:
            lines.append(f"{i}. {title}")
    return lines


def _remember_todo_list(
    conversation_id: str | None,
    items: list[dict[str, Any]],
) -> None:
    if not conversation_id:
        return
    slim = [
        {"id": it.get("id"), "title": it.get("title"), "status": it.get("status")}
        for it in items[:20]
    ]
    db.set_tool_list_context(conversation_id, kind="todo", items=slim)


def execute(
    proposal: ToolProposal,
    *,
    conversation_id: str | None = None,
) -> tuple[str, dict[str, Any]]:
    """Execute allowlisted tool. Returns (reply, result_dict)."""
    # Map todo.search → filtered list
    if proposal.tool == "todo" and proposal.action == "search":
        q = str(proposal.args.get("query") or "").strip().lower()
        all_items = db.list_todos(status="all", limit=50)
        items = [it for it in all_items if q in str(it.get("title") or "").lower()]
        result: dict[str, Any] = {"ok": True, "items": items, "query": q}
        _remember_todo_list(conversation_id, items)
        if not items:
            reply = f"Keine Todos zu „{q}“."
        else:
            lines = _format_todo_lines(items, with_status=True)
            reply = f"Todos zu „{q}“:\n" + "\n".join(lines)
        db.add_tool_audit(
            conversation_id=conversation_id,
            tool=proposal.tool,
            action="search",
            args=proposal.args,
            status="ok",
            result=result,
        )
        return reply, result

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
            lines = [f"{i}. {it['body'][:100]}" for i, it in enumerate(items[:10], 1)]
            reply = "Notizen:\n" + "\n".join(lines)
    elif proposal.tool == "notes" and proposal.action == "search":
        q = str(proposal.args.get("query") or "")
        items = db.search_notes(q, limit=10)
        result = {"ok": True, "items": items, "query": q}
        if not items:
            reply = f"Keine Notizen zu „{q}“."
        else:
            lines = [f"{i}. {it['body'][:100]}" for i, it in enumerate(items, 1)]
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
                "Offene Todos? oder erledigen mit „Erledige: …“ / „Erledige das erste“."
            )
        else:
            item = db.create_todo(
                title=title,
                conversation_id=conversation_id,
            )
            result = {"ok": True, "id": item["id"], "title": item["title"]}
            reply = f"Todo gespeichert: {item['title']}"
    elif proposal.tool == "todo" and proposal.action == "list":
        status = str(proposal.args.get("status") or "open")
        items = db.list_todos(status=status, limit=20)
        result = {"ok": True, "items": items, "status": status}
        _remember_todo_list(conversation_id, items)
        labels = {"open": "Offene Todos", "done": "Erledigte Todos", "all": "Alle Todos"}
        label = labels.get(status, "Todos")
        if not items:
            reply = f"Keine Einträge unter „{label}“."
        else:
            with_status = status == "all"
            lines = _format_todo_lines(items, with_status=with_status)
            reply = f"{label}:\n" + "\n".join(lines)
            reply += "\n(Erledigen: „Erledige das erste“ / „Erledige Nr. 2“)"
    elif proposal.tool == "todo" and proposal.action == "done":
        title = str(proposal.args.get("title") or "")
        item = db.complete_todo_by_title(title)
        if not item:
            result = {"ok": False, "error": "not_found"}
            reply = f"Kein offenes Todo passend zu „{title}“."
        else:
            result = {
                "ok": True,
                "id": item["id"],
                "title": item["title"],
                "continuity": bool(proposal.args.get("continuity")),
            }
            reply = f"Todo erledigt: {item['title']}"
            # Refresh open-list context after done
            if conversation_id:
                open_items = db.list_todos(status="open", limit=20)
                _remember_todo_list(conversation_id, open_items)
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


def tool_status_label(status: str | None) -> str:
    """UI chip labels (Sprint 30 P5)."""
    return {
        "pending": "Tool bereit — Confirm?",
        "executed": "Tool ausgeführt",
        "aborted": "Tool abgelehnt",
        "duplicate": "Todo schon offen",
        "error": "Tool-Fehler",
        "timeout": "Confirm abgelaufen",
        "parse_miss": "Tool unklar",
    }.get(str(status or ""), f"Tool: {status or '—'}")
