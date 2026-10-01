# Sprint 422 — Entwürfe im Hausstand

**Version:** `18.24.0` — **PLAN** Must
**Plan:** [`96-next.md`](../96-next.md) §3
**Voraussetzung:** 417. Der Store `drafts` existiert. Unabhängig von den Rahmen.

## Ziel

`Hausstand exportieren` schreibt jede Entwurfszeile in dieselbe Datei.
Der Import holt sie zurück.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S422-1 | Export | `backup.ts` | `buildBackup` setzt `drafts` auf alle Zeilen des Stores. `plans` und `ideas` bleiben, wie sie sind. `entwurf_id` nicht in `EPHEMERAL` |
| S422-2 | Import | `backup.ts` | Schlüssel `drafts` fehlt: Store nicht anfassen. Schlüssel da, auch `[]`: `replaceStore('drafts', …)`. `entwurf_id` kommt mit den Einstellungen. Zeigt die Id auf keine Zeile, bleiben die Rahmen zu |
| S422-3 | Vorschau und Rollback | `backup.ts` `debug-house.ts` | Vorschau-Satz enthält `2 Entwürfe`, auch bei `0 Entwürfe`, sobald `drafts` ein Array ist. `debug-house.ts` `STORES` enthält `drafts` neben `plans` |

## Won't

Zweite Datei, Repo-Markdown, Version.

## Abbruchkriterium

Der Import einer Datei ohne `drafts` leert den Store, oder `plans` fehlt in der Datei.
