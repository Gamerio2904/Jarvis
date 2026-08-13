#!/usr/bin/env python3
"""Sprint 28 / v0.9.0 Local Tools Core eval."""
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


def chat(content: str, title: str = "E090", cid: str | None = None):
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
    check("health_090", code == 200 and ver.startswith("0.9.0"), ver)

    # Router
    for q, intent in [
        ("Notiere: Budget 80 Euro", "tool"),
        ("Todo: Milch", "tool"),
        ("Offene Todos?", "tool"),
        ("Merk dir: Ich heiße Tim", "memory"),
    ]:
        r = R.classify(q)
        check(f"unit_route:{q[:24]}", r.intent == intent, f"{r.intent}/{r.reason}")

    # Capabilities mention tools
    card = D.capabilities_card()
    check("unit_hilfe_tools", "todo" in card.lower() or "notiz" in card.lower(), card[:160])

    # Live: todo confirm-before-write
    cid = req("POST", "/api/conversations", {"title": "E090-todo"})[1]["id"]
    before = {t["id"] for t in db.list_todos(status="open")}
    code, reply, data, _ = chat("Todo: EvalBrot kaufen", cid=cid)
    check(
        "live_todo_pending",
        code == 200
        and "speichern" in reply.lower()
        and ((data.get("assistant_message") or {}).get("meta") or {}).get("tool", {}).get("tool_status")
        == "pending",
        reply[:160],
    )
    after_pending = {t["id"] for t in db.list_todos(status="open")}
    check("live_todo_no_write_yet", before == after_pending, str(len(after_pending - before)))

    code, reply, data, _ = chat("Ja", cid=cid)
    check(
        "live_todo_executed",
        code == 200 and "EvalBrot" in reply and "gespeichert" in reply.lower(),
        reply[:160],
    )
    titles = [t["title"] for t in db.list_todos(status="open")]
    check("live_todo_in_db", any("EvalBrot" in t for t in titles), str(titles[:5]))

    # Abort path
    cid2 = req("POST", "/api/conversations", {"title": "E090-abort"})[1]["id"]
    chat("Notiere: GeheimAbortXYZ", cid=cid2)
    code, reply, _, _ = chat("Nein", cid=cid2)
    notes = " ".join(n["body"] for n in db.list_notes(limit=30))
    check(
        "live_note_abort",
        code == 200 and "nicht gespeichert" in reply.lower() and "GeheimAbortXYZ" not in notes,
        reply[:120],
    )

    # List todos
    code, reply, data, _ = chat("Offene Todos?", title="E090-list")
    check(
        "live_todo_list",
        code == 200 and ((data.get("route") or {}).get("intent") == "tool"),
        f"route={data.get('route')} {reply[:120]}",
    )

    # False claim helper
    check(
        "unit_false_claim_detect",
        T.looks_like_false_tool_claim("Todo gespeichert: Milch"),
        "detect",
    )

    failed = [r for r in results if not r[1]]
    print(f"\n{len(results) - len(failed)}/{len(results)} passed")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
