# Sprint 380 — Dauer, ganztägig, Konflikt

**Version:** `18.17.0` — **CODE** Should
**Plan:** [`89-next.md`](../89-next.md)
**Voraussetzung:** 377.

## Ziel

Termine haben ein Ende. Überlappung wird gesagt, nicht erfunden.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S380-1 | Ende | `end_at` Default 60 min | `von 15 bis 16 Uhr` |
| S380-2 | Ganztägig | `all_day` | Folie-Haken, Parser-Wort |
| S380-3 | Konflikt | `firstOverlap` | Beim Anlegen „Achtung“. Watchdog Intervalle |

## Won’t

Reisezeit/OSRM. Stillos blocken.

## PO-Prüfung

1. Zwei Termine 15:00 und 15:30: Hinweis.
2. Ganztägig Urlaub: Folie ohne Uhrzeit.
