# Android-APK — Sideload `9.9.1`

App-Code und Sideload stehen auf **`9.9.1`**. LocateAnything-Gewichte nicht in der APK.

**Hirn:** Overlay **Gemini zuerst**. Einstellungen → Cloud: Gemini-Key (Toggle an). Groq Backup. Lokales 0,5B nur letzter Fallback — nicht nötig für Timer, Kugel, Wetter.

**Deinstall** (andere Signatur): WebView-Daten weg — Keys, Nummern, Erinnerungen. Hausstand-Export ist **CODE** ([`38-next.md`](./38-next.md)): vor Neuinstall Einstellungen → Hausstand → Exportieren. GGUF ebenfalls neu laden.

**9.9.0:** V1–V9 Industry-Track (Overlay, Voice/App, verified Actions, Dateien, Memory, TV, PC, Live, Hardening). Probe: Einstellungen → Probe V1–V9, jeder Prompt einzeln kopieren.

## Download

**APK `9.9.1`:**  
`releases/Jarvis.apk` im Repo.

- Dateiname: `Jarvis.apk`
- versionName `9.9.1` · versionCode `90901`
- App-ID `local.jarvis.app`

1. Über die vorherige Sideload-APK installieren (oder nach Hausstand-Export neu).
2. App öffnen → **Gemini-Key eintragen** (oder Fertig — Tools ohne Modell).
3. Optional Groq. 0,5B nur Backup.
4. V1–V9 selbst prüfen: Einstellungen → Probe V1–V9 → Kopieren → ins Chatfeld.
