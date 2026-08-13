#!/usr/bin/env python3
"""Sprint 25 / v0.8.3 Assist Ops eval."""
from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app import db  # noqa: E402
from app import delight as D  # noqa: E402
from app import guards as G  # noqa: E402
from app import memory as M  # noqa: E402

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


def chat(content: str, title: str = "E083", cid: str | None = None):
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
        print(f"[{'PASS' if ok else 'FAIL'}] {name}: {detail[:220]}")

    db.init_db()
    code, health = req("GET", "/api/health")
    ver = str((health or {}).get("version", ""))
    check("health_083", code == 200 and ver.startswith("0.8.3"), ver)
    check(
        "health_heavy_fields",
        "heavy_equals_default" in (health or {}) or "warning" in (health or {}),
        str({k: (health or {}).get(k) for k in ("heavy_equals_default", "warning", "model_heavy")}),
    )

    # O2 mood persist via DB
    req("PATCH", "/api/settings", {"easter_eggs_enabled": True})
    ca = req("POST", "/api/conversations", {"title": "E083-mood"})[1]["id"]
    chat("/kante", cid=ca)
    # clear in-process cache and reload from DB
    D._MOOD_BY_CONV.pop(ca, None)
    check("unit_mood_db_persist", D.get_session_mood(ca) == "kante", D.get_session_mood(ca))

    # O6 delight daily table
    before = D.moments_used_today()
    D.record_moment()
    check("unit_delight_daily", D.moments_used_today() >= before + 1, str(D.moments_used_today()))

    # Soft confirm still valid under 0.8.3
    code, reply, data, _ = chat("Ich mag Jazz", title="E083-jazz")
    check(
        "live_soft_jazz",
        code == 200 and "jazz" in reply.lower() and "zz" not in reply.lower().split(),
        reply[:160],
    )

    # Capabilities short
    code, reply, _, _ = chat("Was kannst du?", title="E083-cap")
    low = reply.lower()
    check("live_cap_short", "memory" in low or "merken" in low, reply[:140])

    # Greeting not SAFE_SMALLTALK
    code, reply, _, _ = chat("Guten Morgen", title="E083-gm")
    check("live_greeting", reply.strip() != G.SAFE_SMALLTALK, reply[:120])

    # Garbage filter
    db.upsert_memory_item(key="mag_pan", value="pan", category="pref", confidence=0.55)
    hits = M.retrieve_relevant("Was mag ich?", min_confidence=0.0)
    check("unit_no_garbage_inject", all(h.get("key") != "mag_pan" for h in hits), str([(h.get("key"), h.get("value")) for h in hits[:5]]))
    M.purge_garbage_soft_memory()

    failed = [r for r in results if not r[1]]
    print(f"\n{len(results) - len(failed)}/{len(results)} passed")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
