# Sprint 41 — Samsung TV Hotfix

| Feld | Wert |
|------|------|
| Status | **PLANNED** |
| Priorität | **MUST** — nach erstem Live-TV |
| Ziel-Version | **`0.11.1`** |
| Quelle | Kanten: WOL, Phrasen, False-Claims |

## Ziel

TV-Steuerung **zuverlässig und ehrlich**: WOL-Timeout, HDMI-Namen, Follow-up „lauter“ nur nach TV-Turn.

## Must

| ID | Verbesserung | Done wenn |
|----|--------------|-----------|
| H1 | **WOL-Timing** — nach Magic-Packet warten/retry; Misserfolg klar („wacht nicht auf, WOL am TV prüfen“) | Kein stilles OK |
| H2 | **False-Claim** — keine Erfolgsbehauptung ohne Tool-Ergebnis | Eval-Guard |
| H3 | **Follow-up** — „lauter“/„stumm“ nur mit Anker oder letztem TV-Turn | Analog Todo-Continuity |
| H4 | HDMI-Synonyme (hdmi 1, HDMI1, Quelle 1) | Parser-Tests |
| H5 | Eval `scripts/eval_0_11_1.py` + Version `0.11.1` | Suite grün |

## Should

| ID | Inhalt |
|----|--------|
| H6 | Gastnetz/AP-Isolation → verständlicher Netzfehler |
| H7 | Volume-Repeat („lauter lauter“) = zwei Steps oder ein klarer Step |

## Won’t

- Cloud-Fallback SmartThings
- Apps, Multi-TV, Confirm-UI
- Settings-Discover (Sprint 42)

## Exit / Abnahme

PO: Aus-Zustand → „Fernseher an“ entweder wach oder ehrlicher Fehler. Tag **`v0.11.1`**.

## Danach

- Sprint 42 / `0.11.2` TV Settings-UI
