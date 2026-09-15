# Sprint 275 — SMS erst nach Funk-Annahme

**Version:** `18.1.0` — **CODE** Should
**Plan:** [`71-audit.md`](../71-audit.md) §3e Android, §4

## Ziel

„SMS gesendet“ gilt, wenn der Mobilfunk die Nachricht angenommen hat, nicht
wenn das System sie nur übernommen hat.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S275-1 | sentIntent | `JarvisDevicePlugin.java` `sendSms` | `PendingIntent` + Empfänger, `RESULT_OK` vs. Radio-Fehler, 10 s Timeout, Multipart |
| S275-2 | Copy | `places.ts`, `device.ts` | Erfolg: „hat der Funk angenommen“. Timeout JS 15 s: „Funk hat nicht bestätigt.“ |

## Won’t

- Zustellung beim Empfänger prüfen (das kann das Gerät nicht).

## Abbruchkriterium

Jarvis sagt „gesendet“, obwohl kein Funk da war.
