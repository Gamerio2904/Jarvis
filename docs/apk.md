# Android-APK — Sideload `9.9.2`

App-Code steht auf **`9.9.2`**. Sideload-Datei folgt, sobald `releases/Jarvis.apk` gebaut ist (versionCode `90902`). LocateAnything-Gewichte nicht in der APK.

**Hirn:** Overlay **Gemini zuerst**. Einstellungen → Cloud: Gemini-Key (Toggle an). Groq Backup. Lokales 0,5B nur letzter Fallback — nicht nötig für Timer, Kugel, Wetter.

**Deinstall** (andere Signatur): WebView-Daten weg — Keys, Nummern, Erinnerungen. Hausstand-Export ist **CODE** ([`38-next.md`](./38-next.md)): vor Neuinstall Einstellungen → Hausstand → Exportieren. GGUF ebenfalls neu laden.

**9.9.2:** Kugel-Steuerung, GPS-Pin, Greeting/News/TV-Parser, schnellere Stimme. Katalog: [`sprints/sprint-168.md`](./sprints/sprint-168.md).

**9.9.1:** Handy-Lage chat-first.

**9.9.0:** V1–V9 Industry-Track. Probe: Einstellungen → Probe V1–V9, jeder Prompt einzeln kopieren.

## Download

**APK:**  
`releases/Jarvis.apk` im Repo (nach Build `9.9.2` / `90902`; bis dahin kann die Datei noch `9.9.1` sein).

- Dateiname: `Jarvis.apk`
- versionName aus `frontend/package.json` · versionCode vom Native-Script
- App-ID `local.jarvis.app`

1. Über die vorherige Sideload-APK installieren (oder nach Hausstand-Export neu).
2. App öffnen → **Gemini-Key eintragen** (oder Fertig — Tools ohne Modell).
3. Optional Groq. 0,5B nur Backup.
4. Screenshot-Katalog und V1–V9: Einstellungen → Tests.
