# Sprint 30 — Tools Polish & Assist Continuity

| Feld | Wert |
|------|------|
| Status | **READY FOR REVIEW** |
| Priorität | **SHOULD** — Feinschliff nach Tools Hotfix |
| Ziel-Version | **`0.9.2`** |
| Quelle | Option A Abrundung; Continuity-Carry aus `0.8.5` im Tool-Kontext |

## Ziel

Tools im Alltag **rund**: UX/Status, Listen-Filter, Multi-Turn „Todo erledigen / Notiz finden“, Scorecard — Kalender-Read optional geparkt.

## Must

| ID | Verbesserung | Done wenn |
|----|--------------|-----------|
| P1 | **Multi-Turn Tool-Continuity** — „Zeig Todos“ → „Erledige das erste“ ohne neue Confirm-Schleife | Eval-Flow grün |
| P2 | **Listen-UX** — Todos filterbar (offen/erledigt/alle + Suche), nummerierte Replies | Nutzer findet Einträge ohne Dump |
| P3 | **Scorecard Tools** — Confirm-Rate, False-Claim=0, Abort-Rate | `scripts/scorecard_0_9_2.py` lesbar |
| P4 | Eval `scripts/eval_0_9_2.py` + Version `0.9.2` | Suite grün |

## Should

| ID | Inhalt |
|----|--------|
| P5 | UI Confirm/Status-Chips (`tool-chip`) aus Message-Meta |
| P6 | Persona scrub auf Tool-Acks |
| P7 | Lokaler Kalender-Read — **Parking** (nicht trivial ohne OAuth/ICS-Pfad) |

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

- Sprints **31–33** (`0.9.3`–`0.9.5`) Memory/Assist/Tools-Hygiene
- Phase 2 Privat-Handy / NAS `1.0.0` / TTS — **PO-Kommando**
- Weitere Tools (inkl. Smart-Home) nur nach neuem Sprint
