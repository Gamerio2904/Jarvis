# Sprint 33 — Tools Hygiene & Confirm-UX

| Feld | Wert |
|------|------|
| Status | **PLANNED** |
| Priorität | **SHOULD** — Alltag nach Tools-Polish |
| Ziel-Version | **`0.9.5`** |
| Quelle | Feedback (Eval-Müll in Listen; Confirm nur per Text) |

## Ziel

Tools **alltagstauglich**: Listen nicht voller Testschrott; Confirm per UI; optionale Aufräumen-Aktion.

## Must

| ID | Verbesserung | Done wenn |
|----|--------------|-----------|
| T1 | **Listen-Scope** — Default „dieses Gespräch“ oder Filter; weniger Global-Dump | Reply zeigt Scope; Eval |
| T2 | **UI Confirm** — Ja/Nein-Chips am Pending-Bubble | Klick speichert/bricht ab ohne Tippen |
| T3 | **Aufräumen** — „Todos aufräumen“ / erledigte löschen oder archivieren | Befehl + Confirm |
| T4 | Eval `scripts/eval_0_9_5.py` + Version `0.9.5` | Suite grün |

## Should

| ID | Inhalt |
|----|--------|
| T5 | Dedup-Fuzzy (ähnliche Titel) |
| T6 | Scorecard-Erweiterung Hygiene |

## Won’t

- Mail / Smart-Home / Fire TV / Alexa
- Cloud-Kalender-OAuth
- Phase 2 Auth (eigenes Sprint-Track)

## Exit / Abnahme

PO: Listen nutzbar; Confirm per UI. Tag **`v0.9.5`**.

## Danach

- Phase 2 Handy privat — **PO-Kommando**
- Smart-Home/Fire TV nur nach explizitem neuen Scope (Parking)
