"""Opt-in internet research with allowlist providers + citations (Sprint 15 / 0.6.0)."""
from __future__ import annotations

import json
import re
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlparse

# Test hook: increments only when a real network request is attempted.
_NETWORK_CALLS = 0

SAFE_RESEARCH_OFF = (
    "Research-Opt-in ist aus — kein Netz. "
    "Nur lokales Wissen geht. Opt-in in den Settings aktivieren."
)
SAFE_RESEARCH_NO_SOURCE = (
    "Keine verlässliche Quelle gefunden — ich rate nicht. "
    "Formuliere die Frage enger oder prüfe später erneut."
)
SAFE_RESEARCH_NET_DOWN = (
    "Netz/Provider nicht erreichbar — kein Beleg, also kein Raten. "
    "Später nochmal versuchen."
)
SAFE_RESEARCH_JUNK = (
    "Kein brauchbares Suchthema — ich rate nicht und rufe kein Netz. "
    "Formuliere z.B. „Recherchiere …“ mit klarem Thema."
)
PRIVACY_NOTE = (
    "Privacy: Nur die minimierte Such-Query geht an Allowlist-Provider — "
    "kein Chat-Verlauf."
)

DEFAULT_ALLOWLIST = [
    "wikipedia.org",
    "de.wikipedia.org",
    "en.wikipedia.org",
    "duckduckgo.com",
    "api.duckduckgo.com",
]
DEFAULT_PROVIDERS = ["wikipedia", "duckduckgo"]

_RESEARCH_PREFIX_RE = re.compile(
    r"(?is)^\s*("
    r"recherchier\w*\s+(bitte\s+|mal\s+)*(den\s+)?(aktuellen\s+)?(stand\s+zu\s+)?"
    r"|suche\s+im\s+internet\s+(nach\s+)?"
    r"|google\s+(mal|bitte)\s+"
    r"|was\s+ist\s+der\s+aktuelle\s+stand\s+zu\s+"
    r"|news\s+zu\s+"
    r"|im\s+web\s+(nach\s+)?schauen\s+(nach\s+)?"
    r"|laut\s+aktuellen\s+quellen\s*[:,]?\s*"
    r")"
)
_NOISE_TOKEN_RE = re.compile(
    r"(?is)\b("
    r"bitte|mal|doch|einfach|schnell|kurz|genau|irgendwie|"
    r"erwähne|schick(?:e)?|sende|teile|gib|"
    r"dem\s+provider|an\s+den\s+provider|chatverlauf|verlauf|"
    r"meine(?:n|r)?\s+name(?:n)?|adresse|telefon|email|e-mail|"
    r"passwort|geheimnis"
    r")\b"
)
_PII_PHRASE_RE = re.compile(
    r"(?is)("
    r"(?:mein(?:e[rn]?)?\s+)?(?:name|namen)\s+(?:ist\s+)?[A-ZÄÖÜ][\w\-]+|"
    r"(?:ich\s+hei(?:ße|sse)\s+)[A-ZÄÖÜ][\w\-]+|"
    r"adresse\s+[^.!?]{0,80}|"
    r"schick(?:e)?\s+dem\s+provider[^.!?]*|"
    r"und\s+erwähne\s+bitte[^.!?]*|"
    r"\b(?:tim|berlin|münchen|hamburg)\b(?=.*(?:name|adresse|wohn))"
    r")"
)
_FILLER_RUN_RE = re.compile(r"(?is)(?:\b(?:bitte|mal|doch|einfach)\b[\s,]*){2,}")
_SQLISH_RE = re.compile(
    r"(?is)\b(drop\s+table|union\s+select|or\s+1\s*=\s*1|;\s*--)\b"
)
_CHAR_SPAM_RE = re.compile(r"(.)\1{7,}")


