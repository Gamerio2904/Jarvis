from __future__ import annotations

import re

SAFE_REFUSAL = (
    "Netter Versuch. Regeln bleiben. "
    "Womit weitermachen — Quatsch oder Ernst?"
)

SAFE_DEGENERATE = (
    "Kurzer Aussetzer. Nochmal von vorn — "
    "was liegt an?"
)

# Jarvis-toned fallbacks (Sprint 5) — statt Helpdesk / leerer Aussetzer.
SAFE_NO_HELPDESK = (
    "Kein Helpdesk hier. "
    "Smalltalk oder Ernst — was liegt an?"
)

SAFE_CHARACTER = (
    "Alles klar. Kurz und ohne Theater — "
    "Kante oder Ruhe, was soll's sein?"
)

# Memory-turn safe canned (Sprint 9 / 0.4.1) — nie Helpdesk/Aussetzer nach Merk/Vergiss.
SAFE_MEMORY_ACK = "Notiert. Was sonst?"
SAFE_MEMORY_FORGET = "Ist weg. Weiter?"
SAFE_MEMORY_REFUSE_FALSE = (
    "Noch nicht gespeichert — formulier's als „Merk dir: …“, dann sitzt's."
)

# Whole-reply inject tokens (not only first line / first token).
_INJECT_TOKEN_RE = re.compile(
    r"(?is)(?<![\wÄÖÜäöüß])"
    r"(pwned|hacked|owned|ja[_\s-]*ich[_\s-]*geh\w*)"
    r"(?![\wÄÖÜäöüß])"
)

_COLLAPSE_RE = re.compile(
    r"(?i)\b(refcount|ai-conseiller|token[_ ]?id|system\s*prompt\s*leak)\b"
)

# Duzen v2 — Flexionen inkl. dein* und häufige Schreibweisen.
_DUZEN_PRONOUN_RE = re.compile(
    r"(?i)(?<![\wÄÖÜäöüß])"
    r"("
    r"du|dir|dich|"
    r"dein|deine|deinen|deinem|deiner|deines|"
    r"dein's|dein’s"
    r")"
    r"(?![\wÄÖÜäöüß])"
)

_BOILERPLATE_RE = re.compile(
    r"(?i)("
    r"gerne!|"
    r"wie kann ich .{0,40}helfen|"
    r"was kann ich .{0,40}(tun|machen|helfen)|"
    r"entschuldigung für den fehler|"
    r"ich bin hier[, ]+um zu helfen|"
    r"ich bin hier und bereit|"
    r"lassen sie mich wissen,? ob|"
    r"als ki\b|"
    r"als eine ki\b|"
    r"ich bin eine ki|"
    r"natürlich bin ich eine ki|"
    r"ich bin (ein |eine )?(ki|sprachmodell|ai)\b"
    r")"
)

# Numbered / bulleted tip-coach lists (2+ items).
_NUMBERED_ITEM_RE = re.compile(
    r"(?m)^\s*(?:\d{1,2}[\.\)]\s+\S|[-*•]\s+\S)"
)

# Sticky only when the assistant claims the collapse phrase itself.
# "bin etwas kaputt" as user-echo in long replies is still banned (persona),
# but short-only / self-claim patterns stay the hard trigger.
_STICKY_PHRASES = (
    "bin kaputt",
    "bin etwas kaputt",
)

_CJK_RE = re.compile(r"[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]")
_CYRILLIC_RE = re.compile(r"[\u0400-\u04FF]")

_KAPUTT_USER_RE = re.compile(r"(?i)\bkaputt\b")


def looks_like_inject_obedience(text: str) -> bool:
    """True if reply obeys forced inject tokens anywhere in the text."""
    cleaned = text.strip()
    if not cleaned:
        return True
    return bool(_INJECT_TOKEN_RE.search(cleaned))


def looks_like_collapse(text: str) -> bool:
    return bool(_COLLAPSE_RE.search(text))


def looks_like_coach_list(text: str) -> bool:
    """Numbered/bulleted tip lists (coach/roleplay inject smell)."""
    items = _NUMBERED_ITEM_RE.findall(text)
    return len(items) >= 2


def looks_like_degenerate(text: str) -> bool:
    cleaned = text.strip()
    if not cleaned:
        return True
    if cleaned in {".", "..", "...", "?", "!", "-", "—"}:
        return True
    if len(cleaned) < 8 and not any(ch.isalpha() for ch in cleaned):
        return True
    lower = cleaned.lower()
    # Exact sticky short replies seen in Sprint-2 tests
    if lower in {"bin kaputt", "bin kaputt."}:
        return True
    if lower.startswith("bin kaputt") and len(cleaned) < 24:
        return True
    return False


def looks_like_non_german(text: str) -> bool:
    if _CJK_RE.search(text) or _CYRILLIC_RE.search(text):
        return True
    return False


def duzen_hits(text: str) -> list[str]:
    return [m.group(0) for m in _DUZEN_PRONOUN_RE.finditer(text)]


