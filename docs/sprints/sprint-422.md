# Sprint 422 — Portfolio im Hausstand

**Version:** `18.24.0` — **CODE** Must
**Plan:** [`96-next.md`](../96-next.md)
**Voraussetzung:** 417 und 418. Zeile und Dateien existieren. Unabhängig vom Shredder.

## Ziel

Dieselbe Hausstand-Datei enthält jede Portfolio-Zeile, die Dateien und
die gekappten Bilder. Der Import holt sie zurück.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S422-1 | Export | `backup.ts` | `buildBackup` setzt `portfolio` auf alle Zeilen, auch `archived`. Bilder nur innerhalb der Grenzen aus Plan §2. `ideas` und `plans` bleiben |
| S422-2 | Import | `backup.ts` | Schlüssel fehlt: Store nicht anfassen. Schlüssel da, auch `[]`: `replaceStore('portfolio', …)`. Danach die Mappe je Zeile best effort neu schreiben. Native-Fehler ändert die importierte Zeile nicht |
| S422-3 | Vorschau und Rollback | `backup.ts` `debug-house.ts` | Vorschau enthält `3 Projekte`, auch `0 Projekte`, sobald `portfolio` ein Array ist. Mindestens eine archivierte Zeile hängt `, 1 im Archiv` an. `STORES` enthält `portfolio` neben `ideas` |
| S422-4 | Probe | `scripts/test-backup` oder der bestehende Hausstand-Test | Eine Zeile mit `projekt.json` und einem Beispiel unter 400 KB, eine zweite Zeile `archived`. Die JSON enthält beide. Runde über `applyBackup` liefert dieselben Ids und `archived` |

## Won't

Zweite Hausstand-Datei, Repo-Markdown, Version, die Shredder-Animation im Export.

## Abbruchkriterium

Eine Datei ohne Schlüssel `portfolio` leert den Store, oder eine archivierte Zeile fehlt im Export.