def is_junk_query(query: str) -> bool:
    """True when sanitized query is empty, noise-only, spam, or SQL-ish."""
    q = (query or "").strip()
    if not q or q in {"?", ".", "-", "—", "info"}:
        return True
    low = q.lower()
    if _SQLISH_RE.search(q):
        return True
    # Noise-only leftovers after failed topic extract
    if re.fullmatch(
        r"(?is)(?:recherchier\w*|bitte|mal|doch|einfach|news|stand|aktuell\w*|zu|\s)+",
        q,
    ):
        return True
    if low in {"recherchiere", "bitte", "news", "stand"}:
        return True
    # Char spam / collapsed spam still too thin
    collapsed = _CHAR_SPAM_RE.sub(r"\1\1", q)
    if len(re.sub(r"\s+", "", collapsed)) < 3:
        return True
    # Mostly punctuation / digits only without alnum words ≥3
    tokens = re.findall(r"[A-Za-zÄÖÜäöüß0-9]{3,}", q)
    if not tokens and len(q) < 12:
        return True
    return False


def strip_pii(text: str) -> str:
    t = _PII_PHRASE_RE.sub(" ", text)
    # Drop clauses that ask to forward personal data to providers
    t = re.sub(
        r"(?is)\b(?:und\s+)?(?:schick|sende|teile|gib).{0,40}(?:provider|netz|internet).{0,60}",
        " ",
        t,
    )
    t = re.sub(
        r"(?is)\b(?:mein(?:e[rn]?)?\s+)?(?:name|namen|adresse|telefon)[^.!?,]*",
        " ",
        t,
    )
    return re.sub(r"\s+", " ", t).strip(" \t\n\r:?,.!-")


def strip_noise(text: str) -> str:
    t = _FILLER_RUN_RE.sub(" ", text)
    # Collapse leftover lone fillers at edges / duplicates
    t = re.sub(r"(?is)(?:\s*\bbitte\b)+", " ", t)
    t = re.sub(r"(?is)(?:\s*\bmal\b)+", " ", t)
    return re.sub(r"\s+", " ", t).strip(" \t\n\r:?,.!-")


def extract_topic(text: str, *, max_len: int = 120) -> str:
    """Keep searchable topic tokens; drop leftover noise words."""
    tokens = re.findall(r"[\w\-./+]{2,}|[0-9]+(?:\.[0-9]+)*", text, flags=re.UNICODE)
    keep: list[str] = []
    stop = {
        "bitte",
        "mal",
        "doch",
        "einfach",
        "schnell",
        "kurz",
        "genau",
        "irgendwie",
        "und",
        "oder",
        "den",
        "die",
        "das",
        "der",
        "dem",
        "des",
        "ein",
        "eine",
        "einer",
        "zu",
        "nach",
        "für",
        "mit",
        "ohne",
        "über",
        "vom",
        "von",
        "im",
        "in",
        "am",
        "an",
        "auch",
        "noch",
        "schon",
        "sehr",
        "ganz",
        "etwas",
        "provider",
        "chatverlauf",
        "verlauf",
        "erwähne",
        "schick",
        "schicke",
        "sende",
        "teile",
    }
    for tok in tokens:
        low = tok.lower()
        if low in stop:
            continue
        if _NOISE_TOKEN_RE.fullmatch(tok):
            continue
        keep.append(tok)
        joined = " ".join(keep)
        if len(joined) >= max_len:
            return joined[:max_len].rstrip()
    return " ".join(keep)[:max_len].rstrip()


