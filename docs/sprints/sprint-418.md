# Sprint 418 — Dateien und Mappe

**Version:** `18.24.0` — **PLAN** Must
**Plan:** [`96-next.md`](../96-next.md)
**Voraussetzung:** 417. Die Zeile existiert.

## Ziel

Beim Festschreiben liegen `projekt.json`, `sprints.json`, `psp.json`
und ein gezeichnetes Kartenbild in der Zeile und unter
`Downloads/portfolio/<slug>/`.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S418-1 | JSON | `portfolio.ts` `project-docs.ts` | `files` übernimmt `projectDocument`, `sprintsDocument`, `pspDocument`. Dieselbe Form wie `Lade alles zu Projekt …`. Kein zweites Schema. Ein zweites `Go` schreibt dieselben drei Dateien neu und legt keine zweite Zeile an |
| S418-2 | Cover | `portfolio.ts` | Canvas 512 px, JPEG 0,7, höchstens 120 KB, zwei Buchstaben, Farbe aus dem Titel. `cover.kind` `drawn`. Kein Netz, kein Imagen |
| S418-3 | Native | `JarvisDevicePlugin.java` `device.ts` | Neue Methode `saveTreeFile`. Pfad muss `portfolio/<slug>/…` matchen, `..` fliegt raus. MIME nur JPEG, PNG, WebP, JSON. `saveDownload` bleibt für die alten flachen JSON-Dateien und hängt weiter `.json` an |
| S418-4 | Ehrliche Antwort | `idea.ts` | Mappe geschrieben: der Satz aus 417 bleibt. Native fehlgeschlagen: `Im Haus gespeichert. Der Ordner fehlt.` Die Zeile bleibt |

## Won't

Shredder, Beispiele, Hausstand-Schlüssel, die alte `saveDownload`-Methode für Ordner.

## Abbruchkriterium

Ein Pfad mit `..` schreibt außerhalb von `Downloads/portfolio/`, oder `cover.kind` wird `research` ohne gespeichertes Bild.
