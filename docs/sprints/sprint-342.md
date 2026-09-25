# Sprint 342 — Quellen unter der Nachricht zuklappen

**Version:** `18.11.0` — **PLAN** Must
**Plan:** [`84-next.md`](../84-next.md)
**Voraussetzung:** 341 / Quellen-UI liegt.

## Ziel

Quellen stehen nicht mehr offen unter der Nachricht. Ein Tipp auf
„Quellen“ / den Status klappt die Links auf. Gilt für **jede**
Assistenten-Nachricht mit `meta.research`, nicht nur Koch.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S342-1 | Default zu | `App.tsx` `SourcesBlock` | `<details className="sources-block">` **ohne** `open` |
| S342-2 | Stream | dieselbe Stelle | Streaming-Block dasselbe Default |
| S342-3 | Badge | `index.css` | Summary bleibt tastbar; kein dauerhaft offenes `sources-list` |
| S342-4 | Test | GUI oder `test-copy` | Nachricht mit Quellen: Liste erst nach öffnen sichtbar |

## Won’t

Quellen ganz weglassen. Nur Koch zuklappen. Neue Quellen-API.

## Abbruchkriterium

`open` bleibt am `details`, oder Quellen erscheinen nur noch beim Koch.

## Manuell

Eine Research- oder News-Antwort: unter dem Text nur der Badge.
Antippen zeigt `[1]`-Links. Zuklappen verbirgt sie wieder.
