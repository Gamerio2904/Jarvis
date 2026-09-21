# Sprint 325 — Termin: fragen wann erinnern

**Version:** `18.8.2` — **CODE** Must
**Plan:** [`79-next.md`](../79-next.md)
**Voraussetzung:** Code `18.7.0`. Darf neben 323/324, braucht 326 für Persist.

## Ziel

Nach einem angelegten Termin fragt Jarvis, wann er erinnern soll. Der
Nutzer nennt **einen oder mehrere** Zeitpunkte („24 Stunden davor und
2 Stunden davor“). Parser, kein LLM.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S325-1 | Create-Reply | `calendar.ts` `handleCalendar` | Nach `addEvent` + Start-Notify: Pending `calendar`/`remind_offsets` + Frage-Satz aus [`79-next.md`](../79-next.md) §3.3 |
| S325-2 | Parser | `calendar-parse.ts` oder `remind-parse.ts` | `parseRemindOffsets(text)` → Minuten[] / `none` / `at_start` / null. `und` `,` `;`. Cap 5. Worte ein/zwei/… |
| S325-3 | Folgezug | `handleCalendar` oder Director-Pending | Trifft Parser → Offsets an 326 übergeben. Ablenkung → Pending fällt, Termin bleibt. `in 10 Minuten` ohne davor ≠ Offset |
| S325-4 | Debug-Skip | | `debugSnapshot().running` → keine Frage, kein Pending (327 wiederholt den Guard) |
| S325-5 | Test | Node | `24 Stunden davor und 2 Stunden davor` → `[1440, 120]`. `keine Erinnerung` → none. Vergangener Offset bei Start in 30 min + „2 Tage davor“ → skip |

## Won’t

- LLM-Minuten. Mehr als 5 Fristen. Cloud-Kalender.
- Frage blockiert den Debug-Lauf.

## Abbruchkriterium

`Termin morgen 15 Uhr Zahnarzt` endet ohne Frage (außer Debug-Lauf).
Oder „und“ liefert nur den ersten Offset. Oder Wetter nach der Frage
löscht den Termin.

## Manuell

Chat: Termin anlegen → Frage → zwei Fristen. Zweiter Termin → „keine
Erinnerung“. Dritter → Ablenkung „Wie wird das Wetter?“ → Termin bleibt.
