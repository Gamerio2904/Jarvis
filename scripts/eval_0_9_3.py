#!/usr/bin/env python3
"""Sprint 31 / v0.9.3 Memory Quality Hotfix eval."""
from __future__ import annotations

import json
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app import db  # noqa: E402
from app import memory as M  # noqa: E402

BASE = "http://127.0.0.1:8000"


def req(method: str, path: str, body: dict | None = None, timeout: float = 300.0):
    data = None if body is None else json.dumps(body).encode()
    headers = {"Content-Type": "application/json"} if body is not None else {}
    r = urllib.request.Request(f"{BASE}{path}", data=data, headers=headers, method=method)
    with urllib.request.urlopen(r, timeout=timeout) as resp:
        raw = resp.read().decode()
        return resp.status, json.loads(raw) if raw else None


def chat(content: str, cid: str | None = None, title: str = "E093"):
    if cid is None:
        cid = req("POST", "/api/conversations", {"title": title})[1]["id"]
    code, data = req("POST", f"/api/conversations/{cid}/chat", {"content": content})
    reply = ((data or {}).get("assistant_message") or {}).get("content") or ""
    return code, reply, data or {}, cid


def main() -> int:
    results = []

    def check(name: str, ok: bool, detail: str) -> None:
        results.append((name, ok, detail))
        print(f"[{'PASS' if ok else 'FAIL'}] {name}: {detail[:220]}")

    db.init_db()
    code, health = req("GET", "/api/health")
    ver = str((health or {}).get("version", ""))
    check("health_093", code == 200 and ver.startswith("0.9.3"), ver)

    # Unit: forget normalize
    check(
        "unit_forget_norm",
        M.normalize_forget_query("die Erinnerung an Pizza") == "Pizza",
        M.normalize_forget_query("die Erinnerung an Pizza"),
    )

    # Unit: unique keys for empty/stopword payloads
    k1 = M._key_from_payload("!!!")
    k2 = M._key_from_payload("???")
    check(
        "unit_notiz_unique",
        k1 != k2 and k1.startswith("notiz_") and k2.startswith("notiz_"),
        f"{k1} / {k2}",
    )

    # Soft name without merk dir
    for it in list(db.list_memory_items(limit=50)):
        if str(it.get("key")) == "name" and "Anna" in str(it.get("value")):
            db.delete_memory_item(it["id"])
    cid = req("POST", "/api/conversations", {"title": "soft-name"})[1]["id"]
    code, reply, data, _ = chat("Ich heiße Anna", cid=cid)
    # confirm soft if asked
    if "merken" in reply.lower() or "notiert" in reply.lower():
        chat("Ja", cid=cid)
    items = db.list_memory_items(limit=40)
    has_anna = any(
        str(i.get("key")) == "name" and "Anna" in str(i.get("value")) for i in items
    )
    check("live_soft_name", has_anna, f"reply={reply[:80]} items={[ (i['key'], i['value']) for i in items[:8] ]}")

    # Multi merke dir without overwrite
    cid = req("POST", "/api/conversations", {"title": "multi"})[1]["id"]
    chat("Merk dir: AlphaNotiz093 bitte behalten", cid=cid)
    chat("Merk dir: BetaNotiz093 auch behalten", cid=cid)
    vals = " ".join(str(i.get("value")) for i in db.list_memory_items(limit=80))
    check(
        "live_multi_notiz",
        "AlphaNotiz093" in vals and "BetaNotiz093" in vals,
        vals[:200],
    )

    # Forget by erinnerung an
    db.upsert_memory_item(
        key="lieblingsessen",
        value="Pizza",
        category="pref",
        confidence=0.95,
        source_conversation_id=cid,
    )
    cid = req("POST", "/api/conversations", {"title": "forget"})[1]["id"]
    code, reply, _, _ = chat("Vergiss die Erinnerung an Pizza", cid=cid)
    left = [
        i
        for i in db.list_memory_items(limit=80)
        if "pizza" in str(i.get("value") or "").lower()
        or "pizza" in str(i.get("key") or "").lower()
    ]
    check(
        "live_forget_pizza",
        code == 200 and not left and ("raus" in reply.lower() or "gelöscht" in reply.lower() or "weg" in reply.lower()),
        f"left={left} {reply[:100]}",
    )

    # Multi-fact one sentence
    many = M.parse_explicit_remember_many(
        "Merk dir: Ich heiße Tim und trinke gern Rooibos"
    )
    keys = {k for k, _, _ in many}
    check(
        "unit_multifact",
        "name" in keys and ("lieblingstrank" in keys or len(many) >= 2),
        str(many),
    )

    failed = [r for r in results if not r[1]]
    print(f"\n{len(results) - len(failed)}/{len(results)} passed")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
