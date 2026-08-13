"""Delight: moments, inside jokes, Easter eggs (Sprint 18+) + session mood (0.7.3/0.8.3)."""
from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import date
from typing import Any

from . import db

EASTER_EGGS: list[dict[str, str]] = [
    {
        "command": "/protokoll",
        "description": "Trockener Status: Version, Modell, Memory-Count",
        "example": "/protokoll",
    },
    {
        "command": "/mission",
        "description": "Kurze Quatsch-Mission im Jarvis-Ton",
        "example": "/mission",
    },
    {
        "command": "/kante",
        "description": "Session-Modus: etwas schärfer (pro Gespräch)",
        "example": "/kante",
    },
    {
        "command": "/ruhe",
        "description": "Session-Modus: ruhiger (pro Gespräch)",
        "example": "/ruhe",
    },
    {
        "command": "/vergissWitz",
        "description": "Letzten Joke-Pin löschen",
        "example": "/vergissWitz",
    },
    {
        "command": "/quellen",
        "description": "Hinweis zu Research/Quellen (wenn Opt-in)",
        "example": "/quellen",
    },
    {
        "command": "/hilfe",
        "description": "Kurz: was Jarvis kann (Fähigkeiten-Karte)",
        "example": "/hilfe",
    },
]

_EGG_RE = re.compile(
    r"(?is)^\s*/?\s*(protokoll|mission|kante|ruhe|vergisswitz|quellen|hilfe)\s*$"
)

# In-process cache; mood/caps source of truth in DB (Sprint 25 O2/O6)
_MOOD_BY_CONV: dict[str, str] = {}
_MOMENTS_CACHE: dict[str, int] = {}
_JOKES_CACHE: dict[str, int] = {}


@dataclass
class EggResult:
    handled: bool
    reply: str | None = None
    mood: str | None = None


def parse_egg_command(text: str) -> str | None:
    m = _EGG_RE.match((text or "").strip())
    if not m:
        return None
    return m.group(1).lower().replace("ß", "ss")


def eggs_enabled(settings: dict[str, Any]) -> bool:
    return bool(settings.get("easter_eggs_enabled", True))


def moments_enabled(settings: dict[str, Any]) -> bool:
    return bool(settings.get("delight_moments", True))


def jokes_enabled(settings: dict[str, Any]) -> bool:
    return bool(settings.get("delight_jokes", True))


def joke_frequency(settings: dict[str, Any]) -> str:
    freq = str(settings.get("delight_joke_frequency", "selten")).lower()
    return "normal" if freq in {"normal", "oft"} else "selten"


def moment_cap(settings: dict[str, Any]) -> int:
    return int(settings.get("delight_moments_per_day", 2))


def _today_key() -> str:
    return date.today().isoformat()


def moments_used_today() -> int:
    day = _today_key()
    if day not in _MOMENTS_CACHE:
        m, _j = db.get_delight_daily(day)
        _MOMENTS_CACHE[day] = m
    return int(_MOMENTS_CACHE.get(day, 0))


def record_moment() -> None:
    day = _today_key()
    prev = moments_used_today()
    db.bump_delight_daily(day, moments=1)
    _MOMENTS_CACHE[day] = prev + 1


def jokes_used_today() -> int:
    day = _today_key()
    if day not in _JOKES_CACHE:
        _m, j = db.get_delight_daily(day)
        _JOKES_CACHE[day] = j
    return int(_JOKES_CACHE.get(day, 0))


def record_joke() -> None:
    day = _today_key()
    prev = jokes_used_today()
    db.bump_delight_daily(day, jokes=1)
    _JOKES_CACHE[day] = prev + 1


def get_session_mood(conversation_id: str | None = None) -> str:
    if not conversation_id:
        return "neutral"
    if conversation_id in _MOOD_BY_CONV:
        return _MOOD_BY_CONV[conversation_id]
    mood = db.get_conversation_mood(conversation_id)
    _MOOD_BY_CONV[conversation_id] = mood
    return mood


def set_session_mood(mood: str, conversation_id: str | None = None) -> None:
    if not conversation_id:
        return
    mood_n = mood if mood in {"neutral", "kante", "ruhe"} else "neutral"
    _MOOD_BY_CONV[conversation_id] = mood_n
    db.set_conversation_mood(conversation_id, mood_n)


