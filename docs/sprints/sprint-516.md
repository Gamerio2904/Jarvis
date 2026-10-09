# Sprint 516 — Kosten und Aktivierungsbedingungen

**Version:** `18.47.0` — **PLAN** Must  
**Plan:** [`../105-next.md`](../105-next.md) · Säule **Regel**  
**Voraussetzung:** siehe Abhängigkeiten in Plan 105.

## Ziel

Kosten und Aktivierungsbedingungen.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S516-1 | Kern | `yugioh-duel.ts` | LP-, discard-, tribute-Kosten vor Effekt; cannot/only-if sichtbar. |
| S516-2 | Tests | `test-yugioh-duel.mjs` oder `test-yugioh-rules.mjs` / `test-yugioh-fidelity.mjs` | Goldfälle grün; keine Regression Plan-104-Self-Play ohne `engineStamp`-Bump. |
| S516-3 | Doku | `yugioh-duel.md` | Grenzen und Messwerte aktualisieren, wenn Gate betroffen. |

## Abbruchkriterium

Gate aus Plan 105 für diese Version nicht erreichbar, oder Regeländerung bricht Verify ohne dokumentierten `engineStamp`-Reset.
