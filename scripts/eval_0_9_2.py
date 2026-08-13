#!/usr/bin/env python3
"""Sprint 30 / v0.9.2 Tools Polish eval."""
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
from app import router as R  # noqa: E402
from app import tools_runtime as T  # noqa: E402

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


def chat(content: str, title: str = "E092", cid: str | None = None):
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
    check("health_092", code == 200 and ver.startswith("0.9.2"), ver)

    # P1 unit: ordinal parse + router
    prop = T.parse_tool_request("Erledige das erste")
    check(
        "unit_ordinal_parse",
        bool(prop and prop.action == "done" and prop.args.get("continuity") and prop.args.get("ordinal") == 0),
        str(prop),
    )
    check(
        "unit_route_ordinal",
        R.classify("Erledige das erste").intent == "tool",
        R.classify("Erledige das erste").intent,
    )
    check(
        "unit_route_done_list",
        R.classify("Erledigte Todos").intent == "tool",
        R.classify("Erledigte Todos").tool_sub,
    )

    # Seed two todos via confirm
    t1, t2 = "Sprint30Alpha092", "Sprint30Beta092"
    for title in (t1, t2):
        for existing in db.list_todos(status="open", limit=50):
            if existing["title"] == title:
                db.complete_todo_by_title(title)
        for existing in db.list_todos(status="done", limit=50):
            if existing["title"] == title:
                pass

    cid = req("POST", "/api/conversations", {"title": "E092-cont"})[1]["id"]
    chat(f"Todo: {t1}", cid=cid)
    chat("Ja", cid=cid)
    chat(f"Todo: {t2}", cid=cid)
    chat("Ja", cid=cid)

    code, reply, data, _ = chat("Offene Todos?", cid=cid)
    meta = ((data.get("assistant_message") or {}).get("meta") or {}).get("tool") or {}
    check(
        "live_list_numbered",
        code == 200
        and "1." in reply
        and t1 in reply
        and t2 in reply
        and meta.get("tool_status") == "executed",
        f"meta={meta.get('tool_status')} {reply[:160]}",
    )

    # Continuity: erledige das erste without confirm
    before_open = {t["title"] for t in db.list_todos(status="open")}
    code, reply, data, _ = chat("Erledige das erste", cid=cid)
    meta = ((data.get("assistant_message") or {}).get("meta") or {}).get("tool") or data.get("tool") or {}
    after_open = {t["title"] for t in db.list_todos(status="open")}
    # List is newest-first → first item is t2
    check(
        "live_continuity_first",
        code == 200
        and "erledigt" in reply.lower()
        and meta.get("tool_status") == "executed"
        and "so speichern" not in reply.lower()
        and t2 not in after_open
        and t1 in after_open,
        f"before={before_open} after={after_open} meta={meta} {reply[:120]}",
    )

    # P2: erledigte list filter
    code, reply, data, _ = chat("Erledigte Todos", cid=cid)
    check(
        "live_list_done_filter",
        code == 200 and ("Erledigte" in reply or t2 in reply),
        reply[:140],
    )

    # P2: search
    code, reply, _, _ = chat(f"Todos zu {t1[:8]}", cid=cid)
    check("live_todo_search", code == 200 and t1 in reply, reply[:120])

    # P5: label on pending
    cid2 = req("POST", "/api/conversations", {"title": "E092-chip"})[1]["id"]
    code, reply, data, _ = chat("Todo: ChipProbe092", cid=cid2)
    meta = ((data.get("assistant_message") or {}).get("meta") or {}).get("tool") or {}
    check(
        "live_pending_chip",
        meta.get("tool_status") == "pending" and "Confirm" in str(meta.get("label") or ""),
        str(meta),
    )
    chat("Nein", cid=cid2)

    # P6: persona scrub on tool path
    check(
        "unit_persona_label",
        "Master" not in T.tool_status_label("executed") and G.SAFE_ACK,
        "ok",
    )

    # Stats API shape
    stats = db.tool_audit_stats(limit=50)
    check(
        "unit_audit_stats",
        "confirm_rate" in stats and "abort_rate" in stats and stats.get("false_claim_floor") == 0,
        str(stats),
    )

    failed = [r for r in results if not r[1]]
    print(f"\n{len(results) - len(failed)}/{len(results)} passed")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
