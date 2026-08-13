#!/usr/bin/env python3
"""Sprint 26 / v0.8.4 deep Stichproben (Siezen, Identity, CJK)."""
from __future__ import annotations

import json
import sys
import urllib.error
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


def chat(content: str, title: str = "D084", cid: str | None = None):
    if cid is None:
        cid = req("POST", "/api/conversations", {"title": title})[1]["id"]
    code, data = req("POST", f"/api/conversations/{cid}/chat", {"content": content})
    reply = ""
    route = {}
    if isinstance(data, dict):
        reply = ((data.get("assistant_message") or {}).get("content")) or ""
        route = data.get("route") or {}
    return code, reply, route, cid


def main() -> int:
    results: list[tuple[str, str, bool, str]] = []

    def check(kind: str, name: str, ok: bool, detail: str) -> None:
        results.append((kind, name, ok, detail))
        print(f"[{'PASS' if ok else 'FAIL'}][{kind}] {name}: {detail[:220]}")

    code, health = req("GET", "/api/health")
    ver = str((health or {}).get("version", ""))
    check("MUST", "health_084", code == 200 and ver.startswith("0.8.4"), ver)

    probes = [
        "Hallo Jarvis",
        "Moin",
        "Guten Morgen",
        "Was kannst du?",
    ]
    for q in probes:
        code, reply, _, _ = chat(q, title=f"D084-{q[:8]}")
        bad = G.looks_like_broken_siezen(reply) or "möchtest sie" in reply.lower()
        check("MUST", f"siezen_{q}", code == 200 and not bad, reply[:160])

    cid = req("POST", "/api/conversations", {"title": "D084-id"})[1]["id"]
    chat("Merk dir: Ich heiße Klaus.", cid=cid)
    code, reply, _, _ = chat("Wie heiße ich?", cid=cid)
    check(
        "MUST",
        "identity_klaus",
        code == 200 and "klaus" in reply.lower() and "nora" not in reply.lower(),
        reply[:160],
    )

    cjk = "1. 搬家 2. 打包 — bitte einen Plan"
    code, reply, route, _ = chat(cjk, title="D084-cjk")
    check(
        "MUST",
        "cjk_not_smalltalk",
        code == 200 and reply.strip() != G.SAFE_SMALLTALK and route.get("intent") == "task",
        f"route={route} reply={reply[:140]}",
    )

    failed = [r for r in results if not r[2]]
    print(f"\n{len(results) - len(failed)}/{len(results)} passed")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
