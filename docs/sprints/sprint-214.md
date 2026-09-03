# Sprint 214 — Desk-Blick (`12.50.0`) **PLAN**

| Feld | Wert |
|------|------|
| Status | **PLAN** Should |
| Ziel-Version | **`12.50.0`** |
| Quelle | [`59-next.md`](../59-next.md) |
| Vorher | Eye + PC-JPEG CODE |

## Ziel

„Schau auf den Tisch“ ist ein **Schalter + letzter Frame**, kein Spion.

## Must

| ID | Inhalt |
|----|--------|
| D1 | `desk-parse.ts`: Tisch/Schreibtisch an/aus, nicht Wetter-Ort |
| D2 | Frame = letztes Auge-Foto **oder** letzter PC-JPEG |
| D3 | Kein Frame → ehrlich fragen, nichts erfinden |
| D4 | Registry-Score, kein `if` in `chat.ts` |
| D5 | Always-on Kamera Won’t — in Reply/Settings stehen |

## Won’t

Quest-Passthrough. LocateAnything-Gewichte. Stilles Logging.

## DoD

- [ ] Parser-Gold: Tisch ≠ Hotel-Wetter
- [ ] Ohne Bild keine Objektliste
