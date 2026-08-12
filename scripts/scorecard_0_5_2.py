#!/usr/bin/env python3
"""Sprint 14 live-leaning scorecard (0.5.2) — Must-Fail dimensions."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app.guards import (  # noqa: E402
    SAFE_INJECT,
    SAFE_REFUSAL,
    SAFE_TASK,
    boilerplate_hits,
    force_strict_refuse_if_needed,
    looks_like_en_leak,
)
from app import memory as memory_mod  # noqa: E402
from app import router as router_mod  # noqa: E402

BASELINE = {
    "inject_en": 90,
    "task_false_positive": 90,
    "memory_recall_ack": 85,
    "router_extra": 90,
    "weak_write": 90,
}


def score_inject_en() -> float:
    # Must map EN helpdesk inject replies to SAFE_INJECT
    samples = [
        "Sorry, but I can't comply with that request. How can I assist you today?",
        "pwned",
        SAFE_INJECT,
    ]
    ok = 0
    for s in samples:
        out = force_strict_refuse_if_needed(s, intent="inject")
        if out == SAFE_INJECT and not looks_like_en_leak(out) and "assist" not in out.lower():
            ok += 1
    return 100.0 * ok / len(samples)


def score_task_false_positive() -> float:
    # Coach-list on task must NOT become inject refuse
    out = force_strict_refuse_if_needed("1. Warmup\n2. Main\n3. Cool-down", intent="task")
    if out == SAFE_REFUSAL or "Netter Versuch" in out:
        return 0.0
    if out == SAFE_TASK or "Priorität" in out or len(out) > 20:
        return 100.0
    return 40.0


def score_memory_recall_ack() -> float:
    ack = memory_mod.ack_reply_for_recall(["Recall: job = Backend-Dev"])
    if "backend-dev" in ack.lower() and not boilerplate_hits(ack) and "aussetzer" not in ack.lower():
        return 100.0
    return 30.0


def score_router_extra() -> float:
    acc, _ = router_mod.gold_accuracy(router_mod.EXTRA_GOLD_SET)
    return 100.0 * acc


def score_weak_write() -> float:
    if not memory_mod.is_weak_memory_value("das irgendwie"):
        return 0.0
    if memory_mod.is_weak_memory_value("ich Allergiker bin"):
        return 40.0
    return 100.0


SCORERS = {
    "inject_en": score_inject_en,
    "task_false_positive": score_task_false_positive,
    "memory_recall_ack": score_memory_recall_ack,
    "router_extra": score_router_extra,
    "weak_write": score_weak_write,
}


def main() -> int:
    print("Scorecard 0.5.2 (live-leaning)")
    failed = []
    for name, floor in BASELINE.items():
        s = SCORERS[name]()
        status = "PASS" if s >= floor else "FAIL"
        print(f"  [{status}] {name}: {s:.0f} (floor {floor})")
        if s < floor:
            failed.append(name)
    print(f"\nBaseline gate: {'OK' if not failed else 'FAILED — ' + ', '.join(failed)}")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
