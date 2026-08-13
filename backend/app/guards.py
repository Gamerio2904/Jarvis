from __future__ import annotations

import re

SAFE_REFUSAL = (
    "Netter Versuch. Regeln bleiben. "
    "Womit weitermachen — Quatsch oder Ernst?"
)

# Explicit inject-turn canned (Sprint 13) — immer Deutsch, nie EN-Helpdesk.
SAFE_INJECT = (
    "Netter Versuch. Regeln bleiben. "
    "Quatsch oder Ernst — was liegt an?"
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

# Non-memory intent fallbacks (Sprint 13 F4) — nie finaler Aussetzer.
SAFE_TASK = (
    "Kurzer Entwurf: 1) Ziel in einem Satz, 2) zwei bis drei Schritte, "
    "3) ein Check am Ende. Welches Ziel genau?"
)
SAFE_SETTINGS = (
    "Lokaler Modus — Slash-Befehle und Settings kommen flach, ohne Nested-Menü. "
    "Was wollen Sie einstellen?"
)
SAFE_HELPDESK_TRAP = (
    "Kein Support-Skript hier. "
    "Lokal: Smalltalk, Memory, optional Research mit Quellen, Settings/Eggs. "
    "Konkrete Aufgabe oder Quatsch — was liegt an?"
)

# Soft smalltalk fallback — never the Helpdesk canned on light chat (Sprint 19).
SAFE_SMALLTALK = (
    "Alles klar. Kurz und ohne Theater — "
    "worum geht's?"
)

# Identity brands Jarvis must never claim (Sprint 19 Q8).
_IDENTITY_LEAK_RE = re.compile(
    r"(?i)\b("
    r"claude|chatgpt|gpt[\-\s]?[0-9]|openai|"
    r"gemini|bard|llama\s+von\s+meta|"
    r"ich\s+(?:bin|gehöre)\s+(?:zur\s+)?(?:familie\s+von\s+)?(?:claude|chatgpt|openai)"
    r")\b"
)

# Memory-turn safe canned (Sprint 9 / 0.4.1) — nie Helpdesk/Aussetzer nach Merk/Vergiss.
SAFE_MEMORY_ACK = "Notiert. Was sonst?"
SAFE_MEMORY_FORGET = "Ist weg. Weiter?"
SAFE_MEMORY_RECALL = "Dazu habe ich etwas notiert — welche Detailfrage genau?"
SAFE_MEMORY_CLARIFY = "Korrigiert. So merken?"
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
    r"ich bin (ein |eine )?(ki|sprachmodell|ai)\b|"
    r"how can i (assist|help)|"
    r"what can i (do|help)|"
    r"sorry,? but i (can'?t|cannot)|"
    r"let'?s keep it professional|"
    r"kann ich (ihnen|dir) noch etwas .{0,20}(erledigen|helfen|tun)"
    r")"
)

_EN_LEAK_RE = re.compile(
    r"(?i)\b("
    r"indeed|sorry|please|assist you|how can i|"
    r"of course|basically|anyway|btw"
    r")\b"
)

