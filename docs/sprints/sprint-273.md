# Sprint 273 — Faktenagenten sagen ab

**Version:** `18.1.0` — **CODE** Must
**Plan:** [`71-audit.md`](../71-audit.md) §3e Motor, §4
**Voraussetzung:** 272 (Quelltext der Java-Schicht). **Danach:** 274.

## Ziel

Wenn Tanke, Wetter, POI oder Sport scheitern, fällt der Zug nicht ans Modell.
Sonst erfindet es Preise und Tabellen.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S273-1 | Marke | `agents/types.ts`, `parse-catalog.ts` | `factual?: true` an `fuel`, `weather`, `poi`, `sport` |
| S273-2 | Absage | `director.ts` `failureReply` | Fakten: „Ich rate nicht.“ Write/device ohne factual: „nichts geändert“. Read ohne factual: leer (weiterfallen) |

## Abbruchkriterium

Ein Agent scheitert und das Modell antwortet trotzdem mit Zahlen.
