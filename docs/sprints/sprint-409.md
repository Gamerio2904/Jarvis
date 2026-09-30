# Sprint 409 — Gold

**Version:** `18.22.0` — **PLAN** Must
**Plan:** [`94-next.md`](../94-next.md)
**Voraussetzung:** 404–408.

## Ziel

Die Sätze aus [`TEST-18.22.md`](../TEST-18.22.md) routen. Nachbar-Sätze
bleiben. Version und Testkarten erst hier.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S409-1 | Gold | `eval/corpus.ts` | `Schieb die Sprintliste nach links`, `Wirf die Quellen vom Tisch`, `Räum den Tisch`, `Hol die Sprintliste zurück` → `board`. `Zeig Sprints` bleibt `board`. `nächster Lidl` bleibt `poi`. `Hintergrund blau schwarz` bleibt `board` als Thema |
| S409-2 | Karten | `test-copy.ts` `probe-lanes.ts` | Gruppe `18.22 Tafel` in Spur Heute. Dieselben Sätze wie `TEST-18.22.md`. Vorher liegen die Karten nicht in der App |
| S409-3 | Version | `package.json` Docs | App-Code `18.22.0`, versionCode `182200`, erst wenn 404–408 grün sind. Bis dahin bleibt die Sideload `18.20.1`. Katalog-Stand bleibt `18.20.0`, bis ein eigener Freeze das sagt |

## Won't

APK in diesem Plandokument. Die Datei entsteht beim Ausführen, nicht beim Planen.

## Abbruchkriterium

`nächster Lidl` wird `board`, oder die Testkarten liegen in der App, bevor ein Stück fährt.
