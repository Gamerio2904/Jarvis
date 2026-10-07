# Sprint 443 — Todo-Gold und Release-Gate

**Version:** `18.27.0` — **PLAN** Must  
**Plan:** [`../99-next.md`](../99-next.md)  
**Voraussetzung:** Sprints 438–442.

## Ziel

GUI, Store, Sprache und Deadline-Fragen bestehen End-to-End- und
Regressionstests. Erst dann wird die Produktversion angehoben.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S443-1 | Gold-Prompts | `eval/corpus.ts` | Sätze aus `TEST-18.27.md` mit erwarteter Route/Antwort ergänzen |
| S443-2 | Regression | `scripts/test-todo-lists.mjs` | Migration, Listenisolation, Swipe-Ziele, Deadline und Confirm |
| S443-3 | UI- und Geräteabnahme | `TEST-18.27.md` | Handy, Tastatur, Touch, Reduced Motion und persistenter Neustart |
| S443-4 | Version und Testkarten | `package.json`, `engine/store.ts`, Test-Prompts | `18.27.0` / `182700` und Testkarten nur bei grünen Gates |

## Abbruchkriterium

Bei verlorenem Altbestand, falscher Listen-/Aufgabenauswahl oder falsch
berechneter Deadline bleibt die bisherige App-Version unverändert. APK-Bau ist
ein separater Release-Schritt.