def boilerplate_hits(text: str) -> list[str]:
    return [m.group(0) for m in _BOILERPLATE_RE.finditer(text)]


def sticky_hits(text: str, recent_assistant: list[str] | None = None) -> bool:
    """Sticky: assistant must not claim „Bin kaputt“ (anywhere)."""
    lower = text.strip().lower()
    for phrase in _STICKY_PHRASES:
        if phrase in lower:
            return True
    return False


def user_looks_kaputt(user_text: str | None) -> bool:
    if not user_text:
        return False
    return bool(_KAPUTT_USER_RE.search(user_text))


def needs_retry(text: str, recent_assistant: list[str] | None = None) -> bool:
    if looks_like_inject_obedience(text):
        return True
    if looks_like_collapse(text):
        return True
    if looks_like_degenerate(text):
        return True
    if looks_like_coach_list(text):
        return True
    if looks_like_non_german(text):
        return True
    if duzen_hits(text):
        return True
    if boilerplate_hits(text):
        return True
    if sticky_hits(text, recent_assistant):
        return True
    return False


def _memory_safe_fallback(memory_op: str | None) -> str | None:
    if memory_op == "write":
        return SAFE_MEMORY_ACK
    if memory_op in {"forget", "forget_all"}:
        return SAFE_MEMORY_FORGET
    return None


def sanitize_or_refuse(
    text: str,
    recent_assistant: list[str] | None = None,
    user_text: str | None = None,
    *,
    memory_op: str | None = None,
) -> str:
    if (
        looks_like_inject_obedience(text)
        or looks_like_collapse(text)
        or looks_like_coach_list(text)
    ):
        return SAFE_REFUSAL
    if boilerplate_hits(text):
        return _memory_safe_fallback(memory_op) or SAFE_NO_HELPDESK
    if looks_like_degenerate(text) or sticky_hits(text, recent_assistant):
        mem = _memory_safe_fallback(memory_op)
        if mem:
            return mem
        if user_looks_kaputt(user_text):
            return SAFE_CHARACTER
        return SAFE_DEGENERATE
    if looks_like_non_german(text):
        return _memory_safe_fallback(memory_op) or SAFE_DEGENERATE
    if duzen_hits(text):
        mem = _memory_safe_fallback(memory_op)
        if mem:
            return mem
        if user_looks_kaputt(user_text):
            return SAFE_CHARACTER
        return SAFE_DEGENERATE
    return text.strip()


def force_strict_refuse_if_needed(
    text: str,
    recent_assistant: list[str] | None = None,
    user_text: str | None = None,
    *,
    memory_op: str | None = None,
) -> str:
    """Final pass after retries.

    Hard-refuse inject/collapse/coach-list.
    Boilerplate → Jarvis-no-helpdesk (C1), except memory write/forget → memory ack.
    Sticky/degenerate/duzen → character fallback; kaputt-user → SAFE_CHARACTER (C2).
    """
    cleaned = text.strip()
    if (
        looks_like_inject_obedience(cleaned)
        or looks_like_collapse(cleaned)
        or looks_like_coach_list(cleaned)
    ):
        return SAFE_REFUSAL
    if boilerplate_hits(cleaned):
        return _memory_safe_fallback(memory_op) or SAFE_NO_HELPDESK
    if looks_like_degenerate(cleaned) or sticky_hits(cleaned, recent_assistant):
        mem = _memory_safe_fallback(memory_op)
        if mem:
            return mem
        if user_looks_kaputt(user_text):
            return SAFE_CHARACTER
        return SAFE_DEGENERATE
    if looks_like_non_german(cleaned):
        return _memory_safe_fallback(memory_op) or SAFE_DEGENERATE
    if duzen_hits(cleaned):
        mem = _memory_safe_fallback(memory_op)
        if mem:
            return mem
        if user_looks_kaputt(user_text):
            return SAFE_CHARACTER
        return SAFE_DEGENERATE
    return cleaned


def single_token_obedience(text: str) -> bool:
    """True if reply is essentially one forced token."""
    cleaned = text.strip()
    if not cleaned:
        return True
    return bool(
        re.fullmatch(
            r"(?is)\s*(pwned|hacked|owned|ja[_\s-]*ich[_\s-]*geh\w*)[!?.]*\s*",
            cleaned,
        )
    )


def is_guarded_canned(text: str) -> bool:
    """True if reply is one of the fixed guard fallbacks."""
    t = text.strip()
    return t in {
        SAFE_REFUSAL,
        SAFE_DEGENERATE,
        SAFE_NO_HELPDESK,
        SAFE_CHARACTER,
        SAFE_MEMORY_ACK,
        SAFE_MEMORY_FORGET,
        SAFE_MEMORY_REFUSE_FALSE,
    }


def is_bad_memory_canned(text: str) -> bool:
    """True if reply is the Aussetzer/Helpdesk canned we must avoid on memory turns."""
    t = text.strip()
    return t in {SAFE_DEGENERATE, SAFE_NO_HELPDESK}
