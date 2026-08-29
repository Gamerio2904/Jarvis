# Sprint 113 — Hausstand Backup + Autokorrektur **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Priorität | **MUST** (vor nächstem Sideload) |
| Ziel-Version | `4.46.0` (bündelt `4.47`–`4.51`, ohne Sideload) |
| Quelle | PO: Deinstall wegen APK-Signatur; Keys/Erinnerungen/Nummern; Tippfehler Schreib+Sprache |
| Plan | [`38-next.md`](../38-next.md) |

## Code

- Export JSON `jarvis-haus-YYYYMMDD.json` (Settings+Memory+Reminders+Events+Notes+Todos+Shopping, Chats optional).
- Import: Datei → Vorschau → **Überschreiben ja**. Ohne Confirm nichts.
- Banner: Datei enthält API-Keys.
- Composer `lang=de` `spellCheck`. Key-Felder bleiben `spellCheck={false}`.
- `repairSpeech`: Barn+Nähe → Bar, Kalnader, Steckose. `pickHeard` kennt Memory-Namen.
- Kein Jarvis-Cloud, kein Sideload in diesem Schritt.
