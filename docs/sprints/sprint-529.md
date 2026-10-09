# Sprint 529 — Gold-Kartenkorpus

**Version:** `18.51.0` — **CODE** Must  
**Plan:** [`../105-next.md`](../105-next.md) · Säule **Fidelity**  
**Voraussetzung:** siehe Abhängigkeiten in Plan 105.

## Ziel

Gold-Kartenkorpus.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S529-1 | Kern | `test-yugioh-fidelity.mjs` | 100 Karten mit erwartetem Outcome; ≥95 % Treffer. |
| S529-2 | Tests | `test-yugioh-duel.mjs` oder `test-yugioh-rules.mjs` / `test-yugioh-fidelity.mjs` | Goldfälle grün; keine Regression Plan-104-Self-Play ohne `engineStamp`-Bump. |
| S529-3 | Doku | `yugioh-duel.md` | Grenzen und Messwerte aktualisieren, wenn Gate betroffen. |

## Abbruchkriterium

Gate aus Plan 105 für diese Version nicht erreichbar, oder Regeländerung bricht Verify ohne dokumentierten `engineStamp`-Reset.
