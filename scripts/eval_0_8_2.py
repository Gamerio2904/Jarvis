#!/usr/bin/env python3
"""Sprint 24 / v0.8.2 Edge & Reply Polish eval (accepts 0.8.2+ / 0.8.3)."""
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
from app import router as R  # noqa: E402

BASE = "http://127.0.0.1:8000"
OK = ("0.8.2", "0.8.3")


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


def chat(content: str, title: str = "E082", cid: str | None = None):
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
    check("health_082_plus", code == 200 and any(ver.startswith(v) for v in OK), ver)

    for q in ("Was kannst du?", "Was geht?", "Fähigkeiten"):
        route = R.classify(q)
        check(f"unit_cap_route:{q}", route.intent == "helpdesk_trap", route.intent)

    card = D.capabilities_card()
    check("unit_card", "Memory" in card and "Research" in card, card[:80])

    for q in ("Was kannst du?", "Was geht?"):
        code, reply, data, _ = chat(q, title="E082-cap")
        low = reply.lower()
        check(
            f"live_cap:{q}",
            code == 200 and ("memory" in low or "merken" in low) and ("research" in low or "opt-in" in low),
            reply[:160],
        )

    canned = 0
    for q in ("Guten Morgen", "Hallo", "Hey"):
        code, reply, _, _ = chat(q, title="E082-hi")
        if reply.strip() == G.SAFE_SMALLTALK:
            canned += 1
        check(
            f"live_greet:{q}",
            code == 200 and reply.strip() != G.SAFE_SMALLTALK,
            reply[:140],
        )
    check("live_greet_canned_zero", canned == 0, f"canned={canned}")

    cid = req("POST", "/api/conversations", {"title": "E082-forget"})[1]["id"]
    chat("Merk dir: Ich heiße TempForget", cid=cid)
    code, reply, data, _ = chat("Vergiss meinen Namen", cid=cid)
    low = reply.lower()
    check(
        "live_forget_wording",
        code == 200 and any(w in low for w in ("weg", "raus", "gelöscht")),
        reply[:160],
    )

    cid = req("POST", "/api/conversations", {"title": "E082-softrej"})[1]["id"]
    chat("Ich mag Earl Grey besonders gerne", cid=cid)
    code, reply, data, _ = chat("Nein, bitte nicht merken", cid=cid)
    check(
        "live_soft_reject",
        code == 200
        and ((data or {}).get("memory_op") == "soft_reject" or "weg" in reply.lower() or "nicht" in reply.lower()),
        f"op={(data or {}).get('memory_op')} reply={reply[:140]!r}",
    )

    check("unit_broken_detect", G.looks_like_broken_siezen("Was brauchst Sie heute?"), "detect")
    fixed = G.soften_duzen("Was brauchst du heute?")
    check("unit_broken_fixed", not G.looks_like_broken_siezen(fixed), fixed)

    failed = [r for r in results if not r[1]]
    print(f"\n{len(results) - len(failed)}/{len(results)} passed")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
