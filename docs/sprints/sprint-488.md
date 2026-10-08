# Sprint 488 — Eindeutig neueren Stand übernehmen

**Version:** `18.37.0` — **CODE\*** Must  
**Plan:** [`../102-next.md`](../102-next.md)  
**Voraussetzung:** 487.

**Ist im Arbeitsbaum:** Ein kausal dominierender Stand wird nach Hash- und
Revisionsprüfung übernommen. Vorher wird ein lokales Backup erstellt; bei
Anwendungsfehlern wird eine Wiederherstellung versucht. Eingehende Pushes
werden erst nach JS-seitiger Prüfung und Anwendung bestätigt. Atomizität,
Abbruch-/Recovery-Goldtests und Geräteabnahme sind noch nicht nachgewiesen.

## Ziel

Ein nachweisbar dominierender neuerer Stand wird ohne wiederholte Rückfrage
vollständig auf das ältere Gerät übernommen.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S488-1 | Trigger | `useTabletRuntime.ts` `tablet-sync.ts` | Beim Serverstart, Wiederverbinden und relevanter Änderung vergleichen; Debounce und Request-ID verhindern Pollschleifen. |
| S488-2 | Wiederherstellung | `backup.ts` `tablet-sync.ts` | Vor dem Ersetzen den lokalen Stand sichern; Nutzlast vollständig validieren, atomar anwenden und erst nach Bestätigung quittieren. |
| S488-3 | Idempotenz | Native Hausstand-API | Doppelte oder verspätete Requests nicht erneut anwenden; Hash und Revision müssen der bestätigten Anfrage entsprechen. |

## Abbruchkriterium

Transfer startet vor erfolgreicher Versions-/Authentisierungsprüfung, oder ein
Abbruch beschädigt den aktiven Stand.
