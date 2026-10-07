# Sprint 454 — Research-Gold und Release-Gate `18.29.0`

**Version:** `18.29.0` — **PLAN** Must  
**Plan:** [`../100-next.md`](../100-next.md)  
**Voraussetzung:** Sprints 450–453.

## Ziel

Research und internes Wissen verbessern die Planung nachweisbar, ohne
Quellenbehauptungen, Datenschutz oder bestehendes Projekt-Routing zu brechen.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S454-1 | Quellen-/Konflikt-Gold | `scripts/test-idea-plan.mjs`, `TEST-18.29.md` | Kein Treffer, widersprüchliche Quelle und unzugängliche Quelle abdecken |
| S454-2 | Zustimmung und Netzaufruf prüfen | `scripts/test-board.mjs` | Ohne Zustimmung exakt null externe Research-Calls |
| S454-3 | Regression bestehender Researchflüsse | `engine/web-search.ts`, Eval-Suite | Normale Such- und Quellenfunktionen unverändert |
| S454-4 | Release-Gate | `package.json`, `engine/store.ts` | `18.29.0` / `182900` nur bei grünen Gold-Tests |

## Abbruchkriterium

Bei ungefragtem Netzaufruf, verlorener Quellenangabe oder falscher Fakt-
Sicherheit bleibt `18.29.0` unveröffentlicht.
