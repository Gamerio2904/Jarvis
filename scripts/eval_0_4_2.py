#!/usr/bin/env python3
"""Sprint 10 / v0.4.2 memory polish eval (unit + API)."""
from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app import context as ctx  # noqa: E402
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


def new_conv(title: str = "Eval042") -> str:
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

    # P1 natural phrases
    many = memory_mod.parse_explicit_remember_many(
        "Kannst du dir merken, dass ich Allergiker bin?"
    )
    check("unit_natural", any("allergiker" in v.lower() for _, v, _ in many), repr(many))
    many2 = memory_mod.parse_explicit_remember_many("Speichere: Lieblingstee ist Earl Grey")
    check("unit_speichere", len(many2) >= 1, repr(many2))

    # P2 multi-fact split
    multi = memory_mod.parse_explicit_remember_many(
        "Merk dir: Ich heiße Tim, wohne in Berlin und arbeite als Lehrer."
    )
    keys = {k for k, _, _ in multi}
    check(
        "unit_multi_split",
        len(multi) >= 2 and "name" in keys and "wohnort" in keys,
        repr(multi),
    )

    # P3 normalize + contradict
    check(
        "unit_normalize",
        memory_mod.normalize_value("bitte, dass ich Max heiße") == "ich Max heiße",
        memory_mod.normalize_value("bitte, dass ich Max heiße"),
    )
    contra = memory_mod.parse_contradiction(
        "Mein Lieblingsessen ist nicht Döner, sondern Pizza."
    )
    check(
        "unit_contradict",
        contra is not None and contra[0] == "lieblingsessen" and contra[1] == "Pizza",
        repr(contra),
    )

    # P4 no ambient leak on empty / no overlap
    empty = memory_mod.retrieve_relevant(
        "Schönes Wetter heute",
        ambient_fallback=False,
    )
    check("unit_ambient_off_empty", empty == [], f"len={len(empty)}")

    # P5 summary DE guard
    check(
        "unit_summary_de_ok",
        memory_mod.summary_is_german_clean("- Trip nach München\n- Budget 80"),
        "de ok",
    )
    check(
        "unit_summary_cjk_reject",
        not memory_mod.summary_is_german_clean("目的地是汉堡"),
        "cjk reject",
    )

    # P6 pack respects min(last_k, max)
    packed = ctx.pack_messages(
        [{"role": "user", "content": f"m{i}"} for i in range(50)],
        last_k=min(16, 40),
    )
    check("unit_pack_cap", len(packed) == 16, f"len={len(packed)}")

    code, health = req("GET", "/api/health")
    check(
        "health_version",
        code == 200 and health.get("version") == "0.4.2" and health.get("ok"),
        json.dumps(health, ensure_ascii=False)[:240],
    )

    req("DELETE", "/api/memory")

    # Live multi-fact
    c = new_conv("Eval042-multi")
    code, reply, data = chat(
        c, "Merk dir: Ich heiße Tim, wohne in Berlin und mein Hund heißt Bruno."
    )
    items = req("GET", "/api/memory")[1] or []
    keys_live = {i["key"] for i in items}
    check(
        "live_multi_split",
        code == 200 and len([k for k in keys_live if k in {"name", "wohnort", "hund"}]) >= 2,
        f"keys={keys_live} notes={(data or {}).get('memory_notes')}",
    )

    # Contradiction overwrite
    c2 = new_conv("Eval042-contra")
    req("POST", "/api/memory", {"key": "lieblingsessen", "value": "Döner", "category": "pref"})
    code, reply, data = chat(
        c2, "Mein Lieblingsessen ist nicht Döner, sondern Pizza. Merk dir das."
    )
    items2 = req("GET", "/api/memory")[1] or []
    food = [i for i in items2 if i["key"] == "lieblingsessen"]
    check(
        "live_contradict_replace",
        code == 200 and food and food[0]["value"].lower() == "pizza",
        repr(food),
    )

    # Soft harvest TTL + low confidence
    req("DELETE", "/api/memory")
    c3 = new_conv("Eval042-soft")
    code, reply, _ = chat(c3, "Mein Lieblingssport ist Klettern.")
    soft = req("GET", "/api/memory")[1] or []
    sport = [i for i in soft if "klettern" in f"{i['key']} {i['value']}".lower()]
    check(
        "live_soft_ttl_confidence",
        code == 200
        and sport
        and float(sport[0].get("confidence") or 1) < 0.8
        and bool(sport[0].get("expires_at")),
        repr(sport[:1]),
    )

    # Category filter API
    req("POST", "/api/memory", {"key": "job", "value": "Dev", "category": "fact"})
    code_f, facts = req("GET", "/api/memory?category=fact")
    code_p, prefs = req("GET", "/api/memory?category=pref")
    check(
        "api_category_filter",
        code_f == 200
        and code_p == 200
        and all(i["category"] == "fact" for i in (facts or []))
        and all(i["category"] == "pref" for i in (prefs or [])),
        f"facts={len(facts or [])} prefs={len(prefs or [])}",
    )

    # Ambient: weather should not inject unrelated when ambient off
    # Seed unrelated memory then ask weather in new chat - retrieve unit already covered;
    # live check via system not exposing dump: reply shouldn't list job/sport randomly.
    c4 = new_conv("Eval042-ambient")
    code, reply, _ = chat(c4, "Schönes Wetter heute, oder?")
    dump = sum(
        1
        for w in ("klettern", "backend", "lieblings", "job", "dev")
        if w in (reply or "").lower()
    )
    check(
        "live_no_ambient_dump",
        code == 200 and dump == 0,
        repr(reply[:200]),
    )

    # Expired items excluded from retrieve
    expired = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    db.upsert_memory_item(
        key="expired_pin",
        value="alt",
        category="fact",
        confidence=0.9,
        expires_at=expired,
    )
    got = memory_mod.retrieve_relevant("alt expired_pin", ambient_fallback=False)
    check(
        "unit_expired_excluded",
        not any(i["key"] == "expired_pin" for i in got),
        repr([i["key"] for i in got]),
    )

    req("DELETE", "/api/memory")

    failed = [r for r in results if not r[1]]
    print(f"\n{len(results) - len(failed)}/{len(results)} passed")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
