from __future__ import annotations

import re
from typing import Any, Literal

from . import db

MemoryOp = Literal["write", "forget", "forget_all", "none"]

_MERK_RE = re.compile(
    r"(?is)^\s*(?:merk(?:e)?\s*dir|merke\s*dir|erinner(?:e)?\s*dich(?:\s*an)?)\s*"
    r"(?:bitte\s*)?[:\-]?\s*(.+)$"
)
_MERK_DASS_RE = re.compile(
    r"(?is)\bmerk(?:e)?\s*dir(?:\s*,)?\s*(?:bitte\s*)?(?:dass\s+)?(.+)$"
)
# Natural: „Kannst du dir merken, dass …“ / „Könntest du dir merken …“
_MERK_NATURAL_RE = re.compile(
    r"(?is)\b(?:kannst|könntest)\s+(?:du|Sie)\s+dir\s+merken(?:\s*,)?\s*"
    r"(?:dass\s+)?(.+)$"
)
_NOTIER_RE = re.compile(
    r"(?is)^\s*notier(?:e)?(?:\s*dir)?\s*[:\-]?\s*(.+)$"
)
_LIEBLINGS_RE = re.compile(
    r"(?is)\bmein(?:e|en)?\s+lieblings([a-zäöüß]{3,24})\s+ist\s+(.+?)(?:[.!?]|$)"
)
_ICH_MAG_RE = re.compile(
    r"(?is)\bich\s+mag\s+(.+?)(?:[.!?]|$)"
)
_VERGISS_RE = re.compile(
    r"(?is)^\s*(?:vergiss|lösch(?:e)?\s*(?:die\s*)?erinnerung(?:\s*an)?|forget)\s*"
    r"(?:bitte\s*)?[:\-]?\s*(.+)$"
)
_FORGET_ALL_RE = re.compile(
    r"(?is)^\s*(?:vergiss|lösch(?:e)?)\s+(?:bitte\s+)?"
    r"(alles(?:\s+über\s+mich)?|meine\s+erinnerungen|dein\s+gedächtnis|"
    r"alles\s+was\s+du\s+über\s+mich\s+weißt)\s*[.!]?\s*$"
)
# Broad remember-intent (for False-Confirm guard when nothing was stored)
_REMEMBER_INTENT_RE = re.compile(
    r"(?is)\b("
    r"merk(?:e)?\s*dir|"
    r"erinner(?:e)?\s*dich|"
    r"(?:kannst|könntest)\s+(?:du|Sie)\s+dir\s+merken|"
    r"bitte\s+merken|"
    r"notier(?:e)?(?:\s*dir)?"
    r")\b"
)
_FALSE_CONFIRM_RE = re.compile(
    r"(?i)\b("
    r"gemerkt|"
    r"notiert|"
    r"gespeichert|"
    r"hab(?:e)?\s+(?:mir\s+)?gemerkt|"
    r"werde\s+(?:ich\s+)?(?:mir\s+)?merken|"
    r"ist\s+notiert|"
    r"hab(?:e)?\s+(?:es\s+)?drin"
    r")\b"
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
    "dass",
}

_FORGET_ALL_TOKENS = {
    "alles",
    "alles über mich",
    "meine erinnerungen",
    "dein gedächtnis",
    "alles was du über mich weißt",
}


def parse_explicit_remember(text: str) -> tuple[str, str, str] | None:
    """Return (key, value, category) if user explicitly asks to remember."""
    stripped = text.strip()
    m = (
        _MERK_RE.match(stripped)
        or _MERK_DASS_RE.search(stripped)
        or _MERK_NATURAL_RE.search(stripped)
        or _NOTIER_RE.match(stripped)
    )
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


def is_forget_all(text: str) -> bool:
    stripped = text.strip()
    if _FORGET_ALL_RE.match(stripped):
        return True
    m = _VERGISS_RE.match(stripped)
    if not m:
        return False
    q = m.group(1).strip().rstrip(".!").lower()
    return q in _FORGET_ALL_TOKENS


def parse_explicit_forget(text: str) -> str | None:
    if is_forget_all(text):
        return None
    m = _VERGISS_RE.match(text.strip())
    if not m:
        return None
    return m.group(1).strip().rstrip(".!")


def looks_like_remember_intent(text: str) -> bool:
    return bool(_REMEMBER_INTENT_RE.search(text))


def looks_like_false_memory_confirm(text: str) -> bool:
    return bool(_FALSE_CONFIRM_RE.search(text))


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
) -> tuple[MemoryOp, list[str]]:
    """Apply merk/vergiss. Returns (op, notes for system context)."""
    notes: list[str] = []

    if is_forget_all(user_text):
        n = db.clear_all_memory()
        notes.append(f"Langzeitgedächtnis komplett geleert ({n} Einträge).")
        return "forget_all", notes

    forget_q = parse_explicit_forget(user_text)
    if forget_q:
        n = db.delete_memory_by_key_substring(forget_q)
        notes.append(f"Memory gelöscht zu „{forget_q}“ ({n} Einträge).")
        return "forget", notes

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
        return "write", notes

    if looks_like_remember_intent(user_text):
        notes.append(
            "Nichts gespeichert (Formulierung unklar). "
            "NICHT behaupten, etwas gemerkt/notiert zu haben. "
            "Kurz sagen: bitte als „Merk dir: …“ formulieren."
        )
        return "none", notes

    return "none", notes


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


def ack_reply_for_write(notes: list[str]) -> str:
    """Short Jarvis-toned confirmation after a successful write."""
    for n in notes:
        if n.startswith("Gespeichert:"):
            payload = n.split("=", 1)[-1].strip()
            if payload:
                short = payload if len(payload) <= 80 else payload[:77] + "…"
                return f"Notiert: {short}. Was sonst?"
    return "Notiert. Was sonst?"


def ack_reply_for_forget(op: MemoryOp, notes: list[str]) -> str:
    if op == "forget_all":
        return "Alles weg aus dem Langzeitgedächtnis. Frisch startklar — was liegt an?"
    for n in notes:
        if "gelöscht" in n.lower():
            return "Ist raus. Weiter?"
    return "Ist weg. Weiter?"
