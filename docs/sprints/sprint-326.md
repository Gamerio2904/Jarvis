# Sprint 326 — Fristen speichern, N Notifies, GUI

**Version:** `18.8.3` — **PLAN** Must
**Plan:** [`79-next.md`](../79-next.md)
**Voraussetzung:** 325 (Parser + Pending).

## Ziel

Die genannten Zeitpunkte stehen am Termin und klingeln wirklich. In der
Kalender-GUI dieselben Fristen per Chip, Mehrfachwahl.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S326-1 | Schema | `store.ts` `CalendarEvent` | `remind_offsets_min?: number[]` (Minuten vor Start, 0 = am Termin). `addEvent` durchreichen. Alte Events ohne Feld = bisher Start-Notify |
| S326-2 | Planen | `calendar.ts` | Pro Offset `scheduleNotify`. Ids `evt-{id}` für 0, `evt-{id}-m{min}` sonst. `keine Erinnerung` cancelt Start. Delete/removeEvent cancelt **alle** |
| S326-3 | GUI | `Calendar.tsx` | Nach Speichern: Chips 24 h / 2 h / 1 h / 15 min / am Termin / keine. Mehrfach, dann übernehmen. Kein neues Overlay-System |
| S326-4 | Reply | | Bestätigung listet die Fristen auf Deutsch („24 Stunden und 2 Stunden davor“). Vergangene Offsets erwähnt |
| S326-5 | Test | Node | Zwei Offsets → zwei schedule-Calls (Mock). Delete → zwei cancel. Event ohne Feld → eine Start-Notify wie 18.7 |

## Won’t

- Mehr als 5 Chips-Pflicht. Relativ „wenn ich losgehe“ am Termin.
- System-Kalender schreiben.

## Abbruchkriterium

Zwei Fristen, eine Notify. Oder Löschen lässt die zweite Alarm-Id
klingen. Oder GUI-Speichern ohne Chip-Frage (außer Debug).

## Manuell

GUI-Termin speichern → 2 h + 15 min → zwei Einträge. Chat-Termin +
„am Termin“ → eine Notify zum Start.
