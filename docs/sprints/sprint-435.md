# Sprint 435 — Belegbarer Notiz-Recall

**Version:** `18.26.0` — **PLAN** Must  
**Plan:** [`../98-next.md`](../98-next.md)  
**Voraussetzung:** Sprint 431.

## Ziel

Persönliche Fragen durchsuchen Notizen zusammen mit vorhandenem Gedächtnis und
Fachwissen und antworten nur aus passenden, belegbaren Treffern.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S435-1 | Rang und Herkunft | `engine/retrieve.ts` | Notizinhalt zuverlässig auffindbar machen und stabile Herkunft mitführen |
| S435-2 | Antwortgrenze | `engine/chat.ts` | Eindeutigen lokalen Treffer knapp beantworten, Quelle nennen, fehlende Belege offenlegen |
| S435-3 | Konflikte | `engine/retrieve.ts` | Abweichende Matrikelnummern nicht zusammenraten; Rückfrage oder Konflikthinweis |
| S435-4 | Recall-Gold | `scripts/test-notes.mjs` | Memory-only, Knowledge-only, Note-only, Widerspruch und Leerfall abdecken |

## Abbruchkriterium

Deterministischer Recall darf weder Websuche auslösen noch persönliche
Notiztexte an einen Cloud-Anbieter senden.
