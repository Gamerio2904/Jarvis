# Sprint 33 — Tools Hygiene & Confirm-UX

| Feld | Wert |
|------|------|
| Status | **READY FOR REVIEW** (Code im Repo; Live-PO) |
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

- Mail / Fire TV / Alexa
- Cloud-Kalender-OAuth
- NAS/APK (Sprints 34–39)
- Samsung-TV (`0.11.x`)

## Exit / Abnahme

PO: Listen nutzbar; Confirm per UI. Tag **`v0.9.5`**.

## Danach

- Sprint 34 / `0.10.0` NAS Core — siehe [`12-nas-apk.md`](../12-nas-apk.md)
- Samsung-TV erst `0.11.x` (Sprint 40)
