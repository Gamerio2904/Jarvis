# Sprint 113 — Hausstand Backup + Autokorrektur **PLAN**

| Feld | Wert |
|------|------|
| Status | **PLAN** |
| Priorität | **MUST** (vor nächstem Sideload) |
| Ziel-Version | `4.46.0` Research; Reihe `4.48`–`4.52` in [`38-next.md`](../38-next.md) |
| Quelle | PO: Deinstall wegen APK-Signatur; Keys/Erinnerungen/Nummern; Tippfehler Schreib+Sprache |
| Voraussetzung | Code `3.18.1` — Daten in `jarvis_settings_v13` + IDB `jarvis-ondevice` |
| Plan | [`38-next.md`](../38-next.md) |

## Ziel

Ein Export-File, ein Import. Composer und STT korrigieren Jarvis-Wörter, nicht API-Keys.

## Must

| ID | Inhalt | Done wenn |
|----|--------|-----------|
| N1 | Warum Deinstall alles löscht | Tabelle Speicher in `38-next.md` |
| N2 | Export/Import Umfang | Settings+Memory+Reminders+Events, Chats optional |
| N3 | Kein Jarvis-Cloud | lokal / Share |
| N4 | Autokorrektur ohne Bahn↔Bar-Blindflug | `repairSpeech` + Rückfrage |
| N5 | Won’t Cloud-Keys-Mail | Won’t |

## Won’t (dieser Sprint)

Execute-Code, Verschlüsselungspflicht, Auto-Backup als einziger Weg.
