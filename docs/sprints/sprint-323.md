# Sprint 323 — Debug-Rollback Leit + Snapshot

**Version:** `18.8.0` — **CODE** Must
**Plan:** [`79-next.md`](../79-next.md)
**Voraussetzung:** Code `18.7.0`. Nicht parallel zu 301–306.

## Ziel

Bevor der automatische Debug-Lauf schreibt, liegt ein Snapshot der
Haus-Listen. Fertig, Stop und Abbruch stellen genau diesen Stand wieder
her. Keys bleiben. Der Debug-Chat bleibt zum Download.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S323-1 | Schnitt | `debug-session.ts` **neu** Helper | `captureHouse()` / `restoreHouse(snap)` — Listen aus [`79-next.md`](../79-next.md) §3.1. Keine API-Keys, keine Conversations |
| S323-2 | Zeitpunkt | `startDebugRun` | Snapshot nach `onStartChat`, vor der Schleife. Token-Guard. Zweiter Start erst nach Restore |
| S323-3 | Restore | `finally` + Stop + Catch | Immer Restore wenn Snapshot da. `cancelNotify` für IDs die neu sind. Taschenlampe + Allowlist-Flags. Pending des Debug-Gesprächs leeren |
| S323-4 | Warn | `DEBUG_START_WARN` | Ein Satz: Writes laufen währenddessen, danach räumt Jarvis sie weg. Titel der Copy-Gruppen **nicht** anfassen |
| S323-5 | Test | Node | Snapshot → addEvent/addReminder → restore → Listen gleich. Restore zweimal idempotent. Keys in Settings unverändert |

## Won’t

- Hausstand-JSON als Snapshot. Debug-Gespräch löschen.
- Physisches TV/PC/Taxi rückgängig. `18.5` mitziehen. Neue APK.

## Abbruchkriterium

Nach einem Mini-Lauf mit Timer+Termin liegen beide noch. Oder Restore
wischt den Gemini-Key. Oder der Debug-Chat ist weg.

## Manuell

Kategorie Timer + Kalender starten, nach 2 Turns Stop: kein neuer Timer,
kein Zahnarzt, Dock/Turns noch da.
