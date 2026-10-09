# Sprint 522 — Timing-Klassen Quick/Trigger/Flip

**Version:** `18.49.0` — **CODE** Must  
**Plan:** [`../105-next.md`](../105-next.md) · Säule **Effekt**  
**Voraussetzung:** siehe Abhängigkeiten in Plan 105.

## Ziel

Timing-Klassen Quick/Trigger/Flip.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S522-1 | Kern | `yugioh-duel.ts` | Aktivierung nur in erlaubten Fenstern (an 515). |
| S522-2 | Tests | `test-yugioh-duel.mjs` oder `test-yugioh-rules.mjs` / `test-yugioh-fidelity.mjs` | Goldfälle grün; keine Regression Plan-104-Self-Play ohne `engineStamp`-Bump. |
| S522-3 | Doku | `yugioh-duel.md` | Grenzen und Messwerte aktualisieren, wenn Gate betroffen. |

## Abbruchkriterium

Gate aus Plan 105 für diese Version nicht erreichbar, oder Regeländerung bricht Verify ohne dokumentierten `engineStamp`-Reset.
