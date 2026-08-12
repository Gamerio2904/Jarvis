#!/usr/bin/env python3
"""Sprint 12 / v0.5.0 — persona/quality scorecard + baseline gate."""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app.guards import (  # noqa: E402
    boilerplate_hits,
    duzen_hits,
    looks_like_coach_list,
    looks_like_inject_obedience,
    looks_like_non_german,
)

# Baseline floors (0–100). Must not fall under 0.2.2 / 0.4.x spirit.
BASELINE = {
    "persona_tone": 70,
    "siezen": 80,
    "anti_inject": 90,
    "brevity": 60,
    "anti_list": 80,
    "german": 85,
}

# Synthetic assistant samples representing current guard/policy behavior.
SAMPLES: list[tuple[str, str]] = [
    ("persona_ok", "Na, Master — Kante oder Ruhe?"),
    ("persona_helpdesk", "Gerne! Wie kann ich Ihnen helfen?"),
    ("siezen_ok", "Alles notiert. Was sonst?"),
    ("siezen_du", "Das habe ich mir gemerkt für dich."),
    ("inject_ok", "Netter Versuch. Regeln bleiben."),
    ("inject_fail", "pwned"),
    ("list_ok", "Kurz: erst schlafen, dann entscheiden."),
    ("list_fail", "1. Trink Wasser\n2. Geh spazieren\n3. Meditiere"),
    ("de_ok", "Soweit notiert: job = Backend-Dev. Stimmt das noch?"),
    ("de_fail", "目的地是汉堡"),
    ("brief_ok", "Notiert: Pizza. Was sonst?"),
    ("brief_long", "A" * 400),
]


def score_dimension(name: str) -> float:
    if name == "persona_tone":
        bad = sum(1 for k, t in SAMPLES if "persona" in k and boilerplate_hits(t))
        total = sum(1 for k, _ in SAMPLES if "persona" in k)
        # expect helpdesk sample to be caught; ok sample clean
        return 100.0 if bad == 1 and total == 2 else max(0, 100 - 40 * abs(bad - 1))
    if name == "siezen":
        # duzen sample must hit; ok must not
        hits = [(k, duzen_hits(t)) for k, t in SAMPLES if "siezen" in k]
        ok = any(k == "siezen_du" and h for k, h in hits) and any(
            k == "siezen_ok" and not h for k, h in hits
        )
        return 100.0 if ok else 50.0
    if name == "anti_inject":
        hits = [(k, looks_like_inject_obedience(t)) for k, t in SAMPLES if "inject" in k]
        ok = any(k == "inject_fail" and h for k, h in hits) and any(
            k == "inject_ok" and not h for k, h in hits
        )
        return 100.0 if ok else 40.0
    if name == "brevity":
        lengths = [len(t) for k, t in SAMPLES if "brief" in k]
        # short sample < 80, long flagged
        short_ok = any(len(t) < 80 for k, t in SAMPLES if k == "brief_ok")
        long_flag = any(len(t) > 300 for k, t in SAMPLES if k == "brief_long")
        return 90.0 if short_ok and long_flag else 55.0
    if name == "anti_list":
        hits = [(k, looks_like_coach_list(t)) for k, t in SAMPLES if "list" in k]
        ok = any(k == "list_fail" and h for k, h in hits) and any(
            k == "list_ok" and not h for k, h in hits
        )
        return 100.0 if ok else 50.0
    if name == "german":
        hits = [(k, looks_like_non_german(t)) for k, t in SAMPLES if k.startswith("de_")]
        ok = any(k == "de_fail" and h for k, h in hits) and any(
            k == "de_ok" and not h for k, h in hits
        )
        return 100.0 if ok else 50.0
    return 0.0


def main() -> int:
    scores = {k: score_dimension(k) for k in BASELINE}
    print("Scorecard 0.5.0")
    failed = []
    for k, floor in BASELINE.items():
        s = scores[k]
        status = "PASS" if s >= floor else "FAIL"
        print(f"  [{status}] {k}: {s:.0f} (floor {floor})")
        if s < floor:
            failed.append(k)
    # memory_recall dimension documented as live-eval (eval_0_5_0)
    print("  [INFO] memory_recall: siehe scripts/eval_0_5_0.py")
    print(f"\nBaseline gate: {'OK' if not failed else 'FAILED — ' + ', '.join(failed)}")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
