# Sprint 514 — Gold Regelkern G1–G20

**Version:** `18.46.0` — **PLAN** Must  
**Plan:** [`../105-next.md`](../105-next.md) · Säule **Regel**  
**Voraussetzung:** siehe Abhängigkeiten in Plan 105.

## Ziel

Gold Regelkern G1–G20.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S514-1 | Kern | `test-yugioh-rules.mjs` | 20 automatisierte Regelfälle grün; Doku in yugioh-duel.md. |
| S514-2 | Tests | `test-yugioh-duel.mjs` oder `test-yugioh-rules.mjs` / `test-yugioh-fidelity.mjs` | Goldfälle grün; keine Regression Plan-104-Self-Play ohne `engineStamp`-Bump. |
| S514-3 | Doku | `yugioh-duel.md` | Grenzen und Messwerte aktualisieren, wenn Gate betroffen. |

## Abbruchkriterium

Gate aus Plan 105 für diese Version nicht erreichbar, oder Regeländerung bricht Verify ohne dokumentierten `engineStamp`-Reset.
