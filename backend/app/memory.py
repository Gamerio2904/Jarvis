from __future__ import annotations

import re
from datetime import datetime, timedelta, timezone
from typing import Any, Literal

from . import db

MemoryOp = Literal["write", "forget", "forget_all", "recall", "clarify", "soft_confirm", "soft_reject", "none"]

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
    """Strip filler prefixes and trailing punctuation for clean memory values.

    Sprint 23 H1: fillers only as whole words — never strip Jazz/Japan/Jade.
    """
    v = raw.strip().rstrip(".!?")
    filler = re.compile(
        r"(?is)^(?:bitte|dass|übrigens|eigentlich|also|ja)\b\s*[,:]?\s*"
    )
    for _ in range(6):
        nxt = filler.sub("", v).strip()
        if nxt == v:
            break
        v = nxt
    v = re.sub(r"\s+", " ", v)
    return v[:500]


def is_valid_soft_value(value: str) -> bool:
    """Sprint 23 H2: reject garbage/truncated soft-memory payloads."""
    v = (value or "").strip()
    if len(v) < 3:
        return False
    # single/double letter debris after bad normalize
    if re.fullmatch(r"[a-zäöüß]{1,2}", v.lower()):
        return False
    low = v.lower()
    if low in {"pan", "zz", "de", "ja", "ok", "na", "hm", "äh"}:
        return False
    if re.fullmatch(r"de\s+\w+", low):
        return False
    if is_weak_memory_value(v) and len(v) < 8:
        return False
    return True


_SOFT_REJECT_RE = re.compile(
    r"(?is)^\s*("
    r"nein(?:[,.]?\s+(?:bitte\s+)?(?:nicht(?:\s+merken)?|doch\s+nicht))?|"
    r"(?:bitte\s+)?nicht\s+merken|"
    r"lieber\s+nicht(?:\s+merken)?|"
    r"doch\s+nicht|"
    r"vergiss\s+(?:das|es|den\s+eintrag)"
    r")\s*[.!]?\s*$"
)


def looks_like_soft_reject(text: str) -> bool:
    return bool(_SOFT_REJECT_RE.match((text or "").strip()))


def is_garbage_memory_item(item: dict[str, Any]) -> bool:
    """Sprint 23 H4: known soft-trümmer keys/values."""
    key = str(item.get("key") or "").lower()
    val = str(item.get("value") or "").strip()
    if key in {"mag_pan", "mag_de_tee", "mag_zz"}:
        return True
    if key.startswith("mag_") and not is_valid_soft_value(val):
        return True
    if len(val) <= 2:
        return True
    if val.lower() in {"pan", "zz", "de", "de tee"}:
        return True
    return False


def purge_garbage_soft_memory() -> int:
    """Best-effort delete of known garbage soft facts."""
    items = db.list_memory_items(limit=200, include_expired=True)
    n = 0
    for it in items:
        if is_garbage_memory_item(it):
            if db.delete_memory_item(str(it["id"])):
                n += 1
    return n


def reject_recent_soft_facts(*, conversation_id: str) -> list[str]:
    """Delete recent low-confidence soft prefs for this conversation (Sprint 24 E5)."""
    items = db.list_memory_items(limit=40, include_expired=True)
    notes: list[str] = []
    for it in items:
        if it.get("source_conversation_id") != conversation_id:
            continue
        conf = float(it.get("confidence") or 0)
        if conf >= 0.85:
            continue
        key = str(it.get("key") or "")
        if not (key.startswith("mag_") or key.startswith("lieblings")):
            continue
        if db.delete_memory_item(str(it["id"])):
            notes.append(f"Soft-Reject: {key} gelöscht")
    return notes


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


_IDENTITY_Q_RE = re.compile(
    r"(?is)\b("
    r"wie\s+heiß(?:e|t)\s+(?:ich|sie|du)|"
    r"mein(?:e[rn]?)?\s+name|"
    r"wie\s+ist\s+mein\s+name|"
    r"wer\s+bin\s+ich"
    r")\b"
)
_IDENTITY_KEYS = {
    "name",
    "vorname",
    "nachname",
    "rufname",
    "username",
    "full_name",
}


