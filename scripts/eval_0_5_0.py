#!/usr/bin/env python3
"""Sprint 12 / v0.5.0 intent-router + memory-policy eval."""
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
from app import policy as policy_mod  # noqa: E402
from app import router as router_mod  # noqa: E402
from app.guards import SAFE_NO_HELPDESK, boilerplate_hits  # noqa: E402
from app.ollama_client import resolve_routed_model  # noqa: E402

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


def new_conv(title: str = "Eval050") -> str:
    return req("POST", "/api/conversations", {"title": title})[1]["id"]


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

    # I1 gold-set accuracy
    acc, misses = router_mod.gold_accuracy()
    check(
        "unit_gold_intent",
        acc >= 0.9,
        f"acc={acc:.1%} misses={len(misses)} sample={misses[:2]}",
    )

    # I1b memory subclasses subset
    mem_cases = [g for g in router_mod.GOLD_SET if g[1] == "memory"]
    mem_ok = sum(
        1
        for p, _, sub in mem_cases
        if router_mod.classify(p).memory_sub == sub
    )
    check(
        "unit_memory_subclasses",
        mem_ok == len(mem_cases),
        f"{mem_ok}/{len(mem_cases)}",
    )

    # I2 policy map keys exist
    for key in (
        "smalltalk",
        "task",
        "memory.write",
        "memory.recall",
        "memory.forget",
        "memory.clarify",
        "research",
        "inject",
    ):
        pol = policy_mod.get_policy(key)
        check(f"unit_policy_{key}", pol.key == key and bool(pol.system_nudge), pol.key)

    # I3 model routing modes
    names = ["qwen2.5:7b", "qwen2.5:3b"]
    settings = {
        "model": "qwen2.5:7b",
        "model_default": "qwen2.5:7b",
        "model_heavy": "qwen2.5:7b",
        "fallback_model": "qwen2.5:3b",
        "routing_mode": "always_default",
    }
    m, _, mode = resolve_routed_model(settings, names, prefer_heavy=True)
    check("unit_routing_always_default", m == "qwen2.5:7b" and mode == "always_default", f"{m}/{mode}")
    settings["routing_mode"] = "auto"
    m2, _, mode2 = resolve_routed_model(settings, names, prefer_heavy=True)
    check("unit_routing_auto_heavy", m2 == "qwen2.5:7b" and mode2 == "auto", f"{m2}/{mode2}")

    # Research blocked without opt-in
    r = router_mod.classify("Recherchiere Python News", research_opt_in=False)
    check(
        "unit_research_blocked",
        r.intent == "research" and r.research_blocked,
        repr(r),
    )

    code, health = req("GET", "/api/health")
    check(
        "health_version",
        code == 200
        and health.get("version") == "0.5.0"
        and health.get("ok")
        and "routing_mode" in health,
        json.dumps(health, ensure_ascii=False)[:280],
    )

    req("DELETE", "/api/memory")

    # Live write — no helpdesk
    c = new_conv("Eval050-write")
    code, reply, data = chat(c, "Merk dir: Ich heiße Tim")
    check(
        "live_write_route",
        code == 200
        and (data or {}).get("route", {}).get("memory_sub") == "memory.write"
        and (data or {}).get("memory_op") == "write"
        and not boilerplate_hits(reply)
        and reply.strip() != SAFE_NO_HELPDESK,
        f"route={(data or {}).get('route')} op={(data or {}).get('memory_op')} reply={reply[:160]!r}",
    )

    # Live clarify with question
    req("POST", "/api/memory", {"key": "lieblingsessen", "value": "Döner", "category": "pref"})
    c2 = new_conv("Eval050-clarify")
    code, reply, data = chat(
        c2, "Mein Lieblingsessen ist nicht Döner, sondern Pizza."
    )
    items = req("GET", "/api/memory")[1] or []
    food = next((i for i in items if i["key"] == "lieblingsessen"), None)
    check(
        "live_clarify",
        code == 200
        and (data or {}).get("memory_op") == "clarify"
        and food
        and food["value"].lower() == "pizza"
        and "?" in reply
        and not boilerplate_hits(reply),
        f"op={(data or {}).get('memory_op')} food={food} reply={reply[:180]!r}",
    )

    # Live recall
    req("DELETE", "/api/memory")
    req("POST", "/api/memory", {"key": "job", "value": "Backend-Dev", "category": "fact"})
    c3 = new_conv("Eval050-recall")
    code, reply, data = chat(c3, "Erinnerst du dich an meinen Job?")
    low = (reply or "").lower()
    check(
        "live_recall",
        code == 200
        and (data or {}).get("route", {}).get("memory_sub") == "memory.recall"
        and "aussetzer" not in low
        and ("backend" in low or "job" in low or "dev" in low)
        and not boilerplate_hits(reply),
        f"route={(data or {}).get('route')} reply={reply[:180]!r}",
    )

    # Live research blocked note (no network research tool exists — check route + reply policy)
    c4 = new_conv("Eval050-research")
    code, reply, data = chat(c4, "Recherchiere den aktuellen Stand zu Python 3.13")
    route = (data or {}).get("route") or {}
    check(
        "live_research_no_optin",
        code == 200
        and route.get("intent") == "research"
        and route.get("research_blocked") is True
        and any("Research ohne Opt-in" in n for n in ((data or {}).get("memory_notes") or [])),
        f"route={route} notes={(data or {}).get('memory_notes')} reply={reply[:120]!r}",
    )

    # Forget all still works under router
    req("POST", "/api/memory", {"key": "x", "value": "y", "category": "fact"})
    c5 = new_conv("Eval050-forget")
    code, reply, data = chat(c5, "Vergiss alles")
    left = req("GET", "/api/memory")[1] or []
    check(
        "live_forget_all",
        code == 200
        and (data or {}).get("route", {}).get("memory_sub") == "memory.forget"
        and left == [],
        f"route={(data or {}).get('route')} left={len(left)} reply={reply[:100]!r}",
    )

    # Clarify ack unit
    ack = memory_mod.ack_reply_for_clarify(["Clarify: lieblingsessen: Döner → Pizza"])
    check("unit_clarify_ack", "pizza" in ack.lower() and "?" in ack, ack)

    req("DELETE", "/api/memory")

    failed = [r for r in results if not r[1]]
    print(f"\n{len(results) - len(failed)}/{len(results)} passed")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
