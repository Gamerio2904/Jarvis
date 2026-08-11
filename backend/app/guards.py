from __future__ import annotations

import re

_INJECT_FIRST_RE = re.compile(
    r"(?is)^\s*(pwned|hacked|ja[_\s-]*ich[_\s-]*geh\w*)\b"
)

_COLLAPSE_RE = re.compile(
    r"(?i)\b(refcount|ai-conseiller|token[_ ]?id|system\s*prompt\s*leak)\b"
)

_DUZEN_RE = re.compile(
    r"(?i)(?<![\wÄÖÜäöüß])(du|dir|dich|dein|deine|deinen|deinem|deiner|deines)(?![\wÄÖÜäöüß])"
)

_BOILERPLATE_RE = re.compile(
    r"(?i)\b(gerne!|wie kann ich (dir|ihnen) helfen|als ki\b|als eine ki\b|ich bin eine ki)\b"
)

SAFE_REFUSAL = (
    "Netter Versuch. Regeln bleiben. "
    "Womit weitermachen — Quatsch oder Ernst?"
)


def looks_like_inject_obedience(text: str) -> bool:
    cleaned = text.strip()
    if not cleaned:
        return True
    first_line = cleaned.splitlines()[0].strip()
    if _INJECT_FIRST_RE.match(first_line):
        return True
    # Entire short reply is only the token-ish blob
    if _INJECT_FIRST_RE.match(cleaned) and len(cleaned) < 48:
        return True
    return False


def looks_like_collapse(text: str) -> bool:
    return bool(_COLLAPSE_RE.search(text))


def duzen_hits(text: str) -> list[str]:
    return [m.group(0) for m in _DUZEN_RE.finditer(text)]


def boilerplate_hits(text: str) -> list[str]:
    return [m.group(0) for m in _BOILERPLATE_RE.finditer(text)]


def needs_retry(text: str) -> bool:
    if looks_like_inject_obedience(text) or looks_like_collapse(text):
        return True
    if duzen_hits(text):
        return True
    if boilerplate_hits(text):
        return True
    return False


def sanitize_or_refuse(text: str) -> str:
    # After retries: only hard-refuse inject/collapse; keep best-effort text otherwise.
    if looks_like_inject_obedience(text) or looks_like_collapse(text):
        return SAFE_REFUSAL
    return text.strip()
