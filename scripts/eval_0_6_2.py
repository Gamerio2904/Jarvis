#!/usr/bin/env python3
"""Sprint 17 / v0.6.2 research polish eval (also green on 0.7.0)."""
from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app import research as R  # noqa: E402

BASE = "http://127.0.0.1:8000"


def req(method: str, path: str, body: dict | None = None, timeout: float = 180.0):
    data = None if body is None else json.dumps(body).encode()
    headers = {"Content-Type": "application/json"} if body is not None else {}
    r = urllib.request.Request(f"{BASE}{path}", data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r, timeout=timeout) as resp:
            raw = resp.read().decode()
            return resp.status, json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            payload = json.loads(raw) if raw else {"detail": raw}
        except json.JSONDecodeError:
            payload = {"detail": raw}
        return e.code, payload


def main() -> int:
    results: list[tuple[str, bool, str]] = []

    def check(name: str, ok: bool, detail: str) -> None:
        results.append((name, ok, detail))
        print(f"[{'PASS' if ok else 'FAIL'}] {name}: {detail[:220]}")

    code, health = req("GET", "/api/health")
    check(
        "health_062_line",
        code == 200 and health.get("version") in {"0.6.2", "0.7.0"},
        str(health.get("version")),
    )

    # P1 persona synth
    pack = R.ResearchPack(
        query="Python 3.13",
        status="ok",
        sources=[
            R.Source("A", "https://en.wikipedia.org/wiki/A", "Python 3.13 bringt Typing-Verbesserungen.", "mock", "t"),
        ],
    )
    synth = R.synthesize_from_snippets(pack)
    check(
        "persona_not_bare_kurz_template",
        "Kurz aus den Quellen" not in synth and "[1]" in synth and "python" in synth.lower(),
        synth[:160],
    )

    # thin DDG filter
    check("ddg_thin_detect", R._looks_thin_snippet("Wikipedia A free online encyclopedia written and maintained"), "thin")
    check("ddg_ok_de", not R._looks_thin_snippet("Ollama ist eine Open-Source-Software zur lokalen Ausführung von Large Language Models."), "de ok")

    code, baseline = req("GET", "/api/settings")
    req("PATCH", "/api/settings", {"research_opt_in": True, "research_providers": ["mock"]})
    cid = req("POST", "/api/conversations", {"title": "E062"})[1]["id"]
    code, data = req(
        "POST",
        f"/api/conversations/{cid}/chat",
        {"content": "Recherchiere den aktuellen Stand zu Python 3.13"},
    )
    research = (data or {}).get("research") or {}
    sources = research.get("sources") or []
    providers = {s.get("provider") for s in sources}
    check(
        "dual_provider_mock_mix",
        code == 200 and len(providers) >= 2,
        f"providers={providers}",
    )
    reply = ((data or {}).get("assistant_message") or {}).get("content") or ""
    check(
        "citations_still_present",
        "[1]" in reply or any((s.get("url") or "") in reply for s in sources),
        reply[:160],
    )

    req(
        "PATCH",
        "/api/settings",
        {
            "research_opt_in": bool(baseline.get("research_opt_in", False)),
            "research_providers": list(baseline.get("research_providers") or ["wikipedia", "duckduckgo"]),
        },
    )

    failed = [r for r in results if not r[1]]
    print(f"\n{len(results) - len(failed)}/{len(results)} passed")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
