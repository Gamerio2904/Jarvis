# Sprint 274 — Tanke und POI ohne Zweitversuch

**Version:** `18.1.0` — **CODE** Must
**Plan:** [`71-audit.md`](../71-audit.md) §3e Motor, §4
**Voraussetzung:** 273 (ehrliche Absage sichtbar, wenn der eine Versuch scheitert).

## Ziel

`fuel` und `poi` sind `device`, nicht `read`. Eine Zeitüberschreitung startet
die Navigation nicht zweimal.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S274-1 | Katalog | `parse-catalog.ts` | `fuel`/`poi` `sideEffect: 'device'` (bleiben `factual`) |
| S274-2 | Bus | `bus.ts` `dispatchAttempts` | `read` = 2, sonst 1 |

Wetter und Sport bleiben `read` und dürfen einmal wiederholen.
POI behält Parser-Extra `0.08` wie Tanke — sonst gewinnt Maps, weil
`device` in der Policy 0,05 kostet.

## Abbruchkriterium

„Nächste Tanke“ startet die Zielführung zweimal.
