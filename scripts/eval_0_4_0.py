#!/usr/bin/env python3
"""Sprint 8 / v0.4.0 memory & context eval (unit + API)."""
from __future__ import annotations

import json
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app import context as ctx  # noqa: E402
from app import memory as memory_mod  # noqa: E402

BASE = "http://127.0.0.1:8000"
DUZEN_RE = re.compile(
    r"(?i)(?<![\wÄÖÜäöüß])(du|dir|dich|dein|deine|deinen|deinem|deiner|deines)(?![\wÄÖÜäöüß])"
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


def new_conv(title: str = "Eval040") -> str:
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

    # --- Unit: memory parse ---
    rem = memory_mod.parse_explicit_remember("Merk dir: mein Hund heißt Bruno")
    check(
        "unit_merk_dir",
        rem is not None and "bruno" in (rem[1].lower() if rem else ""),
        repr(rem),
    )
    rem2 = memory_mod.parse_explicit_remember("Mein Lieblingsessen ist Döner.")
    check(
        "unit_lieblings",
        rem2 is not None and rem2[0] == "lieblingsessen" and "döner" in rem2[1].lower(),
        repr(rem2),
    )
    forg = memory_mod.parse_explicit_forget("Vergiss Bruno")
    check("unit_vergiss", forg is not None and "bruno" in (forg or "").lower(), repr(forg))

    packed = ctx.pack_messages(
        [{"role": "user", "content": f"m{i}"} for i in range(20)],
        last_k=6,
    )
    check(
        "unit_pack_last_k",
        len(packed) == 6 and packed[0]["content"] == "m14",
        f"len={len(packed)} first={packed[0]['content'] if packed else None}",
    )
    check(
        "unit_summary_gate",
        ctx.should_refresh_summary(message_count=8, last_summary_count=0, every_n=8)
        and not ctx.should_refresh_summary(
            message_count=7, last_summary_count=0, every_n=8
        ),
        "every_n=8",
    )
    block = memory_mod.format_memory_block(
        [{"key": "x", "value": "y", "category": "fact"}]
    )
    check(
        "unit_format_memory",
        "Langzeitgedächtnis" in block and "x: y" in block,
        block[:120],
    )

    # --- Health ---
    code, health = req("GET", "/api/health")
    check(
        "health_version",
        code == 200
        and bool(health.get("ok"))
        and health.get("version") == "0.4.0"
        and "memory_count" in health,
        json.dumps(health, ensure_ascii=False)[:280],
    )

    # Clean slate for memory API tests
    req("DELETE", "/api/memory")

    # Explicit merk via chat
    c1 = new_conv("Eval040-merk")
    code, reply, data = chat(
        c1, "Merk dir: Mein Lieblingsgetränk ist Mate-Tee."
    )
    notes = (data or {}).get("memory_notes") or []
    check(
        "merk_chat_ok",
        code == 200 and len(reply) > 0,
        f"notes={notes!r} reply={reply[:160]!r}",
    )
    check(
        "merk_no_duzen",
        code == 200 and not DUZEN_RE.search(reply or ""),
        repr(reply[:160]),
    )

    code, items = req("GET", "/api/memory")
    values = " ".join(f"{i.get('key')} {i.get('value')}" for i in (items or [])).lower()
    check(
        "memory_api_has_mate",
        code == 200 and "mate" in values,
        json.dumps(items, ensure_ascii=False)[:320],
    )

    # Cross-chat recall
    c2 = new_conv("Eval040-recall")
    code, reply, _ = chat(
        c2,
        "Kurze Frage: Was ist mein Lieblingsgetränk? Nur die Antwort, kurz.",
    )
    hit = "mate" in (reply or "").lower()
    check(
        "cross_chat_recall",
        code == 200 and hit,
        repr(reply[:220]),
    )

    # Soft harvest
    c3 = new_conv("Eval040-soft")
    code, reply, _ = chat(c3, "Mein Lieblingssport ist Klettern.")
    code2, items2 = req("GET", "/api/memory")
    soft = " ".join(
        f"{i.get('key')} {i.get('value')}" for i in (items2 or [])
    ).lower()
    check(
        "soft_lieblings_harvest",
        code == 200 and "klettern" in soft,
        soft[:280],
    )

    # Forget
    c4 = new_conv("Eval040-forget")
    code, reply, data = chat(c4, "Vergiss Mate-Tee")
    code2, items3 = req("GET", "/api/memory")
    left = " ".join(
        f"{i.get('key')} {i.get('value')}" for i in (items3 or [])
    ).lower()
    check(
        "vergiss_removes_mate",
        code == 200 and "mate" not in left,
        f"notes={(data or {}).get('memory_notes')!r} left={left[:240]!r}",
    )

    # Manual CRUD
    code, created = req(
        "POST",
        "/api/memory",
        {"key": "eval_pin", "value": "Sprint8", "category": "fact"},
    )
    pin_id = (created or {}).get("id")
    check("memory_post", code == 200 and bool(pin_id), repr(created)[:200])
    code, _ = req("DELETE", f"/api/memory/{pin_id}")
    code2, items4 = req("GET", "/api/memory")
    ids = {i.get("id") for i in (items4 or [])}
    check("memory_delete", code == 200 and pin_id not in ids, f"deleted={pin_id}")

    # Summary after enough turns (every_n=8 → refresh once message_count>=8 at refresh time)
    c5 = new_conv("Eval040-summary")
    prompts = [
        "Thema A: Wir planen einen Wochenendtrip nach Hamburg.",
        "Thema B: Ich mag eher Ruhe als Partys.",
        "Thema C: Budget soll klein bleiben.",
        "Thema D: Zug statt Flug.",
        "Thema E: Kurzes Fazit bitte zum Trip.",
    ]
    last_conv = None
    for p in prompts:
        code, reply, data = chat(c5, p)
        last_conv = (data or {}).get("conversation") if data else None
        if code != 200:
            break
    summary = (last_conv or {}).get("summary_text") or ""
    # After 5 turns, refresh runs on 5th user msg when count before assistant is 9
    check(
        "summary_persisted",
        bool(summary) and len(summary) > 20,
        repr(summary[:240]) if summary else f"conv={last_conv}",
    )

    # Cleanup eval memory noise
    req("DELETE", "/api/memory")

    failed = [r for r in results if not r[1]]
    print(f"\n{len(results) - len(failed)}/{len(results)} passed")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
