# Sprint 521 — Archetyp-Muster erweitern

**Version:** `18.48.0` — **PLAN** Must  
**Plan:** [`../105-next.md`](../105-next.md) · Säule **Effekt**  
**Voraussetzung:** siehe Abhängigkeiten in Plan 105.

## Ziel

Archetyp-Muster erweitern.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S521-1 | Kern | `yugioh-duel.ts` | Special Summon, bounce, banish, mill, discard als Effektarten. |
| S521-2 | Tests | `test-yugioh-duel.mjs` oder `test-yugioh-rules.mjs` / `test-yugioh-fidelity.mjs` | Goldfälle grün; keine Regression Plan-104-Self-Play ohne `engineStamp`-Bump. |
| S521-3 | Doku | `yugioh-duel.md` | Grenzen und Messwerte aktualisieren, wenn Gate betroffen. |

## Abbruchkriterium

Gate aus Plan 105 für diese Version nicht erreichbar, oder Regeländerung bricht Verify ohne dokumentierten `engineStamp`-Reset.