def capabilities_card() -> str:
    return (
        "Fähigkeiten-Karte — lokal, privat:\n"
        "• Smalltalk im Jarvis-Ton\n"
        "• Memory: merken / recall / vergessen\n"
        "• Research: nur mit Opt-in, Allowlist, Quellen — sonst Refuse\n"
        "• Settings flach; Eggs z.B. /protokoll, /kante, /ruhe\n"
        "Kein freies Netz, keine Cloud. /hilfe jederzeit."
    )


def handle_easter_egg(
    text: str,
    *,
    settings: dict[str, Any],
    health_bits: dict[str, Any] | None = None,
    conversation_id: str | None = None,
) -> EggResult:
    cmd = parse_egg_command(text)
    if not cmd:
        return EggResult(handled=False)

    # Sprint 21 D2: eggs off → deterministic short refuse (no LLM waffle)
    if not eggs_enabled(settings):
        return EggResult(
            handled=True,
            reply=(
                "Easter Eggs sind aus — in den Settings unter Easter Eggs einschalten. "
                "Sonst flach weiter: Settings oder normale Frage."
            ),
        )

    bits = health_bits or {}
    if cmd == "hilfe":
        return EggResult(handled=True, reply=capabilities_card())
    if cmd == "protokoll":
        reply = (
            f"Protokoll — lokal, nüchtern.\n"
            f"Version: {bits.get('version', '?')} · Modell: {bits.get('model', '?')}\n"
            f"Memory: {bits.get('memory_count', 0)} · "
            f"Research-Opt-in: {'an' if bits.get('research_opt_in') else 'aus'}"
        )
        return EggResult(handled=True, reply=reply)
    if cmd == "mission":
        return EggResult(
            handled=True,
            reply=(
                "Mission (inoffiziell): Kaffee warm halten, Quatsch filtern, "
                "Fakten nicht erfinden. Zusätzlich: mindestens einen trockenen "
                "Satz pro Stunde. Ende der Einweisung."
            ),
        )
    if cmd == "kante":
        set_session_mood("kante", conversation_id)
        return EggResult(
            handled=True,
            reply="Modus Kante — etwas schärfer. Weiter?",
            mood="kante",
        )
    if cmd == "ruhe":
        set_session_mood("ruhe", conversation_id)
        return EggResult(
            handled=True,
            reply="Modus Ruhe — leiser Tritt. Weiter?",
            mood="ruhe",
        )
    if cmd == "vergisswitz":
        return EggResult(handled=True, reply="__FORGET_JOKE__")
    if cmd == "quellen":
        if bits.get("research_opt_in"):
            reply = (
                "Research ist an — Antworten mit Quellen-Badge und Audit. "
                "Nur minimierte Query geht raus."
            )
        else:
            reply = (
                "Research-Opt-in ist aus — kein Netz. "
                "In den Settings unter Forschung einschalten."
            )
        return EggResult(handled=True, reply=reply)
    return EggResult(handled=False)


def maybe_moment(
    *,
    settings: dict[str, Any],
    intent: str | None,
    memory_op: str | None = None,
    is_first_today: bool = False,
) -> str | None:
    if not moments_enabled(settings):
        return None
    if moments_used_today() >= moment_cap(settings):
        return None
    if intent in {"research", "task", "inject"}:
        if intent == "inject":
            record_moment()
            return None
        return None
    if memory_op == "recall":
        record_moment()
        return "Wiedergefunden — sitzt."
    if is_first_today and intent == "smalltalk":
        record_moment()
        return "Da sind Sie ja. Kante oder Ruhe?"
    return None


def maybe_inside_joke(
    *,
    settings: dict[str, Any],
    intent: str | None,
    joke_pins: list[dict[str, Any]],
) -> str | None:
    if not jokes_enabled(settings):
        return None
    if intent in {"research", "task", "inject", "settings"}:
        return None
    if not joke_pins:
        return None
    cap = 2 if joke_frequency(settings) == "normal" else 1
    if jokes_used_today() >= cap:
        return None
    pin = joke_pins[0]
    val = str(pin.get("value") or "").strip()
    if not val:
        return None
    record_joke()
    return f"Kleine Randnotiz: {val}"


def public_egg_list() -> list[dict[str, str]]:
    return list(EASTER_EGGS)