def normalize_query(text: str) -> str:
    """Minimize outbound search query: strip research prefix, PII, noise → topic."""
    q = text.strip()
    # Repeated prefix / bitte spam at start
    for _ in range(8):
        nxt = _RESEARCH_PREFIX_RE.sub("", q).strip(" \t\n\r:?,.!")
        nxt = re.sub(r"(?is)^(?:bitte|mal)(?:\s+(?:bitte|mal))*\s*", "", nxt)
        if nxt == q:
            break
        q = nxt
    q = strip_pii(q)
    q = strip_noise(q)
    # Drop leading "Wikipedia" meta when topic follows
    q = re.sub(r"(?is)^\s*wikipedia\s+(?:zu\s+|über\s+)?", "", q).strip()
    topic = extract_topic(q, max_len=120)
    if topic:
        topic = _CHAR_SPAM_RE.sub(r"\1\1", topic)
        topic = re.sub(r"\s+", " ", topic).strip(" \t\n\r:?,.!-")
        return topic[:120]
    q = re.sub(r"\s+", " ", q).strip()
    q = _CHAR_SPAM_RE.sub(r"\1\1", q)
    if not q or is_junk_query(q):
        return ""
    return q[:120]


@dataclass
class Source:
    title: str
    url: str
    snippet: str
    provider: str
    retrieved_at: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class ResearchPack:
    query: str
    status: str  # blocked | ok | empty | error
    sources: list[Source] = field(default_factory=list)
    error: str | None = None
    diverges: bool = False
    privacy_note: str = PRIVACY_NOTE
    network_attempted: bool = False
    reply: str | None = None

    def to_public(self) -> dict[str, Any]:
        return {
            "used": self.status != "blocked",
            "status": self.status,
            "query": self.query,
            "sources": [s.to_dict() for s in self.sources],
            "error": self.error,
            "diverges": self.diverges,
            "privacy_note": self.privacy_note if self.status != "blocked" else None,
            "badge": "Mit Quellen" if self.status == "ok" and self.sources else None,
            "network_attempted": self.network_attempted,
        }


def network_call_count() -> int:
    return _NETWORK_CALLS


def reset_network_call_count() -> None:
    global _NETWORK_CALLS
    _NETWORK_CALLS = 0


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def domain_allowed(url: str, allowlist: list[str]) -> bool:
    try:
        host = (urlparse(url).hostname or "").lower()
    except Exception:
        return False
    if not host:
        return False
    for d in allowlist:
        d = d.lower().lstrip(".")
        if host == d or host.endswith("." + d):
            return True
    return False


def _http_get_json(url: str, timeout: float) -> Any:
    global _NETWORK_CALLS
    _NETWORK_CALLS += 1
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "JarvisLocalResearch/0.6 (+local; opt-in)"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        raw = resp.read().decode("utf-8", errors="replace")
    return json.loads(raw)


def _mock_sources(query: str) -> list[Source]:
    q = query.lower()
    now = _utc_now()
    if "xyzzy_unanswerable" in q or "keine_quelle_test" in q:
        return []
    if "python 3.13" in q or "python3.13" in q.replace(" ", ""):
        return [
            Source(
                title="Python 3.13 — Überblick",
                url="https://en.wikipedia.org/wiki/History_of_Python",
                snippet=(
                    "Python 3.13 ist eine aktuelle Hauptversion der Sprache Python "
                    "mit Performance- und Typing-Verbesserungen."
                ),
                provider="mock",
                retrieved_at=now,
            ),
            Source(
                title="Python Release Cycle",
                url="https://en.wikipedia.org/wiki/Python_(programming_language)",
                snippet=(
                    "Offizielle Python-Releases folgen einem jährlichen Zyklus; "
                    "3.13 gehört zur 3.x-Serie."
                ),
                provider="duckduckgo",
                retrieved_at=now,
            ),
        ]
    # Generic mock hit so opt-in+mock evals always have a citeable pack
    return [
        Source(
            title=f"Mock-Treffer zu „{query[:60]}“",
            url="https://en.wikipedia.org/wiki/Special:Search",
            snippet=f"Lokaler Mock-Snippet für die Query „{query[:120]}“ (Eval/Offline).",
            provider="mock",
            retrieved_at=now,
        )
    ]


