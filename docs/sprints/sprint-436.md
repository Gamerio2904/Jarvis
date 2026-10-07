# Sprint 436 — Gold und Release-Gate Notizen

**Version:** `18.26.0` — **PLAN** Must  
**Plan:** [`../98-next.md`](../98-next.md)  
**Voraussetzung:** Sprints 432–435.

## Ziel

Die End-to-End-Gold-Spur ist grün. Erst hier werden App-Version und
versionCode auf den Feature-Release gesetzt.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S436-1 | Gold-Sätze | `eval/corpus.ts` | GUI- und Sprachsätze aus `TEST-18.26.md` als getrennte Fälle ablegen |
| S436-2 | Regression | `scripts/test-notes.mjs` | CRUD, Routing, Recall, Datenschutz und Nachbardomänen abdecken |
| S436-3 | Testkarten | `test-prompts.ts` | Notizen-Spur erst nach bestandenem Release-Gate verfügbar machen |
| S436-4 | Version | `package.json` `engine/store.ts` | `18.26.0`, versionCode `182600`, nur nach grünen Gates |

## Abbruchkriterium

Bei einem erfundenen, mehrdeutigen oder cloud-gesendeten persönlichen Recall
bleibt die bisherige Version unangetastet. APK-Bau ist nicht Teil dieses
Planungssprints.
