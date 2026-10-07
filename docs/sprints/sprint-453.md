# Sprint 453 — Research mit Zustimmung und Provenienz

**Version:** `18.29.0` — **PLAN** Must  
**Plan:** [`../100-next.md`](../100-next.md)  
**Voraussetzung:** Sprints 451–452.

## Ziel

Externe Recherche ist ein klar sichtbarer, begrenzter Netzaufruf mit
nachprüfbaren Quellen und ohne Umgehung von Zugriffsbeschränkungen.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S453-1 | Research-Vorschlag und Zustimmung | `engine/board-parse.ts`, `engine/board.ts` | Trigger erklärt Zweck und Query; Netzaufruf erst bei expliziter Zustimmung |
| S453-2 | Vorhandenen Researchpfad verwenden | `engine/web-search.ts`, `engine/research-parse.ts` | Bestehende Allowlist-/Quellenlogik wiederverwenden |
| S453-3 | Provenienz erhalten | `engine/store.ts`, `engine/idea-plan.ts` | URL, Titel, Abrufstatus und belegte Aussage verknüpfen |
| S453-4 | Sperren ehrlich behandeln | `engine/board.ts`, `scripts/test-idea-plan.mjs` | 403, 429, Timeout und leere Resultate sind sichtbar; kein Retry-/Proxy-Bypass |

## Abbruchkriterium

Kein automatisches Scraping, Stealth-Plugin, Proxy-Rotation oder Umgehen von
Robots-, Rate- oder Authentisierungsgrenzen.
