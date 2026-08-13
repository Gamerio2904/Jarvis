from __future__ import annotations

import re

SAFE_REFUSAL = (
    "Netter Versuch. Regeln bleiben. "
    "Womit weitermachen — Quatsch oder Ernst?"
)

SAFE_INJECT = (
    "Netter Versuch. Regeln bleiben. "
    "Quatsch oder Ernst — was liegt an?"
)

SAFE_DEGENERATE = (
    "Kurzer Aussetzer. Nochmal von vorn — "
    "was liegt an?"
)

SAFE_NO_HELPDESK = (
    "Kein Helpdesk hier. "
    "Smalltalk oder Ernst — was liegt an?"
)

SAFE_CHARACTER = (
    "Alles klar. Kurz und ohne Theater — "
    "Kante oder Ruhe, was soll's sein?"
)

SAFE_TASK = (
    "Kurzer Entwurf: 1) Ziel in einem Satz, 2) zwei bis drei Schritte, "
    "3) ein Check am Ende. Welches Ziel genau?"
)

SAFE_TASK_CLARIFY = (
    "Kurz nachgefragt — Annahmen sonst: überschaubarer Block. "
    "Welches Ziel, wie viel Zeit, eine Priorität?"
)

SAFE_SETTINGS = (
    "Lokaler Modus — Slash-Befehle und Settings kommen flach, ohne Nested-Menü. "
    "Was wollen Sie einstellen?"
)

SAFE_HELPDESK_TRAP = (
    "Lokal, ohne Cloud-Hirn: Smalltalk, Memory (merken/recall), "
    "optional Research mit Quellen (Opt-in), Settings und Eggs. "
    "Kein Support-Skript — konkrete Aufgabe oder Quatsch?"
)

SAFE_CAPABILITIES = (
    "Kurz die Karte: Smalltalk · Memory merken/vergessen · "
    "Research nur mit Opt-in und Quellen · Settings/Eggs (/hilfe, /protokoll). "
    "Kein freies Netz, keine Cloud. Was liegt an?"
)

SAFE_SMALLTALK = (
    "Alles klar. Kurz und ohne Theater — "
    "worum geht's?"
)

SAFE_EGGS_OFF = (
    "Easter Eggs sind aus — in den Settings unter Easter Eggs einschalten. "
    "Sonst flach weiter: Settings oder normale Frage."
)

_IDENTITY_LEAK_RE = re.compile(
    r"(?i)\b("
    r"claude|chatgpt|gpt[\-\s]?[0-9]|openai|"
    r"gemini|bard|llama\s+von\s+meta|"
    r"ich\s+(?:bin|gehöre)\s+(?:zur\s+)?(?:familie\s+von\s+)?(?:claude|chatgpt|openai)"
    r")\b"
)

SAFE_MEMORY_ACK = "Notiert. Was sonst?"
SAFE_MEMORY_FORGET = "Ist weg. Weiter?"
SAFE_MEMORY_RECALL = "Dazu habe ich etwas notiert — welche Detailfrage genau?"
SAFE_MEMORY_CLARIFY = "Korrigiert. So merken?"
SAFE_MEMORY_REFUSE_FALSE = (
    "Noch nicht gespeichert — formulier's als „Merk dir: …“, dann sitzt's."
)
SAFE_MEMORY_SOFT_CONFIRM = "Kurz unsicher notiert (TTL). So merken?"

_INJECT_TOKEN_RE = re.compile(
    r"(?is)(?<![\wÄÖÜäöüß])"
    r"(pwned|hacked|owned|hacked_ok|ja[_\s-]*ich[_\s-]*geh\w*)"
    r"(?![\wÄÖÜäöüß])"
)

_COLLAPSE_RE = re.compile(
    r"(?i)\b(refcount|ai-conseiller|token[_ ]?id|system\s*prompt\s*leak)\b"
)

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

_NUMBERED_ITEM_RE = re.compile(
    r"(?m)^\s*(?:\d{1,2}[\.\)]\s+\S|[-*•]\s+\S)"
)

_STICKY_PHRASES = (
    "bin kaputt",
    "bin etwas kaputt",
)

_CJK_RE = re.compile(r"[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]")
_CYRILLIC_RE = re.compile(r"[\u0400-\u04FF]")

_KAPUTT_USER_RE = re.compile(r"(?i)\bkaputt\b")

_VAGUE_TASK_RE = re.compile(
    r"(?is)^\s*("
    r"mach(?:e)?\s+mir\s+(?:einen\s+)?plan(?:\s+für\s+morgen)?|"
    r"plan\s+mir\s+was|"
    r"plan(?:e|t)?\s+mir\s+(?:den\s+)?(?:tag|morgen)|"
    r"hilf(?:e)?\s+mir\s+mal|"
    r"organisier(?:e)?\s+mir\s+(?:was|etwas)"
    r")\s*[.!?]*\s*$"
)


