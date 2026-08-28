# Android-APK — Sideload `6.60.0`

App-Code und Sideload stehen auf **`6.60.0`**. LocateAnything-Gewichte nicht in der APK.

**Hirn:** Overlay **Gemini zuerst**. Einstellungen → Cloud: Gemini-Key (Toggle an). Groq Backup. Lokales 0,5B nur letzter Fallback — nicht nötig für Timer, Kugel, Wetter.

**Deinstall** (andere Signatur): WebView-Daten weg — Keys, Nummern, Erinnerungen. Hausstand-Export ist **CODE** ([`38-next.md`](./38-next.md)): vor Neuinstall Einstellungen → Hausstand → Exportieren. GGUF ebenfalls neu laden.

**6.60.0:** Overlay Gemini zuerst. Parser `6.51`. Split + Identität. Bühne & Globus aus `6.50`.

## Download

**APK `6.60.0`:**  
`releases/Jarvis.apk` im Repo (dieser Branch / nach Merge `main`).

- Dateiname: `Jarvis.apk`
- versionName `6.60.0` · versionCode `66000`
- App-ID `local.jarvis.app`

1. Über die vorherige Sideload-APK installieren (oder nach Hausstand-Export neu).
2. App öffnen → **Gemini-Key eintragen** (oder Fertig — Tools ohne Modell).
3. Optional Groq. 0,5B nur Backup.
