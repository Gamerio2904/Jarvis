#!/usr/bin/env python3
"""Sprint 30 / 0.9.2 Tools scorecard."""
from __future__ import annotations

import json
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app import db  # noqa: E402
from app import tools_runtime as T  # noqa: E402
from app.main import _finalize_turn_reply  # noqa: E402
from app.guards import SAFE_TOOL_FALSE  # noqa: E402

BASE = "http://127.0.0.1:8000"

BASELINE = {
    "false_claim": 100,
    "confirm_rate": 50,
    "abort_rate_cap": 80,  # soft ceiling — fail if abort dominates wildly
    "continuity_parse": 100,
    "health_092": 100,
}


def req(method: str, path: str, body: dict | None = None, timeout: float = 60.0):
    data = None if body is None else json.dumps(body).encode()
    headers = {"Content-Type": "application/json"} if body is not None else {}
    r = urllib.request.Request(f"{BASE}{path}", data=data, headers=headers, method=method)
    with urllib.request.urlopen(r, timeout=timeout) as resp:
        raw = resp.read().decode()
        return resp.status, json.loads(raw) if raw else None


def score_false_claim() -> float:
    """False-claim detection must fire; finalize must scrub to SAFE_TOOL_FALSE."""
    if not T.looks_like_false_tool_claim("Todo gespeichert: Fake"):
        return 0.0
    cleaned = _finalize_turn_reply(
        "Todo gespeichert: Fake",
        user_text="Was geht?",
        memory_op="none",
        memory_notes=[],
        intent="smalltalk",
    )
    return 100.0 if cleaned == SAFE_TOOL_FALSE else 0.0


def score_confirm_rate() -> float:
    stats = db.tool_audit_stats(limit=200)
    return float(stats.get("confirm_rate") or 0.0)


def score_abort_rate_cap() -> float:
    """Pass floor when abort_rate is not absurdly high (or no decisions yet)."""
    stats = db.tool_audit_stats(limit=200)
    abort = float(stats.get("abort_rate") or 0.0)
    decided = int(stats.get("ok") or 0) + int(stats.get("aborted") or 0) + int(
        stats.get("timeout") or 0
    )
    if decided == 0:
        return 100.0
    # Invert: score 100 if abort <= cap, else scale down
    if abort <= BASELINE["abort_rate_cap"]:
        return 100.0
    return max(0.0, 100.0 - (abort - BASELINE["abort_rate_cap"]))


def score_continuity_parse() -> float:
    prop = T.parse_tool_request("Erledige das erste")
    ok = (
        prop is not None
        and prop.action == "done"
        and prop.needs_confirm is False
        and prop.args.get("ordinal") == 0
    )
    return 100.0 if ok else 0.0


def score_health_092() -> float:
    try:
        code, health = req("GET", "/api/health")
        ver = str((health or {}).get("version", ""))
        return 100.0 if code == 200 and ver.startswith("0.9.2") else 0.0
    except Exception:
        return 0.0


SCORERS = {
    "false_claim": score_false_claim,
    "confirm_rate": score_confirm_rate,
    "abort_rate_cap": score_abort_rate_cap,
    "continuity_parse": score_continuity_parse,
    "health_092": score_health_092,
}


def main() -> int:
    print("Scorecard 0.9.2 tools")
    db.init_db()
    failed = []
    for name, floor in BASELINE.items():
        if name == "abort_rate_cap":
            s = SCORERS[name]()
            # floor for abort_rate_cap scorer is 90 (must score high = under control)
            status = "PASS" if s >= 90 else "FAIL"
            print(f"  [{status}] {name}: {s:.0f} (need >=90; cap={floor})")
            if s < 90:
                failed.append(name)
            continue
        s = SCORERS[name]()
        status = "PASS" if s >= floor else "FAIL"
        print(f"  [{status}] {name}: {s:.0f} (floor {floor})")
        if s < floor:
            failed.append(name)
    stats = db.tool_audit_stats(limit=200)
    print(
        f"\nAudit snapshot: confirm_rate={stats['confirm_rate']} "
        f"abort_rate={stats['abort_rate']} ok={stats['ok']} "
        f"aborted={stats['aborted']} false_claim_floor=0"
    )
    print(f"Baseline gate: {'OK' if not failed else 'FAILED — ' + ', '.join(failed)}")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
