# Sprint 528 — Errata-Tabelle

**Version:** `18.51.0` — **CODE** Must  
**Plan:** [`../105-next.md`](../105-next.md) · Säule **Fidelity**  
**Voraussetzung:** siehe Abhängigkeiten in Plan 105.

## Ziel

Errata-Tabelle.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S528-1 | Kern | `yugioh-errata.json` | Errata pro catalogId; Regression bei API-Text-Drift. |
| S528-2 | Tests | `test-yugioh-duel.mjs` oder `test-yugioh-rules.mjs` / `test-yugioh-fidelity.mjs` | Goldfälle grün; keine Regression Plan-104-Self-Play ohne `engineStamp`-Bump. |
| S528-3 | Doku | `yugioh-duel.md` | Grenzen und Messwerte aktualisieren, wenn Gate betroffen. |

## Abbruchkriterium

Gate aus Plan 105 für diese Version nicht erreichbar, oder Regeländerung bricht Verify ohne dokumentierten `engineStamp`-Reset.
