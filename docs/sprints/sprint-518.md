# Sprint 518 — Banish, gleichzeitige Effekte, Deck-out

**Version:** `18.47.0` — **CODE** Must  
**Plan:** [`../105-next.md`](../105-next.md) · Säule **Regel**  
**Voraussetzung:** siehe Abhängigkeiten in Plan 105.

## Ziel

Banish, gleichzeitige Effekte, Deck-out.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S518-1 | Kern | `yugioh-duel.ts` | Banish-Zone; gleichzeitige Trigger-Reihenfolge dokumentiert; Gold G21–G40. |
| S518-2 | Tests | `test-yugioh-duel.mjs` oder `test-yugioh-rules.mjs` / `test-yugioh-fidelity.mjs` | Goldfälle grün; keine Regression Plan-104-Self-Play ohne `engineStamp`-Bump. |
| S518-3 | Doku | `yugioh-duel.md` | Grenzen und Messwerte aktualisieren, wenn Gate betroffen. |

## Abbruchkriterium

Gate aus Plan 105 für diese Version nicht erreichbar, oder Regeländerung bricht Verify ohne dokumentierten `engineStamp`-Reset.