def retrieve_relevant(
    user_text: str,
    *,
    limit: int = 8,
    ambient_fallback: bool = False,
    min_confidence: float = 0.0,
) -> list[dict[str, Any]]:
    items = db.list_memory_items(limit=80, include_expired=False)
    items = [
        i
        for i in items
        if float(i.get("confidence") or 0) >= min_confidence and not is_garbage_memory_item(i)
    ]
    if not items:
        return []
    tokens = {
        t
        for t in re.findall(r"[a-zäöüß0-9]{3,}", user_text.lower())
        if t not in _STOP
    }
    identity_q = bool(_IDENTITY_Q_RE.search(user_text or ""))
    if identity_q:
        tokens |= {"name", "vorname", "nachname"}

    scored: list[tuple[float, dict[str, Any]]] = []
    seen: set[str] = set()
    if identity_q:
        for it in items:
            key = str(it.get("key") or "").lower()
            if key in _IDENTITY_KEYS or key.endswith("_name") or key == "name":
                score = 10.0 + float(it.get("confidence") or 0)
                scored.append((score, it))
                seen.add(str(it.get("id") or key))

    if not tokens and not scored:
        return items[: min(3, limit)] if ambient_fallback else []

    for it in items:
        iid = str(it.get("id") or it.get("key") or "")
        if iid in seen:
            continue
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


def is_weak_memory_value(value: str) -> bool:
    """True for empty/filler payloads that must not be stored (Sprint 13 F3)."""
    v = (value or "").strip().rstrip(".!?")
    if len(v) < 4:
        return True
    if re.match(
        r"(?is)^(das|es|dies|etwas|irgendwie|was|mal|so|einfach)(\s+(das|es|irgendwie|etwas|mal|so|bitte))*$",
        v,
    ):
        return True
    tokens = re.findall(r"[a-zäöüß0-9]+", v.lower())
    weak = {
        "das",
        "es",
        "dies",
        "etwas",
        "irgendwie",
        "was",
        "mal",
        "so",
        "bitte",
        "einfach",
        "halt",
        "auch",
    }
    if tokens and all(t in weak for t in tokens):
        return True
    return False


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
        strong = [(k, v, c) for k, v, c in remembered if not is_weak_memory_value(v)]
        if not strong:
            notes.append(
                "Nichts gespeichert (Inhalt zu unklar/leer). "
                "NICHT behaupten, etwas gemerkt/notiert zu haben. "
                "Kurz sagen: bitte als „Merk dir: …“ mit konkretem Fakt formulieren."
            )
            return "none", notes
        for key, value, category in strong:
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
) -> list[str]:
    """Capture clear preference patterns even without 'merk dir' (TTL + low conf).

    Returns notes for soft-confirm UX (Sprint 22 A5 + 23 H2 gate).
    """
    if skip:
        return []
    if parse_contradiction(user_text):
        return []

    notes: list[str] = []
    pref = parse_lieblings_pref(user_text)
    if pref:
        key, val, category = pref
        if not is_valid_soft_value(val):
            return []
        db.upsert_memory_item(
            key=key,
            value=val,
            category=category,
            confidence=confidence,
            source_conversation_id=conversation_id,
            expires_at=_expires_iso(ttl_days),
        )
        notes.append(f"Soft: {key} = {val}")
        return notes

    m3 = _ICH_MAG_RE.search(user_text)
    if m3:
        val = normalize_value(m3.group(1))
        if not is_valid_soft_value(val):
            return []
        key = _key_from_payload(f"mag_{val}")
        db.upsert_memory_item(
            key=key,
            value=val,
            category="pref",
            confidence=confidence,
            source_conversation_id=conversation_id,
            expires_at=_expires_iso(ttl_days),
        )
        notes.append(f"Soft: {key} = {val}")
    return notes


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
    """Sprint 24 E3: always include weg/raus/gelöscht needle."""
    if op == "forget_all":
        return "Alles weg aus dem Langzeitgedächtnis. Frisch startklar — was liegt an?"
    for n in notes:
        if "gelöscht" in n.lower() or "Soft-Reject" in n:
            return "Ist raus — gelöscht. Weiter?"
    return "Ist weg. Weiter?"


def ack_reply_for_soft_reject(notes: list[str]) -> str:
    if notes:
        return "Alles klar — nicht gemerkt, Eintrag ist weg. Weiter?"
    return "Alles klar — nichts Unsicheres gemerkt. Weiter?"


def ack_reply_for_recall(notes: list[str]) -> str:
    """Deterministic recall fallback when the model collapses to Aussetzer."""
    facts = [n.split(":", 1)[-1].strip() for n in notes if n.startswith("Recall:")]
    facts = [f for f in facts if f and "nichts passendes" not in f.lower()]
    if not facts:
        return "Dazu habe ich nichts Passendes — formulieren Sie die Frage enger?"
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
