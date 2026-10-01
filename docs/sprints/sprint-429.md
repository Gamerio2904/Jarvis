# Sprint 429 — Entwürfe im Hausstand

**Version:** `18.25.0` — **CODE** Must
**Plan:** [`97-next.md`](../97-next.md) §3
**Voraussetzung:** 424. Der Store `drafts` existiert. Unabhängig von den Rahmen.

## Ziel

`Hausstand exportieren` schreibt jede Entwurfszeile in dieselbe Datei.
Der Import holt sie zurück. Portfolio-Zeilen bleiben.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S429-1 | Export | `backup.ts` | `buildBackup` setzt `drafts` auf alle Zeilen des Stores. `plans`, `ideas` und `portfolio` bleiben, wie sie sind. `entwurf_id` nicht in `EPHEMERAL` |
| S429-2 | Import | `backup.ts` | Schlüssel `drafts` fehlt: Store nicht anfassen. Schlüssel da, auch `[]`: `replaceStore('drafts', …)`. `entwurf_id` kommt mit den Einstellungen. Zeigt die Id auf keine Zeile, bleiben die Rahmen zu |
| S429-3 | Vorschau und Rollback | `backup.ts` `debug-house.ts` | Vorschau-Satz enthält `2 Entwürfe`, auch bei `0 Entwürfe`, sobald `drafts` ein Array ist. `debug-house.ts` `STORES` enthält `drafts` neben `plans` und `portfolio` |

## Won't

Zweite Datei, Repo-Markdown, Version.

## Abbruchkriterium

Der Import einer Datei ohne `drafts` leert den Store, oder `portfolio` fehlt in der Datei.
