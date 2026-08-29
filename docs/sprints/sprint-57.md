# Sprint 57 — Timer + Klingeln (`1.7.0`)

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Priorität | **MUST** |
| Ziel-Version | **`1.7.0`** |
| Quelle | PO 2026-08-15 |

## Must

| ID | Inhalt | Done wenn |
|----|--------|-----------|
| T1 | Chat/Sprache: „Timer 8 Minuten“, „stell 10 Minuten Nudeln“, „Timer aus“ | Bestätigung mit Restzeit |
| T2 | Eigener Alarm-Kanal: Ton + Vibration, Kategorie Alarm (nicht nur Erinnerungs-Ping) | Man hört es |
| T3 | Bildschirm aus, Akku an: `AlarmManager` + Wakeup, Vollbild auf dem Sperrschirm bis Wegtippen | Klingelt im Standby |
| T4 | Exact-Alarm-Recht anfragen; nach Neustart wieder scharf | Nicht nur wenn die App offen ist |
| T5 | Version `1.7.0` + APK | Sideload |

## Probe

1. „Timer 1 Minute Test“ → Handy-Bildschirm aus → nach ~1 Minute Ton, nicht nur eine stille Kachel.
2. Antippen beendet den Ton. „Timer aus“ vorher bricht ab.
3. Gerät komplett aus: **kein** Klingeln — das ist korrekt.

## Won’t

Wake-Word, Widget, wiederkehrende Timer, Gerät ohne Strom.
