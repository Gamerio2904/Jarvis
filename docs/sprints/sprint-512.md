# Sprint 512 — Zugstruktur und Turn-1-Regeln

**Version:** `18.46.0` — **PLAN** Must  
**Plan:** [`../105-next.md`](../105-next.md) · Säule **Regel**  
**Voraussetzung:** siehe Abhängigkeiten in Plan 105.

## Ziel

Zugstruktur und Turn-1-Regeln.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S512-1 | Kern | `yugioh-duel.ts` | Draw/Standby/Main/Battle/Main2/End TCG-konform; kein Battle in Turn 1 des Startspielers (TCG-Subset). |
| S512-2 | Tests | `test-yugioh-duel.mjs` oder `test-yugioh-rules.mjs` / `test-yugioh-fidelity.mjs` | Goldfälle grün; keine Regression Plan-104-Self-Play ohne `engineStamp`-Bump. |
| S512-3 | Doku | `yugioh-duel.md` | Grenzen und Messwerte aktualisieren, wenn Gate betroffen. |

## Abbruchkriterium

Gate aus Plan 105 für diese Version nicht erreichbar, oder Regeländerung bricht Verify ohne dokumentierten `engineStamp`-Reset.
