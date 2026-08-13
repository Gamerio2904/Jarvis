#!/usr/bin/env python3
"""Sprint 22 / v0.8.0 Assist Clarity eval."""
from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app import db  # noqa: E402
from app import delight as delight_mod  # noqa: E402
from app import guards as G  # noqa: E402
from app import research as R  # noqa: E402

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


def chat(content: str, title: str = "E080", cid: str | None = None):
    if cid is None:
        cid = req("POST", "/api/conversations", {"title": title})[1]["id"]
    code, data = req("POST", f"/api/conversations/{cid}/chat", {"content": content})
    reply = ""
    if isinstance(data, dict):
        reply = ((data.get("assistant_message") or {}).get("content")) or ""
    return code, reply, data if isinstance(data, dict) else {}, cid


def main() -> int:
    results: list[tuple[str, bool, str]] = []

    def check(name: str, ok: bool, detail: str) -> None:
        results.append((name, ok, detail))
        print(f"[{'PASS' if ok else 'FAIL'}] {name}: {detail[:240]}")

    db.init_db()
    code, health = req("GET", "/api/health")
    ver = str((health or {}).get("version", ""))
    check("health_080", code == 200 and ver.startswith("0.8."), ver)

    # A1 vague task
    check(
        "unit_vague_task",
        G.looks_like_vague_task("Mach mir einen Plan für morgen"),
        "match",
    )
    check(
        "unit_vague_not_full_task",
        not G.looks_like_vague_task("Plan mir einen kurzen Wochenplan fürs Training"),
        "no-match full task",
    )

    # A2 /hilfe card
    card = delight_mod.capabilities_card()
    check("unit_hilfe_card", "/hilfe" in card.lower() or "Memory" in card, card[:120])

    # A4 research public fields
    pack = R.retrieve(
        "Recherchiere bitte bitte bitte",
        {"research_opt_in": True, "research_providers": ["mock"], "research_timeout_sec": 8},
    )
    pub = pack.to_public()
    check(
        "unit_research_echo_fields",
        "status_label" in pub and ("query" in pub or pub.get("badge")),
        str({k: pub.get(k) for k in ("status", "status_label", "badge", "query", "error")}),
    )

    # Live A1
    code, reply, data, _ = chat("Mach mir einen Plan für morgen", title="E080-clar")
    check(
        "live_clarify_first",
        code == 200
        and (
            reply.strip() == G.SAFE_TASK_CLARIFY
            or "?" in reply
            or "annahme" in reply.lower()
            or "ziel" in reply.lower()
        ),
        reply[:200],
    )

    # Live A2 /hilfe
    req("PATCH", "/api/settings", {"easter_eggs_enabled": True})
    code, reply, data, _ = chat("/hilfe", title="E080-hilfe")
    low = reply.lower()
    check(
        "live_hilfe",
        code == 200
        and ("memory" in low or "merken" in low)
        and ("research" in low or "opt-in" in low)
        and len(reply) < 800,
        reply[:220],
    )

    # Live A5 soft confirm
    code, reply, data, _ = chat("Ich mag Earl Grey besonders gerne", title="E080-soft")
    low = reply.lower()
    route = (data or {}).get("route") or {}
    check(
        "live_soft_confirm",
        code == 200
        and (
            "so merken" in low
            or "ttl" in low
            or route.get("intent") == "memory"
            or "notiert" in low
        ),
        f"route={route} reply={reply[:180]!r}",
    )

    # Live A4 research echo on junk
    req("PATCH", "/api/settings", {"research_opt_in": True, "research_providers": ["mock"]})
    code, reply, data, _ = chat("Recherchiere bitte bitte bitte", title="E080-res")
    res = (data or {}).get("research") or {}
    check(
        "live_research_ui_echo",
        code == 200
        and bool(res.get("status_label") or res.get("badge"))
        and res.get("status") in {"empty", "error", "timeout", "ok"},
        f"res={res}",
    )
    req(
        "PATCH",
        "/api/settings",
        {"research_opt_in": False, "research_providers": ["wikipedia", "duckduckgo"]},
    )

    # A3 stream endpoint exists / health version for UI
    code, health = req("GET", "/api/health")
    check(
        "live_version_ui_contract",
        code == 200 and str(health.get("version", "")).startswith("0.8."),
        str(health.get("version")),
    )

    failed = [r for r in results if not r[1]]
    print(f"\n{len(results) - len(failed)}/{len(results)} passed")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
