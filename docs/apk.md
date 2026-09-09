# Android-APK — Sideload `15.3.0`

App-Code **`15.3.0`**. Sideload-APK **`15.3.0`**. LocateAnything-Gewichte nicht in der APK.

**15.3.0:** PC-Dashboard (Desktop + gepairt): Agent-Karte + Aktionsstream. Lage Phase-2: lazy Kacheln, Body idle rAF, Kugel auto-lite.

**15.2.0:** GUI-Fixes: Overlays, Kalender, AgentStatusBar, Kugel-Steuerung.

**15.1.0:** Agenten-Netzwerk + Dual Brain (Groq primär). Rollback: `agent_network_v2: false`, `brain_v2: false`.

**Deinstall** (andere Signatur): WebView-Daten weg. Vor Neuinstall Hausstand exportieren.

## Download

**Fertige APK `15.3.0`:**  
https://github.com/Gamerio2904/Jarvis/raw/main/releases/Jarvis.apk

- Dateiname: `Jarvis.apk`
- versionName `15.3.0` · versionCode `150300`
- App-ID `local.jarvis.app`

1. Über die vorherige Sideload-APK installieren (oder nach Hausstand-Export neu).
2. **Groq-Key** unter Einstellungen → API-Keys. **Gemini-Key** für Vision/Deep Research.
3. PC: `desktop/JarvisPC.bat` → QR scannen → Desktop zeigt PC-Dashboard im Chat.

## Build lokal

```bash
./build-apk.sh
```

Output: `releases/Jarvis.apk`
