#!/usr/bin/env python3
"""Sprint 26 / v0.8.4 Siezen & Recall Hotfix eval."""
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
from app import router as R  # noqa: E402

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


def chat(content: str, title: str = "E084", cid: str | None = None):
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
    check("health_084", code == 200 and ver.startswith("0.8.4"), ver)

    # P1/P2 unit: broken Siezen detection + soften
    samples = [
        ("Möchtest Sie Tee?", "möchten sie"),
        ("Wie schaffst Sie's?", "schaffen sie"),
        ("Bleibst Sie ruhig.", "bleiben sie"),
        ("Sie haben Sie Nora", "sie sind"),
        ("Ruh Sie sich aus.", "ruhen sie"),
    ]
    for raw, needle in samples:
        check(f"unit_broken_{needle[:12]}", G.looks_like_broken_siezen(raw), raw)
        soft = G.soften_duzen(raw)
        check(
            f"unit_soften_{needle[:12]}",
            needle in soft.lower() and not G.looks_like_broken_siezen(soft),
            soft,
        )

    # P7: Kumpel scrub
    soft_k = G.soften_duzen("Na Kumpel, alles klar?")
    check("unit_no_kumpel", "kumpel" not in soft_k.lower(), soft_k)

    # P3: identity recall → one name (prefer key=name over vorname)
    db.upsert_memory_item(key="vorname", value="Nora", category="fact", confidence=0.99)
    db.upsert_memory_item(key="name", value="Klaus", category="fact", confidence=0.9)
    hits = M.retrieve_relevant("Wie heiße ich?", min_confidence=0.0)
    vals = [str(h.get("value") or "") for h in hits]
    check(
        "unit_identity_one_name",
        len(hits) == 1 and "Klaus" in vals[0] and "Nora" not in " ".join(vals),
        str([(h.get("key"), h.get("value")) for h in hits]),
    )

    # P4: CJK + planish → task
    cjk = "1. 搬家 2. 打包 — mach einen Plan"
    route = R.classify(cjk)
    check("unit_cjk_planish_task", route.intent == "task", f"{route.intent}/{route.reason}")
    cjk2 = "帮我做一个搬家计划"
    route2 = R.classify(cjk2)
    check("unit_cjk_计划_task", route2.intent == "task", f"{route2.intent}/{route2.reason}")

    # Live: identity recall mentions Klaus not Nora
    cid = req("POST", "/api/conversations", {"title": "E084-id"})[1]["id"]
    chat("Merk dir: Ich heiße Klaus.", cid=cid)
    code, reply, data, _ = chat("Wie heiße ich?", cid=cid)
    low = reply.lower()
    check(
        "live_identity_klaus",
        code == 200 and "klaus" in low and "nora" not in low and not G.looks_like_broken_siezen(reply),
        reply[:180],
    )

    # Live: greeting without broken Siezen
    code, reply, _, _ = chat("Hallo Jarvis", title="E084-hi")
    check(
        "live_greeting_siezen",
        code == 200 and not G.looks_like_broken_siezen(reply) and "möchtest sie" not in reply.lower(),
        reply[:160],
    )

    # Live: CJK planish not SAFE_SMALLTALK
    code, reply, data, _ = chat(cjk, title="E084-cjk")
    route_live = (data or {}).get("route") or {}
    check(
        "live_cjk_not_smalltalk_canned",
        code == 200
        and reply.strip() != G.SAFE_SMALLTALK
        and (route_live.get("intent") == "task" or "plan" in reply.lower() or reply.strip() == G.SAFE_TASK),
        f"route={route_live} reply={reply[:140]}",
    )

    failed = [r for r in results if not r[1]]
    print(f"\n{len(results) - len(failed)}/{len(results)} passed")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