def _wikipedia_sources(query: str, timeout: float, allowlist: list[str]) -> list[Source]:
    out: list[Source] = []
    for lang in ("de", "en"):
        search_url = (
            f"https://{lang}.wikipedia.org/w/api.php?"
            + urllib.parse.urlencode(
                {
                    "action": "query",
                    "list": "search",
                    "srsearch": query,
                    "srlimit": 3,
                    "format": "json",
                    "utf8": 1,
                }
            )
        )
        try:
            data = _http_get_json(search_url, timeout)
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, OSError):
            continue
        hits = ((data or {}).get("query") or {}).get("search") or []
        for hit in hits[:2]:
            title = str(hit.get("title") or "").strip()
            if not title:
                continue
            page_url = f"https://{lang}.wikipedia.org/wiki/{urllib.parse.quote(title.replace(' ', '_'))}"
            if not domain_allowed(page_url, allowlist):
                continue
            # Plain extract
            extract_url = (
                f"https://{lang}.wikipedia.org/w/api.php?"
                + urllib.parse.urlencode(
                    {
                        "action": "query",
                        "prop": "extracts",
                        "exintro": 1,
                        "explaintext": 1,
                        "titles": title,
                        "format": "json",
                        "utf8": 1,
                    }
                )
            )
            snippet = re.sub(r"<[^>]+>", "", str(hit.get("snippet") or ""))
            try:
                edata = _http_get_json(extract_url, timeout)
                pages = ((edata or {}).get("query") or {}).get("pages") or {}
                for page in pages.values():
                    extract = str(page.get("extract") or "").strip()
                    if extract:
                        snippet = extract[:420]
                        break
            except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, OSError):
                pass
            if not snippet.strip():
                continue
            out.append(
                Source(
                    title=title,
                    url=page_url,
                    snippet=snippet.strip()[:420],
                    provider=f"wikipedia:{lang}",
                    retrieved_at=_utc_now(),
                )
            )
        if out:
            break
    return out


def _looks_thin_snippet(text: str) -> bool:
    t = (text or "").strip()
    if len(t) < 40:
        return True
    # Mostly English boilerplate / empty-ish encyclopedia stubs
    low = t.lower()
    if low.startswith("a free online encyclopedia") or "wikipedia a free" in low:
        return True
    # Prefer DE for Jarvis; mark very EN-only short blurbs as thin when no umlaut/DE stopwords
    de_hints = (" der ", " die ", " das ", " und ", " ist ", " ein ", " eine ", "ö", "ä", "ü", "ß")
    if len(t) < 120 and not any(h in f" {low} " or h in low for h in de_hints):
        # short EN-only → thin
        if re.search(r"\b(the|and|is|are|of|for|with)\b", low):
            return True
    return False


def _duckduckgo_sources(query: str, timeout: float, allowlist: list[str]) -> list[Source]:
    url = "https://api.duckduckgo.com/?" + urllib.parse.urlencode(
        {"q": query, "format": "json", "no_redirect": 1, "no_html": 1}
    )
    try:
        data = _http_get_json(url, timeout)
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, OSError):
        return []
    out: list[Source] = []
    now = _utc_now()
    abstract = str(data.get("AbstractText") or "").strip()
    abs_url = str(data.get("AbstractURL") or "").strip()
    heading = str(data.get("Heading") or query).strip()
    if (
        abstract
        and abs_url
        and domain_allowed(abs_url, allowlist)
        and not _looks_thin_snippet(abstract)
    ):
        out.append(
            Source(
                title=heading or "DuckDuckGo Abstract",
                url=abs_url,
                snippet=abstract[:420],
                provider="duckduckgo",
                retrieved_at=now,
            )
        )
    for topic in (data.get("RelatedTopics") or [])[:4]:
        if not isinstance(topic, dict):
            continue
        text = str(topic.get("Text") or "").strip()
        furl = str(topic.get("FirstURL") or "").strip()
        if not text or not furl or not domain_allowed(furl, allowlist):
            continue
        if _looks_thin_snippet(text):
            continue
        out.append(
            Source(
                title=text.split(" - ")[0][:80],
                url=furl,
                snippet=text[:420],
                provider="duckduckgo",
                retrieved_at=now,
            )
        )
    return out


