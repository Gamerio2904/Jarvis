#!/usr/bin/env python3
"""Sprint 25 Assist scorecard (0.8.3+)."""
from __future__ import annotations

import json
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app import guards as G  # noqa: E402
from app import memory as M  # noqa: E402
from app import research as R  # noqa: E402

BASE = "http://127.0.0.1:8000"

BASELINE = {
    "clarify_vague": 90,
    "stream_endpoint": 85,
    "research_empty_ux": 90,
    "soft_confirm_valid": 90,
}


def req(method: str, path: str, body: dict | None = None, timeout: float = 120.0):
    data = None if body is None else json.dumps(body).encode()
    headers = {"Content-Type": "application/json"} if body is not None else {}
    r = urllib.request.Request(f"{BASE}{path}", data=data, headers=headers, method=method)
    with urllib.request.urlopen(r, timeout=timeout) as resp:
        raw = resp.read().decode()
        return resp.status, json.loads(raw) if raw else None


def score_clarify_vague() -> float:
    return 100.0 if G.looks_like_vague_task("Mach mir einen Plan für morgen") else 0.0


def score_stream_endpoint() -> float:
    try:
        cid = req("POST", "/api/conversations", {"title": "sc083"})[1]["id"]
        data = json.dumps({"content": "Sag kurz Hi."}).encode()
        r = urllib.request.Request(
            f"{BASE}/api/conversations/{cid}/chat/stream",
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(r, timeout=180) as resp:
            chunk = resp.read(256)
        return 100.0 if chunk else 40.0
    except Exception:
        return 0.0


def score_research_empty_ux() -> float:
    pack = R.retrieve(
        "Recherchiere bitte bitte bitte",
        {"research_opt_in": True, "research_providers": ["mock"], "research_timeout_sec": 8},
    )
    pub = pack.to_public()
    if pack.status == "empty" and pub.get("status_label"):
        return 100.0
    return 0.0


def score_soft_confirm_valid() -> float:
    ok = (
        M.normalize_value("Jazz") == "Jazz"
        and M.is_valid_soft_value("Jazz")
        and not M.is_valid_soft_value("pan")
    )
    return 100.0 if ok else 0.0


SCORERS = {
    "clarify_vague": score_clarify_vague,
    "stream_endpoint": score_stream_endpoint,
    "research_empty_ux": score_research_empty_ux,
    "soft_confirm_valid": score_soft_confirm_valid,
}


def main() -> int:
    print("Scorecard 0.8.3 assist")
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
