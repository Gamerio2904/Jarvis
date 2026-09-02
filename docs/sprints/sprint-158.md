# Sprint 158 — PC Confirm hart (`9.2.0`) **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** (mitgeliefert in `9.2.0`) |
| Priorität | V7 nach V6 |
| Ziel-Version | `9.2.0` |
| Quelle | Phase-0-Audit Debt #11, Industry V7 |
| Plan | Industry V7 Teil 2 |

## Ziel

Destruktiv und mehrdeutig wartet auf Ja/Nein (`WAITING`, `lastTool: pc_confirm`). FIFA bekannt ohne Extra-Confirm. Status, Bild, Taste, „PC testen“ ohne Confirm.

## Must

| ID | Inhalt |
|----|--------|
| K1 | Löschen bleibt Confirm |
| K2 | Unbekanntes Starten: „X starten? Ja oder nein.“ |
| K3 | Zwei-Schritt-GUI bleibt Confirm |

## Won’t

Confirm-Schleife für eindeutigen Klick. WebRTC.

## DoD

- [x] `needsLaunchConfirm('fifa') === false`
- [x] `needsLaunchConfirm('chrome') === true`
