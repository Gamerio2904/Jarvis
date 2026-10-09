# Sprint 519 — Effekt-Schema v2 und Coverage-Metrik

**Version:** `18.48.0` — **PLAN** Must  
**Plan:** [`../105-next.md`](../105-next.md) · Säule **Effekt**  
**Voraussetzung:** siehe Abhängigkeiten in Plan 105.

## Ziel

Effekt-Schema v2 und Coverage-Metrik.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S519-1 | Kern | `yugioh-effects.ts` | Strukturierte Effekte statt nur Regex; Report: Anteil simulierter Karten je Deck. |
| S519-2 | Tests | `test-yugioh-duel.mjs` oder `test-yugioh-rules.mjs` / `test-yugioh-fidelity.mjs` | Goldfälle grün; keine Regression Plan-104-Self-Play ohne `engineStamp`-Bump. |
| S519-3 | Doku | `yugioh-duel.md` | Grenzen und Messwerte aktualisieren, wenn Gate betroffen. |

## Abbruchkriterium

Gate aus Plan 105 für diese Version nicht erreichbar, oder Regeländerung bricht Verify ohne dokumentierten `engineStamp`-Reset.
