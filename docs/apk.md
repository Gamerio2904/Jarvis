# Android-APK — Sideload `6.91.0`

App-Code und Sideload stehen auf **`6.91.0`**. LocateAnything-Gewichte nicht in der APK.

**Hirn:** Overlay **Gemini zuerst**. Einstellungen → API-Keys: Gemini-Key (Toggle unter Hirn). Groq Backup. Lokales 0,5B nur letzter Fallback — nicht nötig für Timer, Kugel, Wetter.

**Deinstall** (andere Signatur): WebView-Daten weg — Keys, Nummern, Erinnerungen. Hausstand-Export ist **CODE** ([`38-next.md`](./38-next.md)): vor Neuinstall Einstellungen → Hausstand → Exportieren. GGUF ebenfalls neu laden.

**6.90.0:** Globus-Briefing (Stadt → GIBS + Briefing, Welt-Tour). Dazu `6.60`: Overlay Gemini zuerst, Parser `6.51`, Split + Identität, Bühne.

## Download

**APK `6.91.0`:**  
`releases/Jarvis.apk` im Repo.

- Dateiname: `Jarvis.apk`
- versionName `6.91.0` · versionCode `69100`
- App-ID `local.jarvis.app`

1. Über die vorherige Sideload-APK installieren (oder nach Hausstand-Export neu).
2. App öffnen → **Gemini-Key eintragen** (oder Fertig — Tools ohne Modell).
3. Optional Groq. 0,5B nur Backup.
