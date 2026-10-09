# Sprint 513 — Beschwörungsarten und Limits

**Version:** `18.46.0` — **PLAN** Must  
**Plan:** [`../105-next.md`](../105-next.md) · Säule **Regel**  
**Voraussetzung:** siehe Abhängigkeiten in Plan 105.

## Ziel

Beschwörungsarten und Limits.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S513-1 | Kern | `yugioh-duel.ts` | Normal/Flip/Special/Pendel-Basis; Summon-Limit; Tribut/Material wie TCG-Subset. |
| S513-2 | Tests | `test-yugioh-duel.mjs` oder `test-yugioh-rules.mjs` / `test-yugioh-fidelity.mjs` | Goldfälle grün; keine Regression Plan-104-Self-Play ohne `engineStamp`-Bump. |
| S513-3 | Doku | `yugioh-duel.md` | Grenzen und Messwerte aktualisieren, wenn Gate betroffen. |

## Abbruchkriterium

Gate aus Plan 105 für diese Version nicht erreichbar, oder Regeländerung bricht Verify ohne dokumentierten `engineStamp`-Reset.
