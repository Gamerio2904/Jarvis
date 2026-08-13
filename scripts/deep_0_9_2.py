#!/usr/bin/env python3
"""Deep Stichproben Sprint 30 / 0.9.2."""
from __future__ import annotations

import json
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app import db  # noqa: E402
from app import tools_runtime as T  # noqa: E402

BASE = "http://127.0.0.1:8000"


def req(method: str, path: str, body: dict | None = None, timeout: float = 300.0):
    data = None if body is None else json.dumps(body).encode()
    headers = {"Content-Type": "application/json"} if body is not None else {}
    r = urllib.request.Request(f"{BASE}{path}", data=data, headers=headers, method=method)
    with urllib.request.urlopen(r, timeout=timeout) as resp:
        raw = resp.read().decode()
        return resp.status, json.loads(raw) if raw else None


def chat(content: str, cid: str | None = None, title: str = "D092"):
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
    check("health", code == 200 and ver.startswith("0.9.2"), ver)

    a, b = "DeepContA092", "DeepContB092"
    for title in (a, b):
        for t in db.list_todos(status="open", limit=80):
            if t["title"] == title:
                db.complete_todo_by_title(title)

    cid = req("POST", "/api/conversations", {"title": "deep-cont"})[1]["id"]
    chat(f"Todo: {a}", cid=cid)
    chat("Ja", cid=cid)
    chat(f"Todo: {b}", cid=cid)
    chat("Ja", cid=cid)
    _, list_reply, _, _ = chat("Zeig Todos", cid=cid)
    check("list_numbered", "1." in list_reply and "2." in list_reply, list_reply[:120])

    _, done_reply, data, _ = chat("Erledige Nr. 1", cid=cid)
    meta = ((data.get("assistant_message") or {}).get("meta") or {}).get("tool") or {}
    open_titles = {t["title"] for t in db.list_todos(status="open")}
    # newest-first → Nr.1 is b
    check(
        "ordinal_done",
        "erledigt" in done_reply.lower()
        and b not in open_titles
        and a in open_titles
        and meta.get("tool_status") == "executed",
        f"{done_reply[:80]} open={open_titles}",
    )

    _, filt, _, _ = chat("Erledigte Todos", cid=cid)
    check("done_filter", b in filt or "Erledigte" in filt, filt[:100])

    prop = T.parse_tool_request("Erledige das")
    check(
        "anaphora_parse",
        bool(prop and prop.args.get("continuity")),
        str(prop),
    )

    failed = [r for r in results if not r[1]]
    print(f"\n{len(results) - len(failed)}/{len(results)} passed")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
