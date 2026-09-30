# Sprint 423 — Gold

**Version:** `18.24.0` — **PLAN** Must
**Plan:** [`96-next.md`](../96-next.md)
**Voraussetzung:** 417–422 grün.

## Ziel

Dieselben Sätze wie in [`TEST-18.24.md`](../TEST-18.24.md) laufen als
Skript. Erst dann steht die Version auf `18.24.0`.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S423-1 | Skript | `scripts/test-portfolio.mjs` | Fest schreibt eine Zeile und den kurzen Namen. Zweites `Go` legt keine zweite Id an. `Zeig Projekt` öffnet die drei JSON-Namen. `Schredder` setzt `archived` und lässt `files` stehen. `Beispiel zu` ohne Bild antwortet `Kein Bild zum Speichern.` Ein Hausstand ohne Schlüssel `portfolio` lässt die Zeile |
| S423-2 | Karten | `eval/corpus.ts` | Die Sätze aus TEST-18.24 in Spur Heute, Gruppe `18.24 Portfolio`. `Zeig mir London` bleibt `hud`. `Plane das` bleibt die Planung |
| S423-3 | Version | `store.ts` `package.json` | Erst hier `APP_VERSION` `18.24.0`, versionCode `182400`. Die Sideload-Datei `releases/Jarvis.apk` wird in diesem Sprint nicht umbenannt und nicht auf `18.24.0` gezeigt, solange kein APK gebaut ist |

## Won't

Ein APK ohne gebautes Binary, eine neue Bild-API, Testkarten vor diesem Sprint.

## Abbruchkriterium

Die Version steigt, während 422 rot ist, oder die Doku eine `18.24.0`-Sideload-URL auf die Datei `18.23.12` zeigt.
