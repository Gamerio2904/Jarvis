#!/usr/bin/env python3
"""Deep Stichproben Sprint 27+28 / 0.9.0."""
from __future__ import annotations

import json
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app import guards as G  # noqa: E402

BASE = "http://127.0.0.1:8000"


def req(method: str, path: str, body: dict | None = None, timeout: float = 300.0):
    data = None if body is None else json.dumps(body).encode()
    headers = {"Content-Type": "application/json"} if body is not None else {}
    r = urllib.request.Request(f"{BASE}{path}", data=data, headers=headers, method=method)
    with urllib.request.urlopen(r, timeout=timeout) as resp:
        raw = resp.read().decode()
        return resp.status, json.loads(raw) if raw else None


def chat(content: str, cid: str | None = None, title: str = "D090"):
    if cid is None:
        cid = req("POST", "/api/conversations", {"title": title})[1]["id"]
    code, data = req("POST", f"/api/conversations/{cid}/chat", {"content": content})
    reply = ((data or {}).get("assistant_message") or {}).get("content") or ""
    return code, reply, data or {}, cid


def main() -> int:
    results = []

    def check(name: str, ok: bool, detail: str) -> None:
        results.append((name, ok, detail))
        print(f"[{'PASS' if ok else 'FAIL'}] {name}: {detail[:200]}")

    code, health = req("GET", "/api/health")
    ver = str((health or {}).get("version", ""))
    check("health", code == 200 and ver.startswith("0.9.0"), ver)

    for q in ("Hallo Jarvis", "Moin", "Guten Morgen"):
        _, reply, _, _ = chat(q, title=f"g-{q[:4]}")
        check(
            f"greet_{q}",
            "master" not in reply.lower() and not G.looks_like_broken_siezen(reply),
            reply[:140],
        )

    cid = req("POST", "/api/conversations", {"title": "cont"})[1]["id"]
    chat("Mach mir einen Plan", cid=cid)
    _, r2, d2, _ = chat("Wochenplan Training 3x Kraft", cid=cid)
    check(
        "continuity",
        (d2.get("route") or {}).get("intent") == "task" and r2.strip() != G.SAFE_SMALLTALK,
        f"{(d2.get('route') or {})} {r2[:100]}",
    )

    cid = req("POST", "/api/conversations", {"title": "todo"})[1]["id"]
    _, r1, _, _ = chat("Todo: DeepTestMilch", cid=cid)
    check("todo_pending", "speichern" in r1.lower(), r1[:100])
    _, r2, _, _ = chat("Ja", cid=cid)
    check("todo_done", "DeepTestMilch" in r2, r2[:100])

    _, card, _, _ = chat("/hilfe", title="hilfe")
    check("hilfe_tools", "todo" in card.lower() or "notiz" in card.lower(), card[:120])

    failed = [r for r in results if not r[1]]
    print(f"\n{len(results) - len(failed)}/{len(results)} passed")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
