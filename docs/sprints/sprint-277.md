# Sprint 277 — Widerspruch zieht Suche

**Version:** `18.1.0` — **CODE** Should
**Plan:** [`71-audit.md`](../71-audit.md) §3a S260-6, §4
**Gold:** G6 — isoliertes „Das stimmt nicht“ bleibt Gedächtnis.

## Ziel

„Das stimmt nicht“ nach Recherche oder Modell sucht den **vorherigen** Satz.
Nach einer gemerkten Vorliebe bleibt es eine Gedächtnis-Korrektur.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S277-1 | last_step | `last-step.ts` | `isSearchableLastTool`: research, research_offer, news, outlook, llm. `contradictionSearchAsk` |
| S277-2 | Parser | `parse-catalog.ts` memory | `isUtilityCorrection` + searchable last tool → nicht Memory |
| S277-3 | Chat | `chat.ts` | `ask` wird die vorherige Äußerung; `wantSearch` / `livePeek`. `persistLastStep('llm')` nach Modell ohne Suche. Memory/Recall speichern den last_step |

## Abbruchkriterium

„Stimmt nicht“ zu „ich trinke Kaffee“ startet eine Websuche. Oder ein
Widerspruch nach Wahlergebnis trainiert nur den Speicher, ohne zu suchen.
