# Sprint 377 — Hausstand nimmt Termine ernst

**Version:** `18.17.0` — **CODE + APK** Must
**Plan:** [`89-next.md`](../89-next.md)
**Voraussetzung:** main `18.16.0`. `events` sind schon im JSON.

## Ziel

Nach Export/Import sind **dieselben Termine** da, inkl. Erinnerungsfristen.
Die Vorschau nennt die Zahl.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S377-1 | Vorschau | `backup.ts` Settings | Satz und Zähler nennen Termine |
| S377-2 | Notify | `applyBackup` | `scheduleEventNotifies`, nicht nur Start |
| S377-3 | ICS im JSON | `calendar_ics` | Immer mitgeschrieben. Leeres `events` + ICS hydriert |

## Won’t

Google-Sync. Hausstand-Wipe der Keys bei ICS-only.

## PO-Prüfung

1. Termin anlegen, Hausstand exportieren, events im JSON, Termine in der Vorschau.
2. Import: Termin und Fristen wieder da.
