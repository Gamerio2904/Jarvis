# Sprint 30 — Tools Polish & Assist Continuity

| Feld | Wert |
|------|------|
| Status | **PLANNED** |
| Priorität | **SHOULD** — Feinschliff nach Tools Hotfix |
| Ziel-Version | **`0.9.2`** |
| Quelle | Option A Abrundung; Continuity-Carry aus `0.8.5` im Tool-Kontext |

## Ziel

Tools im Alltag **rund**: UX/Status, Listen-Filter, Multi-Turn „Todo erledigen / Notiz finden“, Scorecard — optional leichtes **Kalender-Read-only** nur wenn lokal und ohne OAuth-Komplexität (sonst Won’t).

## Must

| ID | Verbesserung | Done wenn |
|----|--------------|-----------|
| P1 | **Multi-Turn Tool-Continuity** — „Zeig Todos“ → „Erledige das erste“ ohne neue Confirm-Schleife wo schon bestätigt | Eval-Flow grün |
| P2 | **Listen-UX** — Todos/Notizen filterbar (offen/erledigt; Suche) in Reply + optional UI | Nutzer findet Einträge ohne Dump |
| P3 | **Scorecard Tools** — Confirm-Rate, False-Claim=0, Abort-Rate | `scripts/scorecard_0_9_2.py` lesbar |
| P4 | Eval `scripts/eval_0_9_2.py` + Version `0.9.2` | Suite grün |

## Should

| ID | Inhalt |
|----|--------|
| P5 | UI-Confirm/Status-Chips aus `0.9.0` T7 nachziehen falls offen |
| P6 | Persona stabil im Tool-Ack (kein Master/Kumpel) |
| P7 | Optional: **lokaler Kalender-Read** (ICS-Datei / System-Calendar read-only) — nur wenn trivial; sonst Parking |

## Won’t

- Mail / Smart-Home / Cloud-Kalender-OAuth
- Phase 2 Auth, NAS `1.0.0`, TTS
- Autonome Agent-Schleifen

## Abhängigkeiten

- Sprints 28–29 (`0.9.0`–`0.9.1`)
- Continuity-Basis aus Sprint 27 / `0.8.5`

## Exit / Abnahme

PO: Tool-Alltag ohne False-Claims; Continuity spürbar; Scorecard ok. Tag **`v0.9.2`**.

## Danach

- Phase 2 Privat-Handy / NAS `1.0.0` / TTS — **PO-Kommando**
- Weitere Tools nur nach neuem Sprint
