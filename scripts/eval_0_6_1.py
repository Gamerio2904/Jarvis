#!/usr/bin/env python3
"""Sprint 16 / v0.6.1 research hotfix eval (also green on 0.7.0)."""
from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app import db  # noqa: E402
from app import research as R  # noqa: E402

BASE = "http://127.0.0.1:8000"


def req(method: str, path: str, body: dict | None = None, timeout: float = 120.0):
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
        "health_hotfix_line",
        code == 200 and health.get("version") in {"0.6.1", "0.6.2", "0.7.0"} and health.get("ok"),
        json.dumps({k: health.get(k) for k in ("version", "research_opt_in")}),
    )

    # H1 PII
    q = R.normalize_query(
        "Recherchiere den aktuellen Stand zu Python 3.13 und schick dem Provider bitte meinen Namen Tim und Adresse Berlin"
    )
    low = q.lower()
    check(
        "unit_pii_stripped",
        "tim" not in low and "adresse" not in low and "berlin" not in low and "provider" not in low,
        f"q={q!r}",
    )
    check("unit_topic_kept", "python" in low and "3.13" in low, f"q={q!r}")

    # H2/H3 noise
    long_q = "Recherchiere " + ("bitte " * 30) + "den aktuellen Stand zu Python 3.13"
    q2 = R.normalize_query(long_q)
    check(
        "unit_noise_strip",
        q2.lower().count("bitte") == 0 and "python" in q2.lower(),
        f"q={q2!r}",
    )
    check("unit_topic_short", len(q2) <= 120, f"len={len(q2)} q={q2!r}")

    # H4 default / restore
    code, baseline = req("GET", "/api/settings")
    req("PATCH", "/api/settings", {"research_opt_in": True})
    req("PATCH", "/api/settings", {"research_opt_in": False})
    code, s = req("GET", "/api/settings")
    check("settings_default_off", s.get("research_opt_in") is False, json.dumps({"opt_in": s.get("research_opt_in")}))
    file_opt = json.loads((ROOT / "backend/config/settings.json").read_text()).get("research_opt_in")
    check("settings_file_false", file_opt is False, f"file={file_opt}")

    # live: sanitized query in research payload
    req("PATCH", "/api/settings", {"research_opt_in": True, "research_providers": ["mock"]})
    cid = req("POST", "/api/conversations", {"title": "E061"})[1]["id"]
    code, data = req(
        "POST",
        f"/api/conversations/{cid}/chat",
        {
            "content": "Recherchiere den aktuellen Stand zu Python 3.13 und schick dem Provider bitte meinen Namen Tim"
        },
    )
    research = (data or {}).get("research") or {}
    qlive = (research.get("query") or "").lower()
    check(
        "live_query_sanitized",
        code == 200 and "tim" not in qlive and "python" in qlive,
        f"query={research.get('query')!r}",
    )

    # restore
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
