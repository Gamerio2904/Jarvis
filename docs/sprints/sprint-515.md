# Sprint 515 — Ketten, Spell Speed, SEG

**Version:** `18.47.0` — **CODE** Must  
**Plan:** [`../105-next.md`](../105-next.md) · Säule **Regel**  
**Voraussetzung:** siehe Abhängigkeiten in Plan 105.

## Ziel

Ketten, Spell Speed, SEG.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S515-1 | Kern | `yugioh-duel.ts` | Speed 1–3, korrekte Antwortfenster, LIFO; Negation zielt auf richtiges Glied. |
| S515-2 | Tests | `test-yugioh-duel.mjs` oder `test-yugioh-rules.mjs` / `test-yugioh-fidelity.mjs` | Goldfälle grün; keine Regression Plan-104-Self-Play ohne `engineStamp`-Bump. |
| S515-3 | Doku | `yugioh-duel.md` | Grenzen und Messwerte aktualisieren, wenn Gate betroffen. |

## Abbruchkriterium

Gate aus Plan 105 für diese Version nicht erreichbar, oder Regeländerung bricht Verify ohne dokumentierten `engineStamp`-Reset.
