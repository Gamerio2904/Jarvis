# Sprint 530 — Fidelity-Nachweis und Release-Gate

**Version:** `18.51.0` — **PLAN** Must  
**Plan:** [`../105-next.md`](../105-next.md) · Säule **Fidelity**  
**Voraussetzung:** siehe Abhängigkeiten in Plan 105.

## Ziel

Fidelity-Nachweis und Release-Gate.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S530-1 | Kern | `yugioh-proof.ts` | Deck-Fidelity-Score in Nachweis; 18.51.0 Geräte-Gate. |
| S530-2 | Tests | `test-yugioh-duel.mjs` oder `test-yugioh-rules.mjs` / `test-yugioh-fidelity.mjs` | Goldfälle grün; keine Regression Plan-104-Self-Play ohne `engineStamp`-Bump. |
| S530-3 | Doku | `yugioh-duel.md` | Grenzen und Messwerte aktualisieren, wenn Gate betroffen. |

## Abbruchkriterium

Gate aus Plan 105 für diese Version nicht erreichbar, oder Regeländerung bricht Verify ohne dokumentierten `engineStamp`-Reset.
