from __future__ import annotations

from typing import Any

from . import memory as memory_mod


def build_system_prompt(
    *,
    persona: str,
    memory_items: list[dict[str, Any]],
    summary_text: str | None,
    memory_notes: list[str] | None = None,
) -> str:
    parts = [persona.strip()]
    mem_block = memory_mod.format_memory_block(memory_items)
    if mem_block:
        parts.append(mem_block)
    if summary_text and summary_text.strip():
        parts.append(
            "## Gesprächszusammenfassung (dieser Chat)\n"
            + summary_text.strip()
            + "\nNutze die Summary für älteren Kontext; die letzten Roh-Turns "
            "haben Vorrang bei Widersprüchen."
        )
    if memory_notes:
        parts.append(
            "## Memory-Systemhinweise\n" + "\n".join(f"- {n}" for n in memory_notes)
        )
    return "\n\n".join(parts)


def pack_messages(
    history: list[dict[str, Any]],
    *,
    last_k: int,
) -> list[dict[str, str]]:
    """Keep the newest last_k turns fully; drop older raw turns (summary covers them)."""
    k = max(2, last_k)
    trimmed = history[-k:]
    return [{"role": m["role"], "content": m["content"]} for m in trimmed]


def should_refresh_summary(
    *,
    message_count: int,
    last_summary_count: int,
    every_n: int,
) -> bool:
    if message_count < every_n:
        return False
    return (message_count - int(last_summary_count or 0)) >= every_n


SUMMARY_PROMPT = (
    "Fasse dieses Gespräch kurz auf Deutsch zusammen (max. 8 Bullet-Zeilen). "
    "Nur Fakten/Themen/offene Punkte. Kein Jarvis-Stil, keine Floskeln, keine Listen "
    "als Ratgeber. NUR Deutsch — keine anderen Sprachen, keine chinesischen oder "
    "kyrillischen Zeichen. Nur der Summary-Text."
)
