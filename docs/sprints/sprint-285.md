# Sprint 285 — Erinnerung an eine Idee, nur auf Auftrag

**Version:** `18.2.2` — **PLAN** Should
**Plan:** [`72-next.md`](../72-next.md)
**Voraussetzung:** Sprints **283** und **284** (Nummer aus der letzten Liste)

## Ziel

Wer sagt „erinner mich in zwei Wochen an Idee 1“, bekommt genau das. Wer
nichts sagt, bekommt nichts. Kein wöchentliches Nachhaken aus dem Nichts.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S285-1 | Wochen | `remind-parse.ts` | `REL_UNIT` um `wochen?` erweitern. `in 2 Wochen Milch` bleibt eine normale Erinnerung. Test: 14 Tage, gleiche Uhr |
| S285-2 | Idee + Zeit | `idea-parse.ts` | `erinner(?:e)? mich in (.+) an (?:die )?idee\s+(.+)`, `hak(?:e)? idee\s+(.+) in (.+)`. Titel oder Listennummer. Ohne Zeit → ehrlich: `Wann soll ich daran erinnern?` — **kein** Default |
| S285-3 | Anlegen | `idea.ts` + `addReminder` | `title` der Erinnerung: `Idee: {idea.title}`. `kind: 'once'`. Kein `recur: 'weekly'` aus diesem Satz. Bestehende Notification-Pfade (AlarmManager, `MY_PACKAGE_REPLACED`) unverändert |
| S285-4 | Trennlinie | Konflikte + Test | `Erinner mich in 20 Minuten an Milch` bleibt `reminder`, nicht `idea`. `Erinner mich an Idee Lidl` ohne Zeit fragt nach, legt nichts an |
| S285-5 | Test | `test-idea.mjs` + bestehendes Remind-Skript | Wochen-Relativ. Idee-Satz erzeugt eine offene Erinnerung mit dem Ideentitel. Ohne Zeit: keine Zeile in `reminders` |

## Won’t

- Wöchentlicher Digest, Stale-Scan, „du hast 4 Ideen seit 14 Tagen“.
- `recur: 'weekly'` ohne dass der Satz „jeden …“ enthält (das kann der
  bestehende Reminder-Parser weiter).
- Push, weil `updated_at` alt ist.
- Kalender-Termin statt Erinnerung.

## Abbruchkriterium

Eine Ideen-Erinnerung ohne Satz. Oder `in 2 Wochen Milch` wird eine Idee.

## Manuell

```
Idee: Freitag Lage nur mit Chat
Erinner mich in 2 Wochen an Idee 1
```

Bestätigung mit Datum. Ohne den zweiten Satz kommt keine Notification.
