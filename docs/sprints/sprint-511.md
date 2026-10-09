# Sprint 511 — Zonenmodell EMZ/MMZ und Link-Register

**Version:** `18.46.0` — **PLAN** Must  
**Plan:** [`../105-next.md`](../105-next.md) · Säule **Regel**  
**Voraussetzung:** siehe Abhängigkeiten in Plan 105.

## Ziel

Zonenmodell EMZ/MMZ und Link-Register.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S511-1 | Kern | `yugioh-duel.ts` | Extra-Monsterzonen, Main-Monsterzonen, Link-Pfeile als Daten; Beschwörung nur in freie Zonen. |
| S511-2 | Tests | `test-yugioh-duel.mjs` oder `test-yugioh-rules.mjs` / `test-yugioh-fidelity.mjs` | Goldfälle grün; keine Regression Plan-104-Self-Play ohne `engineStamp`-Bump. |
| S511-3 | Doku | `yugioh-duel.md` | Grenzen und Messwerte aktualisieren, wenn Gate betroffen. |

## Abbruchkriterium

Gate aus Plan 105 für diese Version nicht erreichbar, oder Regeländerung bricht Verify ohne dokumentierten `engineStamp`-Reset.