def _interleave_by_provider(sources: list[Source], max_sources: int) -> list[Source]:
    """Prefer mixed providers when both have hits (dual-provider polish)."""
    buckets: dict[str, list[Source]] = {}
    for s in sources:
        key = "wikipedia" if s.provider.startswith("wikipedia") else s.provider
        buckets.setdefault(key, []).append(s)
    if len(buckets) <= 1:
        return sources[:max_sources]
    keys = list(buckets.keys())
    out: list[Source] = []
    seen: set[str] = set()
    idx = 0
    while len(out) < max_sources:
        progressed = False
        for k in keys:
            bucket = buckets.get(k) or []
            while bucket:
                s = bucket.pop(0)
                if s.url in seen:
                    continue
                seen.add(s.url)
                out.append(s)
                progressed = True
                break
            if len(out) >= max_sources:
                break
        if not progressed:
            break
        idx += 1
        if idx > max_sources * 3:
            break
    return out


def retrieve(
    user_text: str,
    settings: dict[str, Any],
    *,
    opt_in: bool | None = None,
) -> ResearchPack:
    """Run retrieval only when opt-in. Never hits the network when blocked."""
    enabled = bool(settings.get("research_opt_in", False) if opt_in is None else opt_in)
    query = normalize_query(user_text)
    if not enabled:
        return ResearchPack(
            query=query or "info",
            status="blocked",
            network_attempted=False,
        )

    if is_junk_query(query):
        return ResearchPack(
            query=query or "(leer)",
            status="empty",
            sources=[],
            error="junk_query",
            network_attempted=False,
            reply=SAFE_RESEARCH_JUNK,
        )

    providers = list(settings.get("research_providers") or DEFAULT_PROVIDERS)
    allowlist = list(settings.get("research_allowlist") or DEFAULT_ALLOWLIST)
    try:
        timeout = float(settings.get("research_timeout_sec", 8))
    except (TypeError, ValueError):
        timeout = 8.0
    timeout = max(1.0, min(60.0, timeout))
    try:
        max_sources = int(settings.get("research_max_sources", 5) or 5)
    except (TypeError, ValueError):
        max_sources = 5
    max_sources = max(1, min(10, max_sources))

    sources: list[Source] = []
    errors: list[str] = []
    network_attempted = False

    for name in providers:
        key = str(name).strip().lower()
        try:
            if key == "mock":
                sources.extend(_mock_sources(query))
            elif key == "empty":
                continue
            elif key == "wikipedia":
                network_attempted = True
                sources.extend(_wikipedia_sources(query, timeout, allowlist))
            elif key in {"duckduckgo", "ddg"}:
                network_attempted = True
                sources.extend(_duckduckgo_sources(query, timeout, allowlist))
            else:
                errors.append(f"Unbekannter Provider: {key}")
        except Exception as exc:  # noqa: BLE001 — soft-fail per provider
            errors.append(f"{key}: {exc}")

    # Dedupe by URL, keep allowlisted only, then interleave providers
    seen: set[str] = set()
    unique: list[Source] = []
    for s in sources:
        if s.url in seen:
            continue
        if s.provider != "mock" and not domain_allowed(s.url, allowlist):
            continue
        seen.add(s.url)
        unique.append(s)

    unique = _interleave_by_provider(unique, max_sources)
    if not unique:
        # Soft-fail: empty pack → no-source refuse (even if some providers errored)
        return ResearchPack(
            query=query,
            status="empty",
            sources=[],
            error="; ".join(errors) if errors else None,
            network_attempted=network_attempted,
        )

    diverges = detect_divergence(unique)
    return ResearchPack(
        query=query,
        status="ok",
        sources=unique,
        diverges=diverges,
        network_attempted=network_attempted,
    )


