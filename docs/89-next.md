# 89 — Kalender Alltag **CODE + APK** (`18.17.0`)

PO: Kalender muss den Alltag überleben — Sideload, Deinstall, Handywechsel —
und sich wie ein richtiger Kalender anfühlen. Recherche: Mozilla
[ical.js](https://github.com/kewisch/ical.js/) (RFC 5545),
[calrs](https://github.com/nathanael-h/calrs) (RRULE, Konflikt),
[DayOtter](https://github.com/Dayotter/dayotter) (Confirm-first, alle
Kalender). **Kein** Google-OAuth, kein CalDAV, kein Buchungslink.

Grundlage: Sideload **`18.17.0`**, versionCode `181700`. **Dieses Dokument ist nach Execute CODE + APK.**
Sprints **377–381**. App-Code **`18.17.0`**.

Andere Drafts bleiben getrennt: Koch `#149`, Kamera-Wahl `#151`, Clips `#152`,
Experte `#153`, Docs-Stand `#156`, Abbruch-Hotfix `#158`, PLAN `#159`.

## 0. Ist (Diagnose)

| Stelle | Heute (`18.16.0`) | Folge |
|--------|-------------------|--------|
| Hausstand | `events` **liegen** in der JSON (`listEvents`). Vorschau-Satz nannte Termine nicht. Import setzte nur eine Start-Notify, nicht `remind_offsets_min` | Roundtrip inkl. Fristen + ICS-Feld |
| ICS | Keine | RFC-5545-Teilmenge, ohne npm-Gewicht (ical.js als Vorbild) |
| Serie | Nur Erinnerungen `jeden Dienstag Müll`. Kalender einmalig | `jeden Montag 18 Uhr Training` → Kalender-Serie |
| Ende | Nur `start_at` | Default 60 min, `von 15 bis 16 Uhr`, ganztägig |
| Konflikt | Watchdog: Starts in 45 min | Intervalle + Hinweis beim Anlegen |

Gold heute: `Hausstand exportieren` → `backup`. **Kein** Gold für ICS / wöchentliches Training.

## 1. Leitentscheidung

| Thema | Entscheidung |
|-------|----------------|
| Hausstand | Termine **bleiben** im JSON. Zusätzlich `calendar_ics`. Import stellt Fristen über `scheduleEventNotifies` wieder |
| ICS-Datei | Nur Termine. Keys unangetastet. Merge nach UID |
| Serie | Eine Store-Zeile, Vorkommen beim Lesen. Löschen = ganze Serie (ehrlich, kein „nur dieses Mal“) |
| Konflikt | Anlegen trotzdem, Satz „Achtung: überlappt …“. Kein stilles Blocken |
| Router | `jeden Montag 18 Uhr Training` → calendar. `Jeden Dienstag Müll` bleibt reminder |
| Fremdkalender | Won’t: Google/CalDAV. Offizielle ICS-Datei reicht |

## 2. Warum nicht die naheliegenden Ideen

| Idee | Warum nicht |
|------|-------------|
| npm `ical.js` in der APK | Gewicht. Teilmenge lokal, Algorithmus sichtbar |
| Google Calendar Sync | Vision: lokaler Kalender, Keys nicht an Google |
| Calendly/DayOtter Booking | Jarvis ist kein Buchungslink |
| 64. Agent `ics` | calendar reicht |

## 3. Sprints (`18.17.0`)

Harte Kette: **377 → 378**. 379 nach 378. 380 parallel zu 379. 381 zuletzt.

| Sprint | Thema | Rolle |
|--------|--------|--------|
| 377 | Hausstand: Termine sichtbar, Fristen, `calendar_ics` | Must |
| 378 | ICS schreiben/lesen, Chat + Folie + Settings | Must |
| 379 | Serie weekly/monthly | Must |
| 380 | Dauer, ganztägig, Konflikt | Should |
| 381 | Tests bestehend + neu | Must |

Landet in App-Code **`18.17.0`**. Sideload **`18.17.0`**, versionCode `181700`.
Test: [`TEST-18.17.md`](./TEST-18.17.md).
