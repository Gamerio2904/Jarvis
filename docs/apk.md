# Android-APK — Sideload `9.10.0`

App-Code und Sideload stehen auf **`9.10.0`**. LocateAnything-Gewichte nicht in der APK.

**Hirn:** Overlay **Gemini zuerst**. Einstellungen → Cloud: Gemini-Key (Toggle an). Groq Backup. Lokales 0,5B nur letzter Fallback — nicht nötig für Timer, Kugel, Wetter.

**Deinstall** (andere Signatur): WebView-Daten weg — Keys, Nummern, Erinnerungen. Hausstand-Export ist **CODE** ([`38-next.md`](./38-next.md)): vor Neuinstall Einstellungen → Hausstand → Exportieren. GGUF ebenfalls neu laden.

**Vor dem Überspielen von `9.9.2`:** Hausstand exportieren. Debug-Lauf hält bei Home (Meldung „Jarvis testet…“). App schließen beendet den Lauf.

**9.10.0:** Debug-FGS, Sehen-Freeze, Could-Schalter ohne ONNX. Serie: [`54-next.md`](./54-next.md). Katalog: [`sprints/sprint-168.md`](./sprints/sprint-168.md).

**9.9.2:** Kugel-Steuerung, GPS-Pin, Greeting/News/TV-Parser, schnellere Stimme.

**9.9.1:** Handy-Lage chat-first.

**9.9.0:** V1–V9 Industry-Track. Probe: Einstellungen → Probe V1–V9, jeder Prompt einzeln kopieren.

## Download

**Fertige APK `9.10.0`:**  
https://github.com/Gamerio2904/Jarvis/raw/main/releases/Jarvis.apk

Datei im Repo: `releases/Jarvis.apk`.

- Dateiname: `Jarvis.apk`
- versionName `9.10.0` · versionCode `91000`
- App-ID `local.jarvis.app`

1. Über die vorherige Sideload-APK installieren (oder nach Hausstand-Export neu).
2. App öffnen → **Gemini-Key eintragen** (oder Fertig — Tools ohne Modell).
3. Optional Groq. 0,5B nur Backup.
4. Screenshot-Katalog und V1–V9: Einstellungen → Tests.
