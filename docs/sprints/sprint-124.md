# Sprint 124 — Einstellungen-Backup (`2.30.0`)

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Priorität | **MUST** |
| Ziel-Version | **`2.30.0`** |
| Quelle | PO: Backup für alle Felder, in die man etwas einträgt, plus Einstellungen allgemein — runterladen und hochladen |
| Voraussetzung | Sideload `2.29.2` |

## Ziel

Einstellungen komplett als JSON-Datei sichern und auf demselben oder einem neuen Handy wiederherstellen. Keine Chats, kein Gedächtnis, kein Kalender, keine Einkaufsliste.

## Must

| ID | Inhalt | Done wenn |
|----|--------|-----------|
| B1 | Export | Einstellungen → Allgemein → Sichern → Runterladen schreibt JSON (Keys, Hosts, TV-Token, Steckdosen, Schalter) |
| B2 | Import | Hochladen mit Bestätigung überschreibt alle Settings; unbekannte Keys ignoriert |
| B3 | Hinweis | UI sagt Datei nicht teilen; eigener Weckton gilt nur auf dem Gerät, das ihn gewählt hat |
| A1 | APK | `releases/Jarvis.apk` versionName `2.30.0` versionCode `23000` |

## Won’t

Chats/Memory/Kalender/Listen im Backup. Neues Settings-Thema. Cloud-Sync.
