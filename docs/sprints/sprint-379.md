# Sprint 379 — Serie jede Woche / jeden Monat

**Version:** `18.17.0` — **CODE + APK** Must
**Plan:** [`89-next.md`](../89-next.md)
**Voraussetzung:** 377. Parser, nicht LLM.

## Ziel

`jeden Montag 18 Uhr Training` liegt als **eine** Zeile und erscheint
jeden Montag. `Jeden Dienstag Müll` bleibt Erinnerung.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S379-1 | Feld | `CalendarEvent.recur` | weekly / monthly |
| S379-2 | Parser | `calendar-parse.ts` | Clock Pflicht, sonst Reminder |
| S379-3 | Lesen | `expandEvents` | Liste, Folie, Marks, Watchdog |
| S379-4 | Gold | TEST_PROMPTS | `jeden Montag 18 Uhr Training` → calendar |

## Won’t

„Nur dieses Vorkommen löschen“. YEARLY. BYDAY-Listen.

## PO-Prüfung

1. Satz anlegen, Folie nächste Montage: Training.
2. Löschen: Serie weg, ehrlich.
