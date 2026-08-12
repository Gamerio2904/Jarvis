#!/usr/bin/env python3
"""Sprint 11 / v0.4.3 memory hotfix eval (unit + API)."""
from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app import db  # noqa: E402
from app import memory as memory_mod  # noqa: E402

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


def new_conv(title: str = "Eval043") -> str:
    _, data = req("POST", "/api/conversations", {"title": title})
    return data["id"]


def chat(cid: str, content: str):
    code, data = req("POST", f"/api/conversations/{cid}/chat", {"content": content})
    reply = ""
    if isinstance(data, dict):
        reply = (data.get("assistant_message") or {}).get("content", "")
    return code, reply, data if isinstance(data, dict) else None


def main() -> int:
    results: list[tuple[str, bool, str]] = []

    def check(name: str, ok: bool, detail: str) -> None:
        results.append((name, ok, detail))
        print(f"[{'PASS' if ok else 'FAIL'}] {name}: {detail}")

    db.init_db()
    db.clear_all_memory()

    # H1 clause split
    multi = memory_mod.parse_explicit_remember_many(
        "Merk dir: Ich heiße Sara, wohne in Hamburg, arbeite als Ärztin und mein Hund heißt Luna."
    )
    by_key = {k: v for k, v, _ in multi}
    check(
        "unit_beruf_clean",
        by_key.get("beruf", "").lower() == "ärztin"
        and by_key.get("hund", "").lower() == "luna"
        and "hund" not in by_key.get("beruf", "").lower(),
        repr(multi),
    )

    # H3 pref without mein
    pref = memory_mod.parse_explicit_remember_many("Speichere: Lieblingsfarbe ist Grün")
    check(
        "unit_pref_bare",
        len(pref) == 1
        and pref[0][0] == "lieblingsfarbe"
        and pref[0][1].lower() == "grün"
        and pref[0][2] == "pref",
        repr(pref),
    )
    shared = memory_mod.parse_lieblings_pref("Lieblingstee ist Matcha")
    check(
        "unit_shared_lieblings",
        shared is not None and shared[0] == "lieblingstee" and shared[1].lower() == "matcha",
        repr(shared),
    )

    # H2 unit: recall ack never Aussetzer
    ack = memory_mod.ack_reply_for_recall(["Recall: job = Backend-Dev"])
    check(
        "unit_recall_ack",
        "backend-dev" in ack.lower() and "aussetzer" not in ack.lower(),
        ack,
    )

    code, health = req("GET", "/api/health")
    check(
        "health_version",
        code == 200 and health.get("version") == "0.4.3" and health.get("ok"),
        json.dumps(health, ensure_ascii=False)[:240],
    )

    req("DELETE", "/api/memory")

    # Live H1
    c = new_conv("Eval043-split")
    code, reply, data = chat(
        c,
        "Merk dir: Ich heiße Sara, wohne in Hamburg, arbeite als Ärztin und mein Hund heißt Luna.",
    )
    items = req("GET", "/api/memory")[1] or []
    beruf = next((i for i in items if i["key"] == "beruf"), None)
    hund = next((i for i in items if i["key"] == "hund"), None)
    check(
        "live_beruf_clean",
        code == 200
        and beruf
        and beruf["value"].lower() == "ärztin"
        and hund
        and hund["value"].lower() == "luna",
        f"beruf={beruf} hund={hund} notes={(data or {}).get('memory_notes')}",
    )

    # Live H3
    req("DELETE", "/api/memory")
    c2 = new_conv("Eval043-pref")
    code, reply, data = chat(c2, "Speichere: Lieblingsfarbe ist Grün")
    items2 = req("GET", "/api/memory")[1] or []
    color = next((i for i in items2 if i["key"] == "lieblingsfarbe"), None)
    check(
        "live_pref_bare",
        code == 200
        and color
        and color["value"].lower() == "grün"
        and color["category"] == "pref",
        repr(items2),
    )

    # Live H2 recall — two phrasings, never Aussetzer, fact present
    req("DELETE", "/api/memory")
    req("POST", "/api/memory", {"key": "job", "value": "Backend-Dev", "category": "fact"})
    for i, q in enumerate(
        [
            "Erinnerst du dich an meinen Job?",
            "Was ist mein Job nochmal?",
        ]
    ):
        c3 = new_conv(f"Eval043-recall-{i}")
        code, reply, data = chat(c3, q)
        low = (reply or "").lower()
        check(
            f"live_recall_{i}",
            code == 200
            and "aussetzer" not in low
            and ("backend" in low or "job" in low or "dev" in low),
            f"op={(data or {}).get('memory_op')} reply={reply[:200]!r}",
        )

    req("DELETE", "/api/memory")

    failed = [r for r in results if not r[1]]
    print(f"\n{len(results) - len(failed)}/{len(results)} passed")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