def detect_divergence(sources: list[Source]) -> bool:
    """Heuristic: conflicting year / yes-no style claims across snippets."""
    years: set[str] = set()
    for s in sources:
        for y in re.findall(r"\b(20\d{2}|19\d{2})\b", s.snippet):
            years.add(y)
    if len(years) >= 3:
        return True
    texts = [s.snippet.lower() for s in sources]
    yes = any(re.search(r"\b(ja|yes|true|stimmt)\b", t) for t in texts)
    no = any(re.search(r"\b(nein|no|false|unwahr)\b", t) for t in texts)
    return yes and no and len(sources) >= 2


def format_sources_block(sources: list[Source]) -> str:
    lines = []
    for i, s in enumerate(sources, 1):
        lines.append(f"[{i}] {s.title} — {s.url}\n    {s.snippet}")
    return "\n".join(lines)


def research_system_nudge(pack: ResearchPack) -> str:
    block = format_sources_block(pack.sources)
    diverge = (
        "\nQuellen widersprechen sich teilweise — das klar benennen, nicht glätten.\n"
        if pack.diverges
        else ""
    )
    return (
        "Policy research (opt-in): Synthese NUR aus den folgenden Snippets. "
        "Jede harte Aussage mit [n] belegen. Keine Claims außerhalb der Snippets. "
        "Am Ende kurze Quellenliste mit URLs. "
        f"{PRIVACY_NOTE}\n"
        f"{diverge}"
        f"## Research-Snippets (Query: {pack.query})\n{block}\n"
    )


def synthesize_from_snippets(pack: ResearchPack) -> str:
    """Citation-safe reply with light Jarvis persona (not bare template-only)."""
    if pack.status == "blocked":
        return SAFE_RESEARCH_OFF
    if pack.reply and pack.error == "junk_query":
        return pack.reply
    if pack.status == "error" and not pack.sources:
        return SAFE_RESEARCH_NET_DOWN
    if pack.status != "ok" or not pack.sources:
        if pack.error == "junk_query":
            return SAFE_RESEARCH_JUNK
        return SAFE_RESEARCH_NO_SOURCE

    parts: list[str] = []
    if pack.diverges:
        parts.append(
            f"Zu „{pack.query}“ widersprechen sich die Quellen — hier die Belege, ohne Schönfärben:"
        )
    else:
        parts.append(
            f"Zu „{pack.query}“ — kompakt aus den Belegen, kein Raten:"
        )

    for i, s in enumerate(pack.sources, 1):
        snip = s.snippet.strip()
        if len(snip) > 220:
            snip = snip[:217] + "…"
        parts.append(f"• {snip} [{i}]")

    parts.append("")
    parts.append("Quellen:")
    for i, s in enumerate(pack.sources, 1):
        parts.append(f"[{i}] {s.title} — {s.url}")
    parts.append("")
    parts.append(PRIVACY_NOTE)
    return "\n".join(parts)


def reply_has_citations(reply: str, sources: list[Source]) -> bool:
    if not sources:
        return False
    if re.search(r"\[\d+\]", reply):
        return True
    low = reply.lower()
    return any(s.url.lower() in low for s in sources)


def finalize_research_reply(llm_reply: str, pack: ResearchPack) -> str:
    if pack.status == "blocked":
        return SAFE_RESEARCH_OFF
    if pack.status != "ok" or not pack.sources:
        if pack.status == "error":
            return SAFE_RESEARCH_NET_DOWN
        return SAFE_RESEARCH_NO_SOURCE
    text = (llm_reply or "").strip()
    if text and reply_has_citations(text, pack.sources):
        if pack.diverges and "widersprech" not in text.lower():
            text = "Quellen widersprechen sich teilweise.\n\n" + text
        if PRIVACY_NOTE not in text:
            text = text.rstrip() + "\n\n" + PRIVACY_NOTE
        return text
    return synthesize_from_snippets(pack)
