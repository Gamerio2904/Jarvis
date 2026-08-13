# Sprint 29 — Tools Hotfix (nach 0.9.0)

| Feld | Wert |
|------|------|
| Status | **PLANNED** |
| Priorität | **HIGH** — Must-Fixes nach Tools-MINOR |
| Ziel-Version | **`0.9.1`** |
| Quelle | Erwartete Deep-Test-Schwächen nach Sprint 28 / `0.9.0` (+ Carry-over) |

## Ziel

Tool-Pfad **ehrlich und robust**: keine False-Confirms, keine stillen Writes, klare Ablehnung, Routing-Kanten (Notiz vs. Memory „merk dir“).

## Must

| ID | Verbesserung | Done wenn |
|----|--------------|-----------|
| H1 | **False-Confirm-Guard für Tools** — „Notiert/Todo angelegt“ nur nach erfolgreichem Execute | Eval: Dry-Run/Abort → keine Erfolgs-Claim |
| H2 | **Memory vs. Tool Abgrenzung** — „Merk dir …“ bleibt Memory; „Notiere / Todo …“ → Tool | Gold/Router-Fälle; keine Doppel-Speicherung ohne Absicht |
| H3 | **Confirm-Timeout / Ablehnen** — klarer Ack, kein Partial-Write | „Nein“ / Timeout → nichts in DB |
| H4 | **Inject + Tool** — Inject-Turns dürfen keine Tool-Calls auslösen | Live-Inject → Refuse, 0 Tool-Writes |
| H5 | Eval `scripts/eval_0_9_1.py` + Version `0.9.1` | Suite grün |

## Should

| ID | Inhalt |
|----|--------|
| H6 | Bessere Fehlermeldungen (Schema/Allowlist/DB) |
| H7 | Idempotenz: doppeltes „Todo: Milch“ nicht spammt ohne Nachfrage |
| H8 | Deep `scripts/deep_0_9_1.py` |

## Won’t

- Neue Tool-Typen (Kalender etc.)
- Autonome Multi-Tool-Ketten
- Phase 2 / NAS / TTS

## Abhängigkeiten

- Sprint 28 / `0.9.0` geliefert + Deep-Test

## Exit / Abnahme

PO: Keine Fake-Tool-Erfolge; Memory/Tool-Trennung klar; Inject sicher. Tag **`v0.9.1`**.

## Danach

- **Sprint 30 / `0.9.2`** Tools Polish