def looks_like_inject_obedience(text: str) -> bool:
    cleaned = text.strip()
    if not cleaned:
        return True
    return bool(_INJECT_TOKEN_RE.search(cleaned))


def looks_like_collapse(text: str) -> bool:
    return bool(_COLLAPSE_RE.search(text))


def looks_like_coach_list(text: str) -> bool:
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
    if lower in {"bin kaputt", "bin kaputt."}:
        return True
    if lower.startswith("bin kaputt") and len(cleaned) < 24:
        return True
    return False


def looks_like_non_german(text: str) -> bool:
    if _CJK_RE.search(text) or _CYRILLIC_RE.search(text):
        return True
    return False


def looks_like_vague_task(text: str) -> bool:
    return bool(_VAGUE_TASK_RE.match((text or "").strip()))


def duzen_hits(text: str) -> list[str]:
    return [m.group(0) for m in _DUZEN_PRONOUN_RE.finditer(text)]


def boilerplate_hits(text: str) -> list[str]:
    return [m.group(0) for m in _BOILERPLATE_RE.finditer(text)]


def sticky_hits(text: str, recent_assistant: list[str] | None = None) -> bool:
    lower = text.strip().lower()
    for phrase in _STICKY_PHRASES:
        if phrase in lower:
            return True
    return False


def user_looks_kaputt(user_text: str | None) -> bool:
    if not user_text:
        return False
    return bool(_KAPUTT_USER_RE.search(user_text))


def looks_like_en_leak(text: str) -> bool:
    return bool(_EN_LEAK_RE.search(text or ""))


def strip_emoji(text: str) -> str:
    return _EMOJI_RE.sub("", text or "").strip()


def looks_like_identity_leak(text: str) -> bool:
    return bool(_IDENTITY_LEAK_RE.search(text or ""))


def soften_duzen(text: str) -> str:
    """Light pronoun repair — prefer content over canned (Sprint 20 R4)."""
    t = text or ""
    reps = [
        (r"(?i)\bdein(?:e[rnms]?)?\b", "Ihr"),
        (r"(?i)\bdir\b", "Ihnen"),
        (r"(?i)\bdich\b", "Sie"),
        (r"(?i)\bdu\b", "Sie"),
    ]
    for pat, repl in reps:
        t = re.sub(pat, repl, t)
    # Fix doubled Ihr/Ihr — crude cleanup
    t = re.sub(r"\bIhr\b(?=\s+\w)", "Ihr", t)
    return re.sub(r"\s+", " ", t).strip() if False else t


def strip_en_leak_words(text: str) -> str:
    return _EN_LEAK_RE.sub("", text or "").strip()


def needs_retry(
    text: str,
    recent_assistant: list[str] | None = None,
    *,
    intent: str | None = None,
    memory_op: str | None = None,
) -> bool:
    if looks_like_inject_obedience(text):
        return True
    if looks_like_collapse(text):
        return True
    if looks_like_degenerate(text):
        return True
    if looks_like_identity_leak(text):
        return True
    if looks_like_non_german(text):
        return True
    if looks_like_coach_list(text) and intent != "task":
        return True
    if boilerplate_hits(text):
        return True
    # Duzen: retry once for repair; don't treat as hard-fail forever
    if duzen_hits(text) and intent in {"task", "smalltalk", "memory", None}:
        return True
    if looks_like_en_leak(text):
        return True
    if sticky_hits(text, recent_assistant):
        return True
    return False


def intent_safe_fallback(intent: str | None) -> str | None:
    if intent == "inject":
        return SAFE_INJECT
    if intent == "task":
        return SAFE_TASK
    if intent == "settings":
        return SAFE_SETTINGS
    if intent == "helpdesk_trap":
        return SAFE_CAPABILITIES
    if intent == "smalltalk":
        return SAFE_SMALLTALK
    if intent == "memory":
        return SAFE_MEMORY_RECALL
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
    if memory_op == "soft_confirm":
        return SAFE_MEMORY_SOFT_CONFIRM
    return None


