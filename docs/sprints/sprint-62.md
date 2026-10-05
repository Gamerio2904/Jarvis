# Sprint 62 — Wecker + eigener Ton (`1.12.0`)

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Priorität | **MUST** |
| Ziel-Version | **`1.12.0`** |
| Quelle | PO 2026-08-15 |

## Must

| ID | Inhalt | Done wenn |
|----|--------|-----------|
| A1 | „Wecker 7 Uhr“ einmal, „Wecker 7 Uhr jeden Tag“ / Montag mit Wiederholung | Chat bestätigt |
| A2 | Klingelt bei Bildschirm aus (Akku an) | Gleicher Alarm-Pfad wie 1.7 |
| A3 | Einstellungen: eigenen Ton aus dem System-Picker | Gewählter Ton wird abgespielt |
| A4 | Version `1.12.0` + APK | Sideload |

## Probe

1. „Wecker 7 Uhr“ → einmalig, nächster 7-Uhr-Termin.
2. „Wecker 7 Uhr jeden Tag“ → wiederholt.
3. Ton wählen → nächster Wecker nutzt ihn.
4. Gerät komplett aus: kein Klingeln.

## Won’t

Eigene MP3-Dateien ohne System-Picker, iOS.
