# Sprint 161 — Live-Dock + Sitzung (`9.3.0`) **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** (mitgeliefert in `9.3.0`) |
| Priorität | V8 nach V7 |
| Ziel-Version | `9.3.0` |
| Quelle | Industry V8 Teil 2 |

## Ziel

Eine Live-Sitzung liefert Einzelbilder. Das Dock über dem Composer pollt, solange `last_rtc_json` steht. „Live aus“ beendet.

## Must

| ID | Inhalt |
|----|--------|
| L1 | Start + Frame + Hangup am Agent |
| L2 | Dock mit Stopp-Knopf |
| L3 | Erster Frame in der Chat-Zeile |

## Won’t

Neues Overlay-Id. Cloud-Relay.

## DoD

- [x] Sitzung ohne Frame = failed