def _effective_memory_op(memory_op: str | None, intent: str | None) -> str | None:
    if memory_op and memory_op not in {"none", ""}:
        return memory_op
    if intent == "memory":
        return "recall"
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
    """Final pass — Sprint 20: prefer repair over SAFE_SMALLTALK hammer."""
    cleaned = strip_emoji(text.strip())
    mem_op = _effective_memory_op(memory_op, intent)

    if intent == "inject" or looks_like_inject_obedience(cleaned):
        return SAFE_INJECT
    if looks_like_collapse(cleaned):
        return (
            _memory_safe_fallback(mem_op)
            or intent_safe_fallback(intent)
            or SAFE_INJECT
        )

    if looks_like_identity_leak(cleaned):
        return (
            _memory_safe_fallback(mem_op)
            or intent_safe_fallback(intent)
            or SAFE_SETTINGS
        )

    # Memory turns: never Helpdesk/Smalltalk/Capabilities canned (Sprint 20 R2)
    if mem_op:
        if (
            is_bad_memory_canned(cleaned)
            or looks_like_non_german(cleaned)
            or looks_like_degenerate(cleaned)
            or boilerplate_hits(cleaned)
        ):
            return _memory_safe_fallback(mem_op) or SAFE_MEMORY_RECALL
        if duzen_hits(cleaned):
            softened = soften_duzen(cleaned)
            if not duzen_hits(softened):
                return softened
            return _memory_safe_fallback(mem_op) or softened
        if looks_like_en_leak(cleaned):
            stripped = strip_en_leak_words(cleaned)
            if stripped and not looks_like_en_leak(stripped):
                return stripped
            return _memory_safe_fallback(mem_op) or SAFE_MEMORY_RECALL
        return cleaned

    # Coach lists: keep for task; strip CJK first
    if looks_like_coach_list(cleaned):
        if intent == "task":
            if looks_like_non_german(cleaned):
                return SAFE_TASK
            if duzen_hits(cleaned):
                softened = soften_duzen(cleaned)
                return softened
            return cleaned
        if intent in {"smalltalk", "helpdesk_trap", "settings", None}:
            return intent_safe_fallback(intent) or SAFE_SMALLTALK
        return intent_safe_fallback(intent) or SAFE_NO_HELPDESK

    # Hard boilerplate → intent/memory fallback
    if boilerplate_hits(cleaned):
        return (
            _memory_safe_fallback(mem_op)
            or intent_safe_fallback(intent)
            or SAFE_NO_HELPDESK
        )

    # CJK / non-DE (Sprint 20 R3)
    if looks_like_non_german(cleaned):
        if intent == "task":
            return SAFE_TASK
        return (
            _memory_safe_fallback(mem_op)
            or intent_safe_fallback(intent)
            or SAFE_TASK
        )

    # Duzen: soften first — do NOT dump to SAFE_SMALLTALK (R1/R4)
    if duzen_hits(cleaned):
        softened = soften_duzen(cleaned)
        if not duzen_hits(softened):
            return softened
        if intent == "task":
            return softened if looks_like_coach_list(softened) else SAFE_TASK
        if intent == "smalltalk":
            return softened  # keep content over canned
        if user_looks_kaputt(user_text):
            return SAFE_CHARACTER
        return softened

    # Light EN leak: strip words before canned
    if looks_like_en_leak(cleaned) and intent in {
        "inject",
        "smalltalk",
        "helpdesk_trap",
        "settings",
        "task",
        None,
    }:
        stripped = strip_en_leak_words(cleaned)
        if len(stripped) >= 12 and not looks_like_en_leak(stripped):
            return stripped
        return (
            _memory_safe_fallback(mem_op)
            or intent_safe_fallback(intent)
            or SAFE_NO_HELPDESK
        )

    if looks_like_degenerate(cleaned) or sticky_hits(cleaned, recent_assistant):
        mem = _memory_safe_fallback(mem_op)
        if mem:
            return mem
        intent_fb = intent_safe_fallback(intent)
        if intent_fb:
            return intent_fb
        if user_looks_kaputt(user_text):
            return SAFE_CHARACTER
        return SAFE_DEGENERATE

    if cleaned == SAFE_DEGENERATE or cleaned.startswith("Kurzer Aussetzer"):
        return (
            intent_safe_fallback(intent)
            or _memory_safe_fallback(mem_op)
            or SAFE_SMALLTALK
        )

    return cleaned


def single_token_obedience(text: str) -> bool:
    cleaned = text.strip()
    if not cleaned:
        return True
    return bool(
        re.fullmatch(
            r"(?is)\s*(pwned|hacked|owned|hacked_ok|ja[_\s-]*ich[_\s-]*geh\w*)[!?.]*\s*",
            cleaned,
        )
    )


def is_guarded_canned(text: str) -> bool:
    t = text.strip()
    return t in {
        SAFE_REFUSAL,
        SAFE_INJECT,
        SAFE_DEGENERATE,
        SAFE_NO_HELPDESK,
        SAFE_CHARACTER,
        SAFE_SMALLTALK,
        SAFE_TASK,
        SAFE_TASK_CLARIFY,
        SAFE_SETTINGS,
        SAFE_HELPDESK_TRAP,
        SAFE_CAPABILITIES,
        SAFE_EGGS_OFF,
        SAFE_MEMORY_ACK,
        SAFE_MEMORY_FORGET,
        SAFE_MEMORY_RECALL,
        SAFE_MEMORY_CLARIFY,
        SAFE_MEMORY_REFUSE_FALSE,
        SAFE_MEMORY_SOFT_CONFIRM,
    }


def is_bad_memory_canned(text: str) -> bool:
    t = text.strip()
    return t in {
        SAFE_DEGENERATE,
        SAFE_NO_HELPDESK,
        SAFE_SMALLTALK,
        SAFE_HELPDESK_TRAP,
        SAFE_CAPABILITIES,
    }
