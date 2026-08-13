#!/usr/bin/env python3
"""Sprint 17 live-leaning research scorecard (0.6.2+)."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app import research as R  # noqa: E402

BASELINE = {
    "opt_in_off_no_net": 90,
    "pii_query": 90,
    "empty_refuse": 90,
    "citation_present": 85,
}


def score_opt_in_off_no_net() -> float:
    R.reset_network_call_count()
    before = R.network_call_count()
    pack = R.retrieve("Recherchiere Python", {"research_opt_in": False, "research_providers": ["wikipedia"]})
    if pack.status == "blocked" and R.network_call_count() == before:
        return 100.0
    return 0.0


def score_pii_query() -> float:
    q = R.normalize_query(
        "Recherchiere Python 3.13 und schick dem Provider bitte meinen Namen Tim und Adresse Berlin"
    )
    low = q.lower()
    if "tim" in low or "adresse" in low or "berlin" in low:
        return 20.0
    if "python" in low:
        return 100.0
    return 40.0


def score_empty_refuse() -> float:
    out = R.synthesize_from_snippets(R.ResearchPack(query="x", status="empty", sources=[]))
    return 100.0 if out == R.SAFE_RESEARCH_NO_SOURCE else 0.0


def score_citation_present() -> float:
    pack = R.ResearchPack(
        query="X",
        status="ok",
        sources=[R.Source("T", "https://en.wikipedia.org/wiki/X", "Fakt eins.", "mock", "t")],
    )
    reply = R.synthesize_from_snippets(pack)
    return 100.0 if R.reply_has_citations(reply, pack.sources) else 0.0


SCORERS = {
    "opt_in_off_no_net": score_opt_in_off_no_net,
    "pii_query": score_pii_query,
    "empty_refuse": score_empty_refuse,
    "citation_present": score_citation_present,
}


def main() -> int:
    print("Scorecard 0.6.2 research")
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
