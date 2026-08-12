from __future__ import annotations

import re
from typing import Any

from . import db

_MERK_RE = re.compile(
    r"(?is)^\s*(?:merk(?:e)?\s*dir|merke\s*dir|erinner\s*dich(?:\s*an)?)\s*[:\-]?\s*(.+)$"
)
_MERK_DASS_RE = re.compile(
    r"(?is)\bmerk(?:e)?\s*dir(?:\s*,)?\s*dass\s+(.+)$"
)
_LIEBLINGS_RE = re.compile(
    r"(?is)\bmein(?:e|en)?\s+lieblings([a-zäöüß]{3,24})\s+ist\s+(.+?)(?:[.!?]|$)"
)
_ICH_MAG_RE = re.compile(
    r"(?is)\bich\s+mag\s+(.+?)(?:[.!?]|$)"
)
_VERGISS_RE = re.compile(
    r"(?is)^\s*(?:vergiss|lösch(?:e)?\s*(?:die\s*)?erinnerung(?:\s*an)?|forget)\s*[:\-]?\s*(.+)$"
)

_STOP = {
    "das",
    "der",
    "die",
    "und",
    "oder",
    "ein",
    "eine",
    "ist",
    "sind",
    "mein",
    "meine",
    "bitte",
}


def parse_explicit_remember(text: str) -> tuple[str, str, str] | None:
    """Return (key, value, category) if user explicitly asks to remember."""
    m = _MERK_RE.match(text.strip()) or _MERK_DASS_RE.search(text.strip())
    if m:
        payload = m.group(1).strip().rstrip(".!")
        if len(payload) < 2:
            return None
        key = _key_from_payload(payload)
        return key, payload, "fact"
    m2 = _LIEBLINGS_RE.search(text)
    if m2:
        kind = m2.group(1).strip().lower()
        val = m2.group(2).strip().rstrip(".!")
        return f"lieblings{kind}", val, "pref"
    m3 = _ICH_MAG_RE.search(text)
    if m3:
        val = m3.group(1).strip().rstrip(".!")
        if len(val) > 2:
            return _key_from_payload(f"mag_{val}"), val, "pref"
    return None


def parse_explicit_forget(text: str) -> str | None:
    m = _VERGISS_RE.match(text.strip())
    if not m:
        return None
    return m.group(1).strip().rstrip(".!")


def _key_from_payload(payload: str) -> str:
    cleaned = re.sub(r"[^a-zA-ZäöüÄÖÜß0-9\s_]", "", payload.lower())
    parts = [p for p in cleaned.split() if p and p not in _STOP][:4]
    if not parts:
        parts = ["notiz"]
    return "_".join(parts)[:80]


def retrieve_relevant(
    user_text: str,
    *,
    limit: int = 8,
) -> list[dict[str, Any]]:
    items = db.list_memory_items(limit=80)
    if not items:
        return []
    tokens = {
        t
        for t in re.findall(r"[a-zäöüß0-9]{3,}", user_text.lower())
        if t not in _STOP
    }
    if not tokens:
        return items[: min(3, limit)]

    scored: list[tuple[float, dict[str, Any]]] = []
    for it in items:
        blob = f"{it['key']} {it['value']}".lower()
        hit = sum(1 for t in tokens if t in blob)
        score = hit + float(it.get("confidence") or 0) * 0.1
        if hit > 0:
            scored.append((score, it))
    scored.sort(key=lambda x: x[0], reverse=True)
    if scored:
        return [it for _, it in scored[:limit]]
    # Soft fallback: newest few pins so Jarvis still has ambient memory
    return items[: min(3, limit)]


def format_memory_block(items: list[dict[str, Any]]) -> str:
    if not items:
        return ""
    lines = ["## Langzeitgedächtnis (Fakten über den Nutzer — dosiert nutzen)"]
    for it in items:
        lines.append(f"- [{it['category']}] {it['key']}: {it['value']}")
    lines.append(
        "Regeln: Nur einsetzen wenn relevant. Bei Widerspruch zur aktuellen "
        "Nutzeraussage nachfragen. Nicht als Liste vorlesen."
    )
    return "\n".join(lines)


def apply_explicit_memory_commands(
    user_text: str,
    *,
    conversation_id: str,
) -> list[str]:
    """Apply merk/vergiss commands. Returns short notes for system context."""
    notes: list[str] = []
    forget_q = parse_explicit_forget(user_text)
    if forget_q:
        n = db.delete_memory_by_key_substring(forget_q)
        notes.append(f"Memory gelöscht zu „{forget_q}“ ({n} Einträge).")
        return notes

    remembered = parse_explicit_remember(user_text)
    if remembered:
        key, value, category = remembered
        db.upsert_memory_item(
            key=key,
            value=value,
            category=category,
            confidence=0.95,
            source_conversation_id=conversation_id,
        )
        notes.append(f"Gespeichert: {key} = {value}")
    return notes


def harvest_soft_facts(
    user_text: str,
    *,
    conversation_id: str,
    skip: bool = False,
) -> None:
    """Capture clear preference patterns even without 'merk dir'."""
    if skip:
        return
    m = _LIEBLINGS_RE.search(user_text)
    if m:
        kind = m.group(1).strip().lower()
        val = m.group(2).strip().rstrip(".!")
        db.upsert_memory_item(
            key=f"lieblings{kind}",
            value=val,
            category="pref",
            confidence=0.85,
            source_conversation_id=conversation_id,
        )
