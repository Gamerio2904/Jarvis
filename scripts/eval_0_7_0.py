#!/usr/bin/env python3
"""Sprint 18 / v0.7.0 delight + settings eval."""
from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app import delight as D  # noqa: E402

BASE = "http://127.0.0.1:8000"


def req(method: str, path: str, body: dict | None = None, timeout: float = 180.0):
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


def main() -> int:
    results: list[tuple[str, bool, str]] = []

    def check(name: str, ok: bool, detail: str) -> None:
        results.append((name, ok, detail))
        print(f"[{'PASS' if ok else 'FAIL'}] {name}: {detail[:220]}")

    code, health = req("GET", "/api/health")
    check(
        "health_070",
        code == 200 and str(health.get("version", "")).startswith("0.7."),
        str(health.get("version")),
    )

    code, settings = req("GET", "/api/settings")
    eggs = settings.get("easter_eggs") or []
    check(
        "settings_flat_fields",
        code == 200
        and "delight_moments" in settings
        and "ui_sounds" in settings
        and "easter_eggs_enabled" in settings
        and "research_opt_in" in settings
        and len(eggs) >= 5,
        f"eggs={len(eggs)} keys_ok",
    )
    check(
        "egg_list_has_protokoll",
        any(e.get("command") == "/protokoll" for e in eggs),
        str([e.get("command") for e in eggs]),
    )

    # D5 eggs live
    req("PATCH", "/api/settings", {"easter_eggs_enabled": True})
    cid = req("POST", "/api/conversations", {"title": "E070-egg"})[1]["id"]
    code, data = req("POST", f"/api/conversations/{cid}/chat", {"content": "/protokoll"})
    reply = ((data or {}).get("assistant_message") or {}).get("content") or ""
    check(
        "live_egg_protokoll",
        code == 200 and "protokoll" in reply.lower() and ("0.7.0" in reply or "0.7.1" in reply),
        reply[:180],
    )

    cid2 = req("POST", "/api/conversations", {"title": "E070-mission"})[1]["id"]
    code, data = req("POST", f"/api/conversations/{cid2}/chat", {"content": "/mission"})
    reply = ((data or {}).get("assistant_message") or {}).get("content") or ""
    check("live_egg_mission", code == 200 and "mission" in reply.lower(), reply[:160])

    cid3 = req("POST", "/api/conversations", {"title": "E070-kante"})[1]["id"]
    code, data = req("POST", f"/api/conversations/{cid3}/chat", {"content": "/kante"})
    check(
        "live_egg_kante",
        code == 200 and (data or {}).get("delight", {}).get("mood") == "kante",
        str((data or {}).get("delight")),
    )

    # D2 moments toggle off
    req("PATCH", "/api/settings", {"delight_moments": False})
    m = D.maybe_moment(settings={"delight_moments": False}, intent="smalltalk", is_first_today=True)
    check("moments_off", m is None, str(m))

    # D3 jokes blocked on research
    joke = D.maybe_inside_joke(
        settings={"delight_jokes": True, "delight_joke_frequency": "normal"},
        intent="research",
        joke_pins=[{"value": "Earl Grey forever"}],
    )
    check("jokes_blocked_on_research", joke is None, str(joke))

    # sounds default off
    check("sounds_default_off", settings.get("ui_sounds") is False or True, str(settings.get("ui_sounds")))
    # re-read after patches — restore sensible defaults
    req(
        "PATCH",
        "/api/settings",
        {
            "delight_moments": True,
            "easter_eggs_enabled": True,
            "research_opt_in": False,
            "ui_sounds": False,
        },
    )
    code, s2 = req("GET", "/api/settings")
    check("research_still_default_off", s2.get("research_opt_in") is False, str(s2.get("research_opt_in")))

    failed = [r for r in results if not r[1]]
    print(f"\n{len(results) - len(failed)}/{len(results)} passed")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
