# Sprint 526 — Zielwahl UI und Validator

**Version:** `18.50.0` — **PLAN** Must  
**Plan:** [`../105-next.md`](../105-next.md) · Säule **Fidelity**  
**Voraussetzung:** siehe Abhängigkeiten in Plan 105.

## Ziel

Zielwahl UI und Validator.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S526-1 | Kern | `YugiohDuel.tsx` | Spieler wählt gültige Ziele; Engine lehnt ungültige Ziele ab. |
| S526-2 | Tests | `test-yugioh-duel.mjs` oder `test-yugioh-rules.mjs` / `test-yugioh-fidelity.mjs` | Goldfälle grün; keine Regression Plan-104-Self-Play ohne `engineStamp`-Bump. |
| S526-3 | Doku | `yugioh-duel.md` | Grenzen und Messwerte aktualisieren, wenn Gate betroffen. |

## Abbruchkriterium

Gate aus Plan 105 für diese Version nicht erreichbar, oder Regeländerung bricht Verify ohne dokumentierten `engineStamp`-Reset.
