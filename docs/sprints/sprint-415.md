# Sprint 415 — Gold

**Version:** `18.23.0` — **PLAN** Must
**Plan:** [`95-next.md`](../95-next.md)
**Voraussetzung:** 410–414.

## Ziel

Die Sätze aus [`TEST-18.23.md`](../TEST-18.23.md) routen. Nachbarn bleiben.
Version und Testkarten erst hier, und erst wenn der Ablauf im Code liegt.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S415-1 | Gold | `eval/corpus.ts` | `Plane das` und `Plane das: Trag morgen 9 Uhr Zahnarzt ein` → `idea`. `Übernehmen`, `Plan zu`, `Fenster zu` bei offenem Ablauf → `idea`. `Ändere den Wecker: 7:30` bei offenem Ablauf → `idea`. `Mach einen Sprintplan für Idee 1` bleibt `fill_plan`. `Such Open Source zu Tic-Tac-Toe und plane Sprints für Idee 1` bleibt `board`. `nächster Lidl` bleibt `poi`. `Schieb die Sprintliste nach links` bleibt `board` |
| S415-2 | Karten | `test-copy.ts` `probe-lanes.ts` | Gruppe `18.23 Ablauf` in Spur Heute. Dieselben Sätze wie `TEST-18.23.md`. Vorher liegen die Karten nicht in der App |
| S415-3 | Version | `package.json` Docs | App-Code `18.23.0`, versionCode `182300`, erst wenn 410–414 grün sind. Bis dahin bleibt die Sideload `18.22.0`. Katalog-Stand bleibt `18.20.0` |

## Won't

APK in diesem Plandokument. Die Datei entsteht beim Ausführen, nicht beim Planen.

## Abbruchkriterium

`nächster Lidl` wird `idea`, oder die Testkarten liegen in der App, bevor ein Ablauffenster offen ist.
