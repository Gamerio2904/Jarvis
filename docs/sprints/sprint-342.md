# Sprint 342 — Quellen unter der Nachricht zuklappen

**Version:** `18.11.0` — **CODE** Must
**Plan:** [`84-next.md`](../84-next.md)
**Voraussetzung:** 341 / Quellen-UI liegt.

## Ziel

Quellen stehen nicht mehr offen unter der Nachricht. Ein Tipp auf
den Badge klappt die Links auf. Gilt für **jede** Assistenten-Nachricht
mit `meta.research`. Der Badge nennt die **Anzahl**.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S342-1 | Default zu | `App.tsx` `SourcesBlock` | `<details className="sources-block">` **ohne** `open` |
| S342-2 | Stream | dieselbe Stelle | Streaming-Block dasselbe Default |
| S342-3 | Badge | `App.tsx` / CSS | Summary „N Quellen“ (1 Quelle / 3 Quellen); tastbar |
| S342-4 | Test | GUI oder `test-copy` | Liste erst nach Öffnen sichtbar |

## Won’t

Quellen ganz weglassen. Nur Koch zuklappen. Neue Quellen-API.

## Abbruchkriterium

`open` bleibt am `details`, oder Quellen erscheinen nur noch beim Koch.

## Manuell

Research- oder News-Antwort: unter dem Text nur der Badge mit Zahl.
Antippen zeigt `[1]`-Links. Zuklappen verbirgt sie.
