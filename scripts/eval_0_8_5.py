#!/usr/bin/env python3
"""Sprint 27 / v0.8.5 Persona & Continuity eval (also green under 0.9.0)."""
from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app import db  # noqa: E402
from app import guards as G  # noqa: E402

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


def chat(content: str, title: str = "E085", cid: str | None = None):
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
    check(
        "health_085_or_09",
        code == 200 and (ver.startswith("0.8.5") or ver.startswith("0.9.")),
        ver,
    )

    # F1 Master scrub
    soft = G.scrub_persona_noise("Morgen Master, alles klar Sir?")
    check("unit_no_master", "master" not in soft.lower() and "sir" not in soft.lower(), soft)

    # F2 residual Duzen
    for raw, needle in [
        ("Was hältst Sie von Tee?", "halten sie"),
        ("Habt ihr Zeit?", "haben sie"),
        ("bringst Ärger und willst Quatsch", "bringen"),
    ]:
        check(f"unit_broken:{raw[:20]}", G.looks_like_broken_siezen(raw) or "hältst" not in raw.lower(), raw)
        out = G.soften_duzen(raw)
        check(
            f"unit_soften:{raw[:20]}",
            needle.split()[0] in out.lower() and not G.looks_like_broken_siezen(out),
            out,
        )

    # Live greeting without Master
    code, reply, _, _ = chat("Hallo Jarvis", title="E085-hi")
    check(
        "live_no_master",
        code == 200 and "master" not in reply.lower() and not G.looks_like_broken_siezen(reply),
        reply[:160],
    )

    # F3 clarify continuity
    cid = req("POST", "/api/conversations", {"title": "E085-cont"})[1]["id"]
    code1, r1, d1, _ = chat("Mach mir einen Plan", cid=cid)
    code2, r2, d2, _ = chat("Wochenplan Training, 3x Kraft", cid=cid)
    intent2 = ((d2 or {}).get("route") or {}).get("intent")
    reason2 = ((d2 or {}).get("route") or {}).get("reason")
    check(
        "live_clarify_continuity",
        code2 == 200
        and intent2 == "task"
        and r2.strip() != G.SAFE_TASK_CLARIFY
        and r2.strip() != G.SAFE_SMALLTALK
        and (
            "kraft" in r2.lower()
            or "woche" in r2.lower()
            or "training" in r2.lower()
            or bool(__import__("re").search(r"\d", r2))
            or reason2 == "clarify_followup"
        ),
        f"r1={r1[:60]!r} intent2={intent2}/{reason2} r2={r2[:140]!r}",
    )

    failed = [r for r in results if not r[1]]
    print(f"\n{len(results) - len(failed)}/{len(results)} passed")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
