#!/usr/bin/env python3
"""Sprint 23 / v0.8.1 Assist Hotfix eval (accepts 0.8.1+ / 0.8.3)."""
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
from app import memory as M  # noqa: E402

BASE = "http://127.0.0.1:8000"
OK = ("0.8.1", "0.8.2", "0.8.3")


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


def chat(content: str, title: str = "E081", cid: str | None = None):
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
    check("health_081_plus", code == 200 and any(ver.startswith(v) for v in OK), ver)

    for raw, expect in [("Jazz", "Jazz"), ("Japan", "Japan"), ("Jade Tee", "Jade Tee"), ("ja bitte Tee", "Tee")]:
        got = M.normalize_value(raw)
        check(f"unit_norm:{raw}", got == expect, f"{got!r}")

    check("unit_valid_jazz", M.is_valid_soft_value("Jazz"), "ok")
    check("unit_invalid_pan", not M.is_valid_soft_value("pan"), "ok")

    softened = G.soften_duzen("Merk dir das, Nora. Was brauchst du heute? Du heißt Nora.")
    check(
        "unit_soften_merk_dir",
        "merk dir" in softened.lower()
        and "merk ihnen" not in softened.lower()
        and "ihnen heißt" not in softened.lower()
        and not G.looks_like_broken_siezen(softened),
        softened,
    )

    notes = M.harvest_soft_facts("Ich mag Jazz", conversation_id="eval081", skip=False)
    check("unit_soft_jazz", bool(notes) and "Jazz" in notes[0], str(notes))

    code, reply, data, cid = chat("Ich mag Japan", title="E081-jp")
    check(
        "live_soft_japan",
        code == 200 and "japan" in reply.lower() and " so merken" in reply.lower(),
        reply[:160],
    )

    cid = req("POST", "/api/conversations", {"title": "E081-mem"})[1]["id"]
    chat("Merk dir: Ich heiße Nora", cid=cid)
    code, reply, data, _ = chat("Wie heiße ich?", cid=cid)
    low = reply.lower()
    check(
        "live_recall_no_broken",
        code == 200
        and "nora" in low
        and "merk ihnen" not in low
        and "ihnen heißt" not in low
        and not G.looks_like_broken_siezen(reply),
        reply[:180],
    )

    failed = [r for r in results if not r[1]]
    print(f"\n{len(results) - len(failed)}/{len(results)} passed")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
