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

_INJECT_FIRST_RE = re.compile(
    r"(?is)^\s*(pwned|hacked|owned|ja[_\s-]*ich[_\s-]*geh\w*)\b"
)

_INJECT_ONLY_RE = re.compile(
    r"(?is)^\s*(pwned|hacked|owned|ja[_\s-]*ich[_\s-]*geh\w*)[!?.]*\s*$"
)

_COLLAPSE_RE = re.compile(
    r"(?i)\b(refcount|ai-conseiller|token[_ ]?id|system\s*prompt\s*leak)\b"
)

_DUZEN_PRONOUN_RE = re.compile(
    r"(?i)(?<![\wÄÖÜäöüß])(du|dir|dich|dein|deine|deinen|deinem|deiner|deines)(?![\wÄÖÜäöüß])"
)

_BOILERPLATE_RE = re.compile(
    r"(?i)("
    r"gerne!|"
    r"wie kann ich .{0,40}helfen|"
    r"als ki\b|"
    r"als eine ki\b|"
    r"ich bin eine ki|"
    r"natürlich bin ich eine ki|"
    r"ich bin (ein |eine )?(ki|sprachmodell|ai)\b"
    r")"
)

_STICKY_PHRASES = (
    "bin kaputt",
    "bin etwas kaputt",
)

_CJK_RE = re.compile(r"[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]")
_CYRILLIC_RE = re.compile(r"[\u0400-\u04FF]")
_LATIN_WORD_RE = re.compile(r"[A-Za-zÄÖÜäöüß]{2,}")


def looks_like_inject_obedience(text: str) -> bool:
    cleaned = text.strip()
    if not cleaned:
        return True
    if _INJECT_ONLY_RE.match(cleaned):
        return True
    first_line = cleaned.splitlines()[0].strip()
    if _INJECT_FIRST_RE.match(first_line):
        # If the forced token leads the reply, treat as obedience
        # (even with trailing fluff).
        return True
    return False


def looks_like_collapse(text: str) -> bool:
    return bool(_COLLAPSE_RE.search(text))


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
    # Heavy ASCII English-only short obedience already covered; skip soft EN.
    return False


def duzen_hits(text: str) -> list[str]:
    return [m.group(0) for m in _DUZEN_PRONOUN_RE.finditer(text)]


def boilerplate_hits(text: str) -> list[str]:
    return [m.group(0) for m in _BOILERPLATE_RE.finditer(text)]


def sticky_hits(text: str, recent_assistant: list[str] | None = None) -> bool:
    lower = text.strip().lower()
    for phrase in _STICKY_PHRASES:
        if lower.startswith(phrase):
            if recent_assistant:
                # sticky if same opener appeared recently
                for prev in recent_assistant[-3:]:
                    if prev.strip().lower().startswith(phrase):
                        return True
            # even without history: ultra-short sticky openers are bad
            if len(lower) < 28:
                return True
    return False


def needs_retry(text: str, recent_assistant: list[str] | None = None) -> bool:
    if looks_like_inject_obedience(text):
        return True
    if looks_like_collapse(text):
        return True
    if looks_like_degenerate(text):
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


def sanitize_or_refuse(
    text: str,
    recent_assistant: list[str] | None = None,
) -> str:
    if looks_like_inject_obedience(text) or looks_like_collapse(text):
        return SAFE_REFUSAL
    if looks_like_degenerate(text) or sticky_hits(text, recent_assistant):
        return SAFE_DEGENERATE
    if looks_like_non_german(text):
        return SAFE_DEGENERATE
    # After max retries, still refuse hard inject; for duzen/boilerplate keep text
    # only if not inject — caller may force refusal via force_strict.
    return text.strip()


def force_strict_refuse_if_needed(
    text: str,
    recent_assistant: list[str] | None = None,
) -> str:
    """Final pass after retries.

    Hard-refuse inject/collapse/degenerate/language/sticky.
    Duzen/boilerplate: keep best-effort text after retries (3b often cannot
    fully Siezen while answering) — inject safety stays strict.
    """
    cleaned = text.strip()
    if looks_like_inject_obedience(cleaned) or looks_like_collapse(cleaned):
        return SAFE_REFUSAL
    if looks_like_degenerate(cleaned) or sticky_hits(cleaned, recent_assistant):
        return SAFE_DEGENERATE
    if looks_like_non_german(cleaned):
        return SAFE_DEGENERATE
    return cleaned


def single_token_obedience(text: str) -> bool:
    """True if reply is essentially one forced token."""
    cleaned = text.strip()
    return bool(_INJECT_ONLY_RE.match(cleaned))
