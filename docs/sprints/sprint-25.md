# Sprint 25 — Assist Ops & Carry-over Polish

| Feld | Wert |
|------|------|
| Status | **PLANNED** |
| Priorität | **Should** — offene Shoulds aus Sprints 21–22 + Ops-Transparenz |
| Ziel-Version | **`0.8.3`** |
| Quelle | Unerledigte Shoulds Sprint 21 (D7–D10) / 22 (A7–A10) + Deep-Test-Ops-Hinweise |

## Ziel

**Betriebs- und Assist-Transparenz** nachziehen: Scorecards, optionale Persistenz von Delight-State, Audit-Link, Latency-Hinweis — ohne neues Cloud-/Tool-MINOR.

## Must

| ID | Verbesserung | Done wenn |
|----|--------------|-----------|
| O1 | **Scorecard Assist** — Clarify-Rate, Stream-TTFT, Research-Empty-UX, Soft-Confirm-Validität | `scripts/scorecard_0_8_3.py` (oder `0_8_0`-Nachfolger) mit Floors; CI/manuell grün |
| O2 | **Delight-State Persist (Conversation)** — Mood (und ggf. Joke-Pin-Link) überlebt Restart am Tag | `/kante` in Conv A nach Restart noch `kante`; kein Leak nach B |
| O3 | **Research-Audit-Link in UI** — aus Quellen-Block zur Audit-Liste / ID | Klick/Hinweis sichtbar wenn `audit_id` vorhanden |
| O4 | **Latency-Budget-Hinweis Settings** — wenn `model_heavy == model_default`: Warning bleibt + kurzer Hilfetext | Nutzer versteht, warum Auto-Routing wirkungslos ist |
| O5 | Version `0.8.3` + Eval `scripts/eval_0_8_3.py` | Suite grün; Health/UI `0.8.3` |

## Should

| ID | Inhalt |
|----|--------|
| O6 | Delight-Caps (Moments/Jokes) optional in DB (Rest Sprint 21 D7) |
| O7 | Dual-Source-Synth: DE+EN nicht pauschal „widersprechen“, wenn komplementär (D8) |
| O8 | Chaos-/Deep-Test-Skript versioniert unter `scripts/deep_0_8_x.py` (nicht nur `/tmp`) |
| O9 | PO-Review-Tags `v0.8.0`–`v0.8.2` nachziehen |

## Won’t

- Kalender/Mail/Smart-Home-Tools (nächstes MINOR erst nach PO)
- Phase 2 Auth/Handy, NAS `1.0.0`, TTS
- Neues Modell-Routing-MINOR

## Abhängigkeiten

- Hotfix `0.8.1` + Edge-Polish `0.8.2` empfohlen vorher
- Research-Audit und Settings-Warning aus `0.5`/`0.6` vorhanden

## Exit / Abnahme

PO: Scorecard lesbar; Mood überlebt Restart; Audit in UI auffindbar; Settings-Hinweis klar. Tag **`v0.8.3`**.

## Danach

- Optional **`0.9.0`** nur bei neuem Fähigkeitsniveau (Tools / stärkeres Assist) — **PO-Kommando**
- Phase 2 Privat-Handy / NAS `1.0.0` — **PO-Kommando**
