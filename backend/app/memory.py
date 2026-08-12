from __future__ import annotations

import re
from datetime import datetime, timedelta, timezone
from typing import Any, Literal

from . import db

MemoryOp = Literal["write", "forget", "forget_all", "recall", "clarify", "none"]

_MERK_RE = re.compile(
    r"(?is)^\s*(?:merk(?:e)?\s*dir|merke\s*dir|erinner(?:e)?\s*dich(?:\s*an)?)\s*"
    r"(?:bitte\s*)?[:\-]?\s*(.+)$"
)
_MERK_DASS_RE = re.compile(
    r"(?is)\bmerk(?:e)?\s*dir(?:\s*,)?\s*(?:bitte\s*)?(?:dass\s+)?(.+)$"
)
_MERK_NATURAL_RE = re.compile(
    r"(?is)\b(?:kannst|könntest|würdest)\s+(?:du|Sie)\s+(?:dir\s+)?"
    r"(?:merken|merken\s+dass|behalten)(?:\s*,)?\s*(?:dass\s+)?(.+)$"
)
_NOTIER_RE = re.compile(
    r"(?is)^\s*(?:notier(?:e)?(?:\s*dir)?|speicher(?:e)?|behalte)\s*[:\-]?\s*(.+)$"
)
_BITTE_MERKEN_RE = re.compile(
    r"(?is)\bbitte\s+(?:merk(?:e)?\s*dir|merken)(?:\s*,)?\s*(?:dass\s+)?(.+)$"
)
_LIEBLINGS_RE = re.compile(
    r"(?is)\bmein(?:e|en)?\s+lieblings([a-zäöüß]{3,24})\s+ist\s+(.+?)(?:[.!?]|$)"
)
_LIEBLINGS_BARE_RE = re.compile(
    r"(?is)\blieblings([a-zäöüß]{3,24})\s+ist\s+(.+?)(?:[.!?]|$)"
)
_ICH_MAG_RE = re.compile(
    r"(?is)\bich\s+mag\s+(.+?)(?:[.!?]|$)"
)
_CONTRADICT_LIEBLINGS_RE = re.compile(
    r"(?is)\bmein(?:e|en)?\s+lieblings([a-zäöüß]{3,24})\s+ist\s+"
    r"(?:übrigens\s+)?nicht\s+.+?,\s*sondern\s+(.+?)(?:[.!?]|$)"
)
_CONTRADICT_GENERIC_RE = re.compile(
    r"(?is)\b(?:nicht\s+(.+?),\s*sondern\s+(.+?)|"
    r"(.+?)\s+war\s+falsch[,:]?\s*(.+?)\s+stimmt)\b"
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
_REMEMBER_INTENT_RE = re.compile(
    r"(?is)\b("
    r"merk(?:e)?\s*dir|"
    r"erinner(?:e)?\s*dich|"
    r"(?:kannst|könntest|würdest)\s+(?:du|Sie)\s+(?:dir\s+)?merken|"
    r"bitte\s+merken|"
    r"notier(?:e)?(?:\s*dir)?|"
    r"speicher(?:e)?|"
    r"behalte"
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

# Atomic fact extractors for multi-fact split.
# Clause values stop before coordinating "und"/"oder" (H1/H5).
_FACT_PATTERNS: list[tuple[re.Pattern[str], str, str]] = [
    (re.compile(r"(?is)\bich\s+heiß(?:e|t)\s+([A-ZÄÖÜ][\wÄÖÜäöüß\-]+)"), "name", "fact"),
    (re.compile(r"(?is)\bwohne\s+in\s+([A-ZÄÖÜ][\wÄÖÜäöüß\-]+)"), "wohnort", "fact"),
    (
        re.compile(r"(?is)\b(?:mein(?:e|en)?\s+)?hund\s+heiß(?:t|e)\s+([A-ZÄÖÜ][\wÄÖÜäöüß\-]+)"),
        "hund",
        "fact",
    ),
    (
        re.compile(r"(?is)\b(?:mein(?:e|en)?\s+)?katze\s+heiß(?:t|e)\s+([A-ZÄÖÜ][\wÄÖÜäöüß\-]+)"),
        "katze",
        "fact",
    ),
    (
        re.compile(
            r"(?is)\barbeite\s+als\s+(.+?)(?=\s+\bund\b|\s+\boder\b|[,.!?]|$)"
        ),
        "beruf",
        "fact",
    ),
    (
        re.compile(
            r"(?is)\bich\s+bin\s+(?:ein(?:e)?\s+)?(.+?)(?=\s+\bund\b|\s+\boder\b|[,.!?]|$)"
        ),
        "bin",
        "fact",
    ),
]

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
    "übrigens",
}

_FORGET_ALL_TOKENS = {
    "alles",
    "alles über mich",
    "meine erinnerungen",
    "dein gedächtnis",
    "alles was du über mich weißt",
}

_CJK_RE = re.compile(r"[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]")
_CYRILLIC_RE = re.compile(r"[\u0400-\u04FF]")


def normalize_value(raw: str) -> str:
    """Strip filler prefixes and trailing punctuation for clean memory values."""
    v = raw.strip().rstrip(".!?")
    filler = re.compile(
        r"(?is)^(bitte|dass|übrigens|eigentlich|also|ja)\s*[,:]?\s*"
    )
    for _ in range(6):
        nxt = filler.sub("", v).strip()
        if nxt == v:
            break
        v = nxt
    v = re.sub(r"\s+", " ", v)
    return v[:500]


def _trim_clause(raw: str) -> str:
    """Cut value at coordinating und/oder so multi-fact clauses stay atomic."""
    v = re.split(r"(?is)\s+\bund\b|\s+\boder\b", raw, maxsplit=1)[0]
    return normalize_value(v)


def parse_lieblings_pref(text: str) -> tuple[str, str, str] | None:
    """Shared Lieblings-Pref parser (with or without 'mein') — H3/H6."""
    m = _LIEBLINGS_RE.search(text) or _LIEBLINGS_BARE_RE.search(text)
    if not m:
        return None
    kind = m.group(1).strip().lower()
    val = normalize_value(m.group(2))
    val = re.split(r"(?i),\s*nicht\b", val)[0].strip()
    val = re.sub(r"(?is)^(?:übrigens\s+)?nicht\s+.+?,\s*sondern\s+", "", val).strip()
    if not val:
        return None
    return f"lieblings{kind}", val, "pref"


def _key_from_payload(payload: str) -> str:
    cleaned = re.sub(r"[^a-zA-ZäöüÄÖÜß0-9\s_]", "", payload.lower())
    parts = [p for p in cleaned.split() if p and p not in _STOP][:4]
    if not parts:
        parts = ["notiz"]
    return "_".join(parts)[:80]


def split_atomic_facts(payload: str) -> list[tuple[str, str, str]]:
    """Split a multi-clause remember payload into atomic (key, value, category)."""
    found: list[tuple[str, str, str]] = []
    seen_keys: set[str] = set()
    for pattern, key, category in _FACT_PATTERNS:
        m = pattern.search(payload)
        if not m:
            continue
        val = _trim_clause(m.group(1))
        if len(val) < 2 or key in seen_keys:
            continue
        seen_keys.add(key)
        found.append((key, val, category))
    return found


def parse_contradiction(text: str) -> tuple[str, str, str] | None:
    """Detect „nicht X, sondern Y“ for prefs; returns (key, new_value, category)."""
    m = _CONTRADICT_LIEBLINGS_RE.search(text)
    if m:
        kind = m.group(1).strip().lower()
        val = normalize_value(m.group(2))
        if val:
            return f"lieblings{kind}", val, "pref"
    return None


_GENERIC_CONTRADICT_RE = re.compile(
    r"(?is)\bnicht\s+(.+?),\s*sondern\s+(.+?)(?:[.!?]|$)"
)


def resolve_contradiction(text: str) -> tuple[str, str, str] | None:
    """Lieblings-pattern or match existing memory value being corrected."""
    direct = parse_contradiction(text)
    if direct:
        return direct
    m = _GENERIC_CONTRADICT_RE.search(text)
    if not m:
        return None
    old_v = normalize_value(m.group(1))
    new_v = normalize_value(m.group(2))
    if len(new_v) < 2:
        return None
    old_l = old_v.lower()
    for it in db.list_memory_items(limit=80, include_expired=False):
        val_l = str(it.get("value") or "").lower()
        if not val_l:
            continue
        if old_l == val_l or old_l in val_l or val_l in old_l:
            return it["key"], new_v, it.get("category") or "fact"
    # Weak heuristic for tea/food/color words
    blob = f"{old_v} {new_v}".lower()
    if "tee" in blob:
        return "lieblingstee", new_v, "pref"
    if any(w in blob for w in ("essen", "döner", "pizza", "pasta")):
        return "lieblingsessen", new_v, "pref"
    if any(w in blob for w in ("farbe", "grün", "blau", "rot")):
        return "lieblingsfarbe", new_v, "pref"
    return (_key_from_payload(f"korrigiert_{new_v}"), new_v, "fact")


def _facts_from_payload(payload: str) -> list[tuple[str, str, str]]:
    """Extract atoms from a merk/speichere payload; fall back to one fact."""
    if len(payload) < 2:
        return []
    # Prefer contradiction inside payload ("nicht X, sondern Y")
    contra = parse_contradiction(payload)
    if contra:
        return [contra]
    atoms = split_atomic_facts(payload)
    if atoms:
        return atoms
    # Explicit "merk dir: (mein) Lieblingstee ist …" / "Speichere: Lieblingsfarbe ist …"
    pref = parse_lieblings_pref(payload)
    if pref:
        return [pref]
    return [(_key_from_payload(payload), payload, "fact")]


def parse_explicit_remember_many(text: str) -> list[tuple[str, str, str]]:
    """Return zero or more (key, value, category) facts to store.

    Bare preference utterances (ohne Merk-Intent) gehen an Soft-Harvest,
    nicht hier — sonst fehlt TTL/niedrige Confidence.
    """
    contradicted = parse_contradiction(text)
    if contradicted:
        return [contradicted]

    stripped = text.strip()
    m = (
        _MERK_RE.match(stripped)
        or _MERK_DASS_RE.search(stripped)
        or _MERK_NATURAL_RE.search(stripped)
        or _BITTE_MERKEN_RE.search(stripped)
        or _NOTIER_RE.match(stripped)
    )
    if m:
        payload = normalize_value(m.group(1))
        return _facts_from_payload(payload)

    return []


def parse_explicit_remember(text: str) -> tuple[str, str, str] | None:
    many = parse_explicit_remember_many(text)
    return many[0] if many else None


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


def summary_is_german_clean(text: str) -> bool:
    if not text or not text.strip():
        return False
    if _CJK_RE.search(text) or _CYRILLIC_RE.search(text):
        return False
    return True


def _expires_iso(days: float | None) -> str | None:
    if days is None or days <= 0:
        return None
    return (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()


def retrieve_relevant(
    user_text: str,
    *,
    limit: int = 8,
    ambient_fallback: bool = False,
    min_confidence: float = 0.0,
) -> list[dict[str, Any]]:
    items = db.list_memory_items(limit=80, include_expired=False)
    items = [i for i in items if float(i.get("confidence") or 0) >= min_confidence]
    if not items:
        return []
    tokens = {
        t
        for t in re.findall(r"[a-zäöüß0-9]{3,}", user_text.lower())
        if t not in _STOP
    }
    if not tokens:
        return items[: min(3, limit)] if ambient_fallback else []

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
    if ambient_fallback:
        return items[: min(3, limit)]
    return []


def format_memory_block(items: list[dict[str, Any]]) -> str:
    if not items:
        return ""
    lines = ["## Langzeitgedächtnis (Fakten über den Nutzer — dosiert nutzen)"]
    for it in items:
        conf = float(it.get("confidence") or 0)
        tag = "unsicher" if conf < 0.7 else it["category"]
        lines.append(f"- [{tag}] {it['key']}: {it['value']}")
    lines.append(
        "Regeln: Nur einsetzen wenn relevant. Bei Widerspruch zur aktuellen "
        "Nutzeraussage nachfragen. Nicht als Liste vorlesen. "
        "„unsicher“-Einträge nur vorsichtig nutzen."
    )
    return "\n".join(lines)


def apply_explicit_memory_commands(
    user_text: str,
    *,
    conversation_id: str,
) -> tuple[MemoryOp, list[str]]:
    """Apply merk/vergiss/clarify. Returns (op, notes for system context)."""
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

    # Clarify before generic write (I1d)
    contradicted = resolve_contradiction(user_text)
    if contradicted:
        key, value, category = contradicted
        existing = next(
            (i for i in db.list_memory_items(limit=80) if i["key"] == key),
            None,
        )
        old_val = existing["value"] if existing else None
        db.upsert_memory_item(
            key=key,
            value=value,
            category=category,
            confidence=0.95,
            source_conversation_id=conversation_id,
            expires_at=None,
        )
        if old_val:
            notes.append(f"Clarify: {key}: {old_val} → {value}")
        else:
            notes.append(f"Clarify: {key} = {value}")
        return "clarify", notes

    remembered = parse_explicit_remember_many(user_text)
    # parse_explicit_remember_many may still return contradiction-as-write; skip if clarify-shaped
    if remembered and not resolve_contradiction(user_text):
        for key, value, category in remembered:
            db.upsert_memory_item(
                key=key,
                value=value,
                category=category,
                confidence=0.95,
                source_conversation_id=conversation_id,
                expires_at=None,
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
    confidence: float = 0.55,
    ttl_days: float = 14.0,
) -> None:
    """Capture clear preference patterns even without 'merk dir' (TTL + low conf)."""
    if skip:
        return
    # Contradictions are explicit writes — never soft-harvest them.
    if parse_contradiction(user_text):
        return

    pref = parse_lieblings_pref(user_text)
    if pref:
        key, val, category = pref
        db.upsert_memory_item(
            key=key,
            value=val,
            category=category,
            confidence=confidence,
            source_conversation_id=conversation_id,
            expires_at=_expires_iso(ttl_days),
        )
        return

    m3 = _ICH_MAG_RE.search(user_text)
    if m3:
        val = normalize_value(m3.group(1))
        if len(val) <= 2:
            return
        db.upsert_memory_item(
            key=_key_from_payload(f"mag_{val}"),
            value=val,
            category="pref",
            confidence=confidence,
            source_conversation_id=conversation_id,
            expires_at=_expires_iso(ttl_days),
        )


def ack_reply_for_write(notes: list[str]) -> str:
    """Short Jarvis-toned confirmation after a successful write."""
    saved = [n.split("=", 1)[-1].strip() for n in notes if n.startswith("Gespeichert:")]
    if not saved:
        return "Notiert. Was sonst?"
    if len(saved) == 1:
        short = saved[0] if len(saved[0]) <= 80 else saved[0][:77] + "…"
        return f"Notiert: {short}. Was sonst?"
    joined = "; ".join(saved[:3])
    if len(joined) > 100:
        joined = joined[:97] + "…"
    return f"Notiert ({len(saved)}): {joined}. Was sonst?"


def ack_reply_for_forget(op: MemoryOp, notes: list[str]) -> str:
    if op == "forget_all":
        return "Alles weg aus dem Langzeitgedächtnis. Frisch startklar — was liegt an?"
    for n in notes:
        if "gelöscht" in n.lower():
            return "Ist raus. Weiter?"
    return "Ist weg. Weiter?"


def ack_reply_for_recall(notes: list[str]) -> str:
    """Deterministic recall fallback when the model collapses to Aussetzer."""
    facts = [n.split(":", 1)[-1].strip() for n in notes if n.startswith("Recall:")]
    if not facts:
        return "Dazu habe ich etwas notiert — welche Detailfrage genau?"
    if len(facts) == 1:
        return f"Soweit notiert: {facts[0]}. Stimmt das noch?"
    joined = "; ".join(facts[:3])
    return f"Soweit notiert: {joined}. Was davon brauchen Sie?"


def ack_reply_for_clarify(notes: list[str]) -> str:
    """Confirm replacement + one short follow-up question (I1d)."""
    for n in notes:
        if n.startswith("Clarify:") and "→" in n:
            # Clarify: key: old → new
            body = n.split(":", 1)[-1].strip()
            if "→" in body:
                left, new = body.split("→", 1)
                new = new.strip()
                old_part = left.split(":", 1)[-1].strip() if ":" in left else left.strip()
                return f"{new} statt {old_part} — so merken?"
            return f"{body} — so merken?"
        if n.startswith("Clarify:"):
            body = n.split(":", 1)[-1].strip()
            return f"{body} — so notiert. Passt das?"
    return "Korrigiert. So merken?"


def looks_like_recall_question(text: str) -> bool:
    return bool(
        re.search(
            r"(?is)\b("
            r"erinnerst\s+(?:du|Sie)\s+dich|"
            r"weißt\s+(?:du|Sie)\s+noch|"
            r"was\s+(?:ist|mag|war)\s+mein|"
            r"was\s+mag\s+ich|"
            r"welchen?\s+\w+\s+habe\s+ich|"
            r"wie\s+heiß(?:e|t)\s+(?:mein|ich)|"
            r"nochmal\b"
            r")\b",
            text,
        )
    )
