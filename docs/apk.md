# Android-APK — Sideload `6.90.1`

App-Code und Sideload stehen auf **`6.90.1`**. LocateAnything-Gewichte nicht in der APK.

**Hirn:** Overlay **Gemini zuerst**. Einstellungen → Cloud: Gemini-Key (Toggle an). Groq Backup. Lokales 0,5B nur letzter Fallback — nicht nötig für Timer, Kugel, Wetter.

**6.90.1:** Sprachmodus bleibt bei Stille offen (kein An/Aus, kein Pieps). Gemini spricht nur Deutsch, keinen englischen Vorspann. Android-Stimme langsamer/tiefer.

**Deinstall** (andere Signatur): WebView-Daten weg — Keys, Nummern, Erinnerungen. Hausstand-Export ist **CODE** ([`38-next.md`](./38-next.md)): vor Neuinstall Einstellungen → Hausstand → Exportieren. GGUF ebenfalls neu laden.

**6.90.0 bleibt:** Globus-Briefing (Stadt → GIBS + Briefing, Welt-Tour). Dazu `6.60`: Overlay Gemini zuerst, Parser `6.51`, Split + Identität, Bühne.

## Download

**APK `6.90.1`:**  
https://github.com/Gamerio2904/Jarvis/raw/cursor/tablet-modus-phone-ask-b173/releases/Jarvis.apk

- Dateiname: `Jarvis.apk`
- versionName `6.90.1` · versionCode `69001`
- App-ID `local.jarvis.app`

1. Über die vorherige Sideload-APK installieren (oder nach Hausstand-Export neu).
2. Raw-Link, nicht die GitHub-Vorschau — sonst „Paket ungültig“.
