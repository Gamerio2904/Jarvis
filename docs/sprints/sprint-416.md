# Sprint 416 — Planungsdateien im Hausstand

**Version:** `18.23.0` — **PLAN** Must
**Plan:** [`95-next.md`](../95-next.md)
**Voraussetzung:** 410. Der Store `plans` existiert. Unabhängig vom Fenster.

## Ziel

`Hausstand exportieren` schreibt jede Sprintvorlage und jeden Ablauf in
dieselbe Datei. Der Import holt sie zurück.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S416-1 | Export | `backup.ts` | `buildBackup` setzt `plans` auf alle Zeilen des Stores. `ideas` bleibt `listIdeas()` ohne Status-Filter, Feld `plan` vollständig. `ablauf_id` nicht in `EPHEMERAL`. Bewegung, `last_research_json` und der Store `xfer` bleiben draußen |
| S416-2 | Import | `backup.ts` | Schlüssel `plans` fehlt: Store nicht anfassen. Schlüssel da, auch `[]`: `replaceStore('plans', …)`. `ablauf_id` kommt mit den Einstellungen. Zeigt die Id auf keine Zeile, bleibt das Fenster zu |
| S416-3 | Vorschau und Rollback | `backup.ts` `debug-house.ts` | Vorschau-Satz enthält `2 Abläufe`, auch bei `0 Abläufe`, sobald `plans` ein Array ist. `debug-house.ts` `STORES` enthält `plans` neben `ideas` |
| S416-4 | Probe | `scripts/test-backup` oder der bestehende Hausstand-Test | Eine Idee mit gefülltem `plan` und zwei Ablauf-Zeilen, eine davon `zu`. Die JSON enthält beide unter `plans` und `ideas[].plan`. Runde über `applyBackup` liefert dieselben Ids |

## Won't

Zweite Datei, Repo-Markdown, Version, Testkarten.

## Abbruchkriterium

Ein zweites `Plane das` löscht die vorige Zeile, oder der Import einer Datei ohne `plans` leert den Store.
