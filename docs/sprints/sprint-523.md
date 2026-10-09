# Sprint 523 — Feld- und Continuous-Effekte

**Version:** `18.49.0` — **PLAN** Must  
**Plan:** [`../105-next.md`](../105-next.md) · Säule **Effekt**  
**Voraussetzung:** siehe Abhängigkeiten in Plan 105.

## Ziel

Feld- und Continuous-Effekte.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S523-1 | Kern | `yugioh-duel.ts` | Field Spell wirkt; Continuous Spell/Trap Basis. |
| S523-2 | Tests | `test-yugioh-duel.mjs` oder `test-yugioh-rules.mjs` / `test-yugioh-fidelity.mjs` | Goldfälle grün; keine Regression Plan-104-Self-Play ohne `engineStamp`-Bump. |
| S523-3 | Doku | `yugioh-duel.md` | Grenzen und Messwerte aktualisieren, wenn Gate betroffen. |

## Abbruchkriterium

Gate aus Plan 105 für diese Version nicht erreichbar, oder Regeländerung bricht Verify ohne dokumentierten `engineStamp`-Reset.
