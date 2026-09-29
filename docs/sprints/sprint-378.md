# Sprint 378 — ICS (RFC 5545 Teilmenge)

**Version:** `18.17.0` — **CODE + APK** Must
**Plan:** [`89-next.md`](../89-next.md)
**Voraussetzung:** 377.

## Ziel

Kalender als `.ics` raus und rein. Vorbild ical.js, ohne die Bibliothek
in die APK zu ziehen.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S378-1 | Writer/Parser | `calendar-ics.ts` | VEVENT, DTSTART/END, SUMMARY, LOCATION, RRULE, VALARM |
| S378-2 | Chat | `Kalender als ICS` | calendar, nicht backup |
| S378-3 | Folie | ICS-Knopf | Downloads |
| S378-4 | Settings | `.ics` wählen | Nur Termine mergen, Keys bleiben |

## Won’t

CalDAV. VTIMEZONE-Datenbank. EXDATE.

## PO-Prüfung

1. „Kalender als ICS“ legt eine Datei ohne Keys.
2. Dieselbe Datei unter Hausstand wählen → Termine da, Groq-Key unangetastet.
