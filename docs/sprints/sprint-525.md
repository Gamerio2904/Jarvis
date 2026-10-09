# Sprint 525 — PSCT-Atommodell

**Version:** `18.50.0` — **PLAN** Must  
**Plan:** [`../105-next.md`](../105-next.md) · Säule **Fidelity**  
**Voraussetzung:** siehe Abhängigkeiten in Plan 105.

## Ziel

PSCT-Atommodell.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S525-1 | Kern | `yugioh-psct.ts` | Trigger, Cost, Condition, Effect aus Kartentext; Card-ID-Version. |
| S525-2 | Tests | `test-yugioh-duel.mjs` oder `test-yugioh-rules.mjs` / `test-yugioh-fidelity.mjs` | Goldfälle grün; keine Regression Plan-104-Self-Play ohne `engineStamp`-Bump. |
| S525-3 | Doku | `yugioh-duel.md` | Grenzen und Messwerte aktualisieren, wenn Gate betroffen. |

## Abbruchkriterium

Gate aus Plan 105 für diese Version nicht erreichbar, oder Regeländerung bricht Verify ohne dokumentierten `engineStamp`-Reset.
