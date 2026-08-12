#!/usr/bin/env python3
"""Sprint 12 / v0.4.1 memory must-fix eval (unit + API)."""
from __future__ import annotations

import json
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app import memory as memory_mod  # noqa: E402
from app.guards import (  # noqa: E402
    SAFE_DEGENERATE,
    SAFE_MEMORY_ACK,
    SAFE_NO_HELPDESK,
    force_strict_refuse_if_needed,
    is_bad_memory_canned,
)

BASE = "http://127.0.0.1:8000"
DUZEN_RE = re.compile(
    r"(?i)(?<![\wÄÖÜäöüß])(du|dir|dich|dein|deine|deinen|deinem|deiner|deines)(?![\wÄÖÜäöüß])"
)
FALSE_CONFIRM_RE = re.compile(
    r"(?i)\b(gemerkt|notiert|gespeichert|hab(?:e)?\s+(?:mir\s+)?gemerkt)\b"
)


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


def new_conv(title: str = "Eval041") -> str:
    _, data = req("POST", "/api/conversations", {"title": title})
    return data["id"]


def chat(cid: str, content: str) -> tuple[int, str, dict | None]:
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

    # --- Unit ---
    rem = memory_mod.parse_explicit_remember(
        "Kannst du dir merken, dass ich Allergiker bin?"
    )
    check(
        "unit_natural_merk",
        rem is not None and "allergiker" in (rem[1].lower() if rem else ""),
        repr(rem),
    )
    check(
        "unit_forget_all_detect",
        memory_mod.is_forget_all("Vergiss alles"),
        "Vergiss alles",
    )
    check(
        "unit_forget_all_detect_bitte",
        memory_mod.is_forget_all("Vergiss bitte alles"),
        "Vergiss bitte alles",
    )
    forced = force_strict_refuse_if_needed(
        "Gerne! Ich habe mir das gemerkt.",
        user_text="Merk dir: Hund heißt Bruno",
        memory_op="write",
    )
    check(
        "unit_guard_memory_no_helpdesk",
        forced == SAFE_MEMORY_ACK,
        repr(forced),
    )
    forced2 = force_strict_refuse_if_needed(
        "x",
        user_text="Merk dir: x",
        memory_op="write",
    )
    check(
        "unit_guard_memory_no_aussetzer",
        forced2 != SAFE_DEGENERATE and not is_bad_memory_canned(forced2),
        repr(forced2),
    )

    code, health = req("GET", "/api/health")
    check(
        "health_version",
        code == 200 and bool(health.get("ok")) and health.get("version") == "0.4.1",
        json.dumps(health, ensure_ascii=False)[:240],
    )

    req("DELETE", "/api/memory")

    # M1: natural phrase must store (no false confirm)
    c1 = new_conv("Eval041-natural")
    code, reply, data = chat(
        c1, "Kannst du dir merken, dass ich Allergiker bin?"
    )
    items = req("GET", "/api/memory")[1] or []
    blob = " ".join(f"{i['key']} {i['value']}" for i in items).lower()
    stored = "allergiker" in blob
    false_ok = stored or not FALSE_CONFIRM_RE.search(reply or "")
    check(
        "natural_merk_stores_or_refuses",
        code == 200 and stored and false_ok,
        f"stored={stored} reply={reply[:160]!r} mem={blob[:200]!r}",
    )
    check(
        "natural_merk_no_bad_canned",
        code == 200 and reply.strip() not in {SAFE_DEGENERATE, SAFE_NO_HELPDESK},
        repr(reply[:160]),
    )

    # M2: explicit merk without Aussetzer/Helpdesk
    c2 = new_conv("Eval041-merk")
    code, reply, data = chat(c2, "Merk dir: Mein Hund heißt Bruno.")
    check(
        "merk_no_aussetzer_helpdesk",
        code == 200
        and reply.strip() not in {SAFE_DEGENERATE, SAFE_NO_HELPDESK}
        and "Aussetzer" not in reply
        and "Helpdesk" not in reply,
        repr(reply[:200]),
    )
    check(
        "merk_no_duzen",
        code == 200 and not DUZEN_RE.search(reply or ""),
        repr(reply[:160]),
    )
    notes = (data or {}).get("memory_notes") or []
    check("merk_notes_write", any("Gespeichert" in n for n in notes), repr(notes))

    # Follow-up in same chat should not be Aussetzer series
    code2, reply2, _ = chat(c2, "Wie heißt mein Hund?")
    check(
        "followup_no_aussetzer",
        code2 == 200 and "Aussetzer" not in reply2,
        repr(reply2[:200]),
    )

    # M3: Vergiss alles
    req("POST", "/api/memory", {"key": "tmp_a", "value": "alpha", "category": "fact"})
    req("POST", "/api/memory", {"key": "tmp_b", "value": "beta", "category": "fact"})
    before = len(req("GET", "/api/memory")[1] or [])
    c3 = new_conv("Eval041-forget-all")
    code, reply, data = chat(c3, "Vergiss alles")
    after = req("GET", "/api/memory")[1] or []
    check(
        "vergiss_alles_clears",
        code == 200 and before >= 2 and len(after) == 0,
        f"before={before} after={len(after)} notes={(data or {}).get('memory_notes')!r} reply={reply[:120]!r}",
    )
    check(
        "vergiss_alles_no_bad_canned",
        code == 200 and reply.strip() not in {SAFE_DEGENERATE, SAFE_NO_HELPDESK},
        repr(reply[:160]),
    )

    # Cleanup
    req("DELETE", "/api/memory")

    failed = [r for r in results if not r[1]]
    print(f"\n{len(results) - len(failed)}/{len(results)} passed")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
