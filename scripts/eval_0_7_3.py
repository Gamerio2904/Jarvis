#!/usr/bin/env python3
"""Sprint 21 / v0.7.3 Delight & Session Polish eval (accepts 0.7.3 / 0.8.0)."""
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
from app.policy import get_policy  # noqa: E402

BASE = "http://127.0.0.1:8000"
OK_VERSIONS = ("0.7.3", "0.8.0")


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


def chat(content: str, title: str = "E073", cid: str | None = None):
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
    check(
        "health_073_plus",
        code == 200 and any(ver.startswith(v) for v in OK_VERSIONS),
        ver,
    )

    # D1 mood per conversation
    delight_mod.set_session_mood("kante", "conv-a")
    delight_mod.set_session_mood("ruhe", "conv-b")
    check(
        "unit_mood_isolated",
        delight_mod.get_session_mood("conv-a") == "kante"
        and delight_mod.get_session_mood("conv-b") == "ruhe"
        and delight_mod.get_session_mood("conv-c") == "neutral",
        f"a={delight_mod.get_session_mood('conv-a')} b={delight_mod.get_session_mood('conv-b')}",
    )

    # D4 research timeout / junk labels
    junk = R.retrieve(
        "Recherchiere bitte bitte bitte",
        {"research_opt_in": True, "research_providers": ["mock"], "research_timeout_sec": 8},
    )
    pub = junk.to_public()
    check(
        "unit_research_junk_label",
        junk.status == "empty"
        and bool(pub.get("status_label") or pub.get("badge"))
        and junk.network_attempted is False,
        f"status={junk.status} label={pub.get('status_label')} badge={pub.get('badge')}",
    )

    # D5 soft latency: smalltalk num_predict short
    st = get_policy("smalltalk")
    check(
        "unit_smalltalk_num_predict",
        st.num_predict is not None and int(st.num_predict) <= 120,
        str(st.num_predict),
    )

    # D3 emoji strip
    stripped = G.strip_emoji("Hallo 😀 weiter")
    check("unit_emoji_strip", "😀" not in stripped and "Hallo" in stripped, stripped)

    # Live D2 eggs off
    prev = req("GET", "/api/settings")[1] or {}
    req("PATCH", "/api/settings", {"easter_eggs_enabled": False})
    code, reply, data, _ = chat("/protokoll", title="E073-eggs")
    low = reply.lower()
    check(
        "live_eggs_off",
        code == 200
        and ("easter eggs sind aus" in low or "aus" in low)
        and "version:" not in low,
        reply[:200],
    )
    req(
        "PATCH",
        "/api/settings",
        {"easter_eggs_enabled": bool(prev.get("easter_eggs_enabled", True))},
    )

    # Live D1 mood isolation via eggs (check API delight — server process state)
    req("PATCH", "/api/settings", {"easter_eggs_enabled": True})
    ca = req("POST", "/api/conversations", {"title": "E073-mood-a"})[1]["id"]
    cb = req("POST", "/api/conversations", {"title": "E073-mood-b"})[1]["id"]
    _, _, data_a, _ = chat("/kante", cid=ca)
    _, _, data_b, _ = chat("/ruhe", cid=cb)
    mood_a = ((data_a or {}).get("delight") or {}).get("mood")
    mood_b = ((data_b or {}).get("delight") or {}).get("mood")
    check(
        "live_mood_isolated",
        mood_a == "kante" and mood_b == "ruhe",
        f"a={mood_a} b={mood_b}",
    )

    # Live D4 junk research UX
    req("PATCH", "/api/settings", {"research_opt_in": True, "research_providers": ["mock"]})
    code, reply, data, _ = chat("Recherchiere bitte bitte bitte", title="E073-junk")
    res = (data or {}).get("research") or {}
    check(
        "live_research_status_label",
        code == 200
        and res.get("status") == "empty"
        and bool(res.get("status_label") or res.get("badge")),
        f"res={res} reply={reply[:120]!r}",
    )
    req(
        "PATCH",
        "/api/settings",
        {
            "research_opt_in": False,
            "research_providers": ["wikipedia", "duckduckgo"],
            "easter_eggs_enabled": bool(prev.get("easter_eggs_enabled", True)),
        },
    )

    failed = [r for r in results if not r[1]]
    print(f"\n{len(results) - len(failed)}/{len(results)} passed")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
