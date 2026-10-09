# Sprint 527 — OPT/HOPT und Bedingungen

**Version:** `18.50.0` — **PLAN** Must  
**Plan:** [`../105-next.md`](../105-next.md) · Säule **Fidelity**  
**Voraussetzung:** siehe Abhängigkeiten in Plan 105.

## Ziel

OPT/HOPT und Bedingungen.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S527-1 | Kern | `yugioh-duel.ts` | Once-per-turn/Hard OPT Zähler; fail-closed bei unklarem Text. |
| S527-2 | Tests | `test-yugioh-duel.mjs` oder `test-yugioh-rules.mjs` / `test-yugioh-fidelity.mjs` | Goldfälle grün; keine Regression Plan-104-Self-Play ohne `engineStamp`-Bump. |
| S527-3 | Doku | `yugioh-duel.md` | Grenzen und Messwerte aktualisieren, wenn Gate betroffen. |

## Abbruchkriterium

Gate aus Plan 105 für diese Version nicht erreichbar, oder Regeländerung bricht Verify ohne dokumentierten `engineStamp`-Reset.
