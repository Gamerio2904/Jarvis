# Sprint 524 — Structure-Deck Gold-Gate

**Version:** `18.49.0` — **CODE** Must  
**Plan:** [`../105-next.md`](../105-next.md) · Säule **Effekt**  
**Voraussetzung:** siehe Abhängigkeiten in Plan 105.

## Ziel

Structure-Deck Gold-Gate.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S524-1 | Kern | `test-yugioh-duel.mjs` | 3 Gold-Structure-Decks: ≥70 % Deck-Coverage, ≥5 Effektaktivierungen/Duell im Schnitt. |
| S524-2 | Tests | `test-yugioh-duel.mjs` oder `test-yugioh-rules.mjs` / `test-yugioh-fidelity.mjs` | Goldfälle grün; keine Regression Plan-104-Self-Play ohne `engineStamp`-Bump. |
| S524-3 | Doku | `yugioh-duel.md` | Grenzen und Messwerte aktualisieren, wenn Gate betroffen. |

## Abbruchkriterium

Gate aus Plan 105 für diese Version nicht erreichbar, oder Regeländerung bricht Verify ohne dokumentierten `engineStamp`-Reset.
