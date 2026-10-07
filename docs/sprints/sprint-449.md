# Sprint 449 — Stabilitäts- und Release-Gate `18.28.0`

**Version:** `18.28.0` — **PLAN** Must  
**Plan:** [`../100-next.md`](../100-next.md)  
**Voraussetzung:** Sprints 444–448.

## Ziel

Planungsbasis, Parser, PSP/Sprints und persistenter Zustand bestehen die
Regression, bevor die nächste Pipeline-Stufe beginnt.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S449-1 | Gold-Sätze ausführen | `scripts/test-board.mjs`, `scripts/test-idea-plan.mjs` | Routing, Schema, Resume und Bestätigungen prüfen |
| S449-2 | UI-/Geräteabnahme | `TEST-18.28.md` | Android-WebView und Browser mit Neustart testen |
| S449-3 | Altbestandsprüfung | `engine/store.ts`, Hausstand-Tests | Ideas/Pläne bleiben lesbar und round-trip-fähig |
| S449-4 | Release-Gate | `package.json`, `engine/store.ts` | `18.28.0` / `182800` nur bei grüner Gold-Spur setzen |

## Abbruchkriterium

Bei Projektverwechslung, falscher PSP-Sicht oder ungültigem gespeicherten Plan
bleibt die bisherige Version unverändert.
