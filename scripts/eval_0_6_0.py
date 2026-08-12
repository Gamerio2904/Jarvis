#!/usr/bin/env python3
"""Sprint 15 / v0.6.0 internet-research eval."""
from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app import db  # noqa: E402
from app import research as research_mod  # noqa: E402
from app import router as router_mod  # noqa: E402

BASE = "http://127.0.0.1:8000"


def req(method: str, path: str, body: dict | None = None, timeout: float = 300.0):
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


def new_conv(title: str) -> str:
    return req("POST", "/api/conversations", {"title": title})[1]["id"]


def chat(cid: str, content: str):
    code, data = req("POST", f"/api/conversations/{cid}/chat", {"content": content})
    reply = ""
    if isinstance(data, dict):
        reply = (data.get("assistant_message") or {}).get("content", "")
    return code, reply, data if isinstance(data, dict) else None


def restore_settings(snapshot: dict) -> None:
    req(
        "PATCH",
        "/api/settings",
        {
            "research_opt_in": bool(snapshot.get("research_opt_in", False)),
            "research_providers": list(
                snapshot.get("research_providers")
                or ["wikipedia", "duckduckgo"]
            ),
        },
    )


def main() -> int:
    results: list[tuple[str, bool, str]] = []

    def check(name: str, ok: bool, detail: str) -> None:
        results.append((name, ok, detail))
        print(f"[{'PASS' if ok else 'FAIL'}] {name}: {detail}")

    db.init_db()
    code, baseline = req("GET", "/api/settings")
    assert code == 200 and isinstance(baseline, dict)

    try:
        # R7 health / version
        code, health = req("GET", "/api/health")
        check(
            "health_060",
            code == 200
            and health.get("version") == "0.6.0"
            and health.get("ok")
            and "research_opt_in" in health,
            json.dumps(
                {k: health.get(k) for k in ("version", "research_opt_in", "ok")},
                ensure_ascii=False,
            ),
        )

        # Router still classifies research
        route = router_mod.classify(
            "Recherchiere den aktuellen Stand zu Python 3.13", research_opt_in=False
        )
        check(
            "unit_router_research_blocked",
            route.intent == "research" and route.research_blocked,
            route.reason,
        )

        # R1: opt-in off → no network
        restore_settings({"research_opt_in": False, "research_providers": ["wikipedia"]})
        research_mod.reset_network_call_count()
        before = research_mod.network_call_count()
        pack = research_mod.retrieve(
            "Recherchiere den aktuellen Stand zu Python 3.13",
            db.load_settings(),
        )
        check(
            "unit_opt_in_off_no_net",
            pack.status == "blocked"
            and pack.network_attempted is False
            and research_mod.network_call_count() == before,
            f"status={pack.status} net={research_mod.network_call_count()}",
        )

        c = new_conv("E060-off")
        code, reply, data = chat(c, "Recherchiere den aktuellen Stand zu Python 3.13")
        research_off = (data or {}).get("research") or {}
        route_off = (data or {}).get("route") or {}
        live_off_ok = (
            code == 200
            and route_off.get("intent") == "research"
            and bool(route_off.get("research_blocked"))
            and "kein netz" in (reply or "").lower()
            and research_off.get("status") == "blocked"
            and research_off.get("network_attempted") is False
        )
        check(
            "live_opt_in_off",
            live_off_ok,
            f"code={code} route={route_off} reply={reply[:140]!r} research={research_off}",
        )

        # R1 toggle via settings API
        code, s = req("PATCH", "/api/settings", {"research_opt_in": True})
        check(
            "settings_toggle_on",
            code == 200 and s.get("research_opt_in") is True,
            json.dumps(s, ensure_ascii=False)[:180],
        )

        # R2/R3/R5 mock retrieval with citations
        req(
            "PATCH",
            "/api/settings",
            {"research_opt_in": True, "research_providers": ["mock"]},
        )
        c2 = new_conv("E060-mock")
        code, reply, data = chat(c2, "Recherchiere den aktuellen Stand zu Python 3.13")
        research = (data or {}).get("research") or {}
        sources = research.get("sources") or []
        check(
            "live_mock_citations",
            code == 200
            and research.get("status") == "ok"
            and research.get("badge") == "Mit Quellen"
            and len(sources) >= 1
            and ("[1]" in (reply or "") or sources[0]["url"] in (reply or ""))
            and "Privacy:" in (reply or ""),
            f"sources={len(sources)} reply={reply[:200]!r}",
        )

        # R4 no-source refuse
        c3 = new_conv("E060-empty")
        code, reply, data = chat(
            c3, "Recherchiere xyzzy_unanswerable_9f3a keine_quelle_test"
        )
        research = (data or {}).get("research") or {}
        check(
            "live_no_source_refuse",
            code == 200
            and research.get("status") == "empty"
            and "rate nicht" in (reply or "").lower(),
            f"status={research.get('status')} reply={reply[:160]!r}",
        )

        # R6 audit log
        code, audits = req("GET", "/api/research/audits?limit=10")
        check(
            "audit_log_present",
            code == 200
            and isinstance(audits, list)
            and any(a.get("query") for a in audits)
            and any(a.get("status") in {"ok", "empty", "blocked"} for a in audits),
            f"n={len(audits) if isinstance(audits, list) else None}",
        )

        # Message meta persists sources
        msg = (data or {}).get("assistant_message") or {}
        # use mock conversation message
        code2, conv = req("GET", f"/api/conversations/{c2}")
        msgs = (conv or {}).get("messages") or []
        asst = [m for m in msgs if m.get("role") == "assistant"]
        check(
            "message_meta_sources",
            code2 == 200
            and asst
            and (asst[-1].get("meta") or {}).get("research", {}).get("sources"),
            f"meta={(asst[-1].get('meta') if asst else None)}",
        )

        # Domain allowlist rejects foreign host
        check(
            "unit_allowlist",
            research_mod.domain_allowed(
                "https://en.wikipedia.org/wiki/X", ["wikipedia.org"]
            )
            and not research_mod.domain_allowed(
                "https://evil.example/x", ["wikipedia.org"]
            ),
            "allowlist ok",
        )

    finally:
        restore_settings(baseline)

    failed = [r for r in results if not r[1]]
    print(f"\n{len(results) - len(failed)}/{len(results)} passed")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