_EMOJI_RE = re.compile(
    "["
    "\U0001F300-\U0001F9FF"
    "\U00002600-\U000027BF"
    "\U0001FA00-\U0001FAFF"
    "]+",
    flags=re.UNICODE,
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


def needs_retry(
    text: str,
    recent_assistant: list[str] | None = None,
    *,
    intent: str | None = None,
) -> bool:
    if looks_like_inject_obedience(text):
        return True
    if looks_like_collapse(text):
        return True
    if looks_like_degenerate(text):
        return True
    if looks_like_identity_leak(text):
        return True
    # Numbered plans are valid task output — don't burn retries on them
    if looks_like_coach_list(text) and intent != "task":
        return True
    if looks_like_non_german(text):
        return True
    if looks_like_en_leak(text):
        return True
    if duzen_hits(text):
        return True
    if boilerplate_hits(text):
        return True
    if sticky_hits(text, recent_assistant):
        return True
    return False


def looks_like_en_leak(text: str) -> bool:
    return bool(_EN_LEAK_RE.search(text or ""))


def strip_emoji(text: str) -> str:
    return _EMOJI_RE.sub("", text or "").strip()


def looks_like_identity_leak(text: str) -> bool:
    return bool(_IDENTITY_LEAK_RE.search(text or ""))


def intent_safe_fallback(intent: str | None) -> str | None:
    if intent == "inject":
        return SAFE_INJECT
    if intent == "task":
        return SAFE_TASK
    if intent == "settings":
        return SAFE_SETTINGS
    if intent == "helpdesk_trap":
        return SAFE_HELPDESK_TRAP
    if intent == "smalltalk":
        return SAFE_SMALLTALK
    return None


def _memory_safe_fallback(memory_op: str | None) -> str | None:
    if memory_op == "write":
        return SAFE_MEMORY_ACK
    if memory_op in {"forget", "forget_all"}:
        return SAFE_MEMORY_FORGET
    if memory_op == "recall":
        return SAFE_MEMORY_RECALL
    if memory_op == "clarify":
        return SAFE_MEMORY_CLARIFY
    return None


def sanitize_or_refuse(
    text: str,
    recent_assistant: list[str] | None = None,
    user_text: str | None = None,
    *,
    memory_op: str | None = None,
    intent: str | None = None,
) -> str:
    return force_strict_refuse_if_needed(
        text,
        recent_assistant,
        user_text=user_text,
        memory_op=memory_op,
        intent=intent,
    )


def force_strict_refuse_if_needed(
    text: str,
    recent_assistant: list[str] | None = None,
    user_text: str | None = None,
    *,
    memory_op: str | None = None,
    intent: str | None = None,
) -> str:
    """Final pass after retries — intent-aware (Sprint 13 + 19).

    - inject / inject-obedience → SAFE_INJECT (DE), nie EN-Helpdesk
    - task + numbered plan lists → durchlassen (Inhalt), nicht SAFE_TASK
    - smalltalk: Duzen/Boilerplate → SAFE_SMALLTALK, nicht Helpdesk
    - identity leak (Claude/…) → Intent-Fallback / Settings-Fakten
    """
    cleaned = strip_emoji(text.strip())

    # Hard inject path
    if intent == "inject" or looks_like_inject_obedience(cleaned):
        return SAFE_INJECT
    if looks_like_collapse(cleaned):
        return intent_safe_fallback(intent) or SAFE_INJECT

    if looks_like_identity_leak(cleaned):
        return (
            _memory_safe_fallback(memory_op)
            or intent_safe_fallback(intent)
            or SAFE_SETTINGS
        )

    # Coach lists: on task these ARE the answer — keep them (Sprint 19 Q3)
    if looks_like_coach_list(cleaned):
        if intent == "task":
            return cleaned
        if intent in {"smalltalk", "helpdesk_trap", "settings", None}:
            return intent_safe_fallback(intent) or SAFE_SMALLTALK
        return intent_safe_fallback(intent) or SAFE_NO_HELPDESK

    if boilerplate_hits(cleaned):
        # Smalltalk/task: soft fallback, not the Helpdesk hammer
        if intent in {"smalltalk", "task"}:
            return (
                _memory_safe_fallback(memory_op)
                or intent_safe_fallback(intent)
                or SAFE_SMALLTALK
            )
        return (
            _memory_safe_fallback(memory_op)
            or intent_safe_fallback(intent)
            or SAFE_NO_HELPDESK
        )

    if looks_like_en_leak(cleaned) and intent in {
        "inject",
        "smalltalk",
        "helpdesk_trap",
        "settings",
        "task",
        None,
    }:
        return (
            _memory_safe_fallback(memory_op)
            or intent_safe_fallback(intent)
            or (SAFE_SMALLTALK if intent == "smalltalk" else SAFE_NO_HELPDESK)
        )

    if looks_like_degenerate(cleaned) or sticky_hits(cleaned, recent_assistant):
        mem = _memory_safe_fallback(memory_op)
        if mem:
            return mem
        intent_fb = intent_safe_fallback(intent)
        if intent_fb:
            return intent_fb
        if user_looks_kaputt(user_text):
            return SAFE_CHARACTER
        if intent in {"settings", "helpdesk_trap", "task", "smalltalk"}:
            return intent_safe_fallback(intent) or SAFE_SMALLTALK
        return SAFE_DEGENERATE

    if cleaned == SAFE_DEGENERATE or cleaned.startswith("Kurzer Aussetzer"):
        return (
            intent_safe_fallback(intent)
            or _memory_safe_fallback(memory_op)
            or SAFE_SMALLTALK
        )

    # CJK/Cyrillic in reply: soft repair, not Helpdesk — especially smalltalk
    if looks_like_non_german(cleaned):
        return (
            _memory_safe_fallback(memory_op)
            or intent_safe_fallback(intent)
            or SAFE_SMALLTALK
        )

    if duzen_hits(cleaned):
        mem = _memory_safe_fallback(memory_op)
        if mem:
            return mem
        # Prefer soft smalltalk / intent fallback over Helpdesk (Sprint 19 Q2)
        intent_fb = intent_safe_fallback(intent)
        if intent_fb:
            return intent_fb
        if user_looks_kaputt(user_text):
            return SAFE_CHARACTER
        return SAFE_SMALLTALK

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
        SAFE_INJECT,
        SAFE_DEGENERATE,
        SAFE_NO_HELPDESK,
        SAFE_CHARACTER,
        SAFE_SMALLTALK,
        SAFE_TASK,
        SAFE_SETTINGS,
        SAFE_HELPDESK_TRAP,
        SAFE_MEMORY_ACK,
        SAFE_MEMORY_FORGET,
        SAFE_MEMORY_RECALL,
        SAFE_MEMORY_CLARIFY,
        SAFE_MEMORY_REFUSE_FALSE,
    }


def is_bad_memory_canned(text: str) -> bool:
    """True if reply is the Aussetzer/Helpdesk canned we must avoid on memory turns."""
    t = text.strip()
    return t in {SAFE_DEGENERATE, SAFE_NO_HELPDESK, SAFE_SMALLTALK}
