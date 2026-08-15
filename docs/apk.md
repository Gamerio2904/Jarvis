# Android-APK — On-Device (`0.13.1`)

Jarvis denkt **auf dem Handy**. Einmal Modell laden (~470 MB, WLAN), danach **offline**.

## Download

**Debug-APK `0.13.1` (Hotfix):**  
https://github.com/Gamerio2904/Jarvis/raw/cursor/apk-0-13-1-0bf8/releases/jarvis-0.13.1-debug.apk

- App-ID: `local.jarvis.app`
- versionName `0.13.1` · versionCode `131`
- ~18 MB (ohne Modell; das kommt beim ersten Start)

1. APK installieren (unbekannte Quellen).
2. App öffnen → **Modell herunterladen** (WLAN, ~470 MB).
3. Chat, merken, Todos — alles lokal. App schließen/öffnen lädt das Modell nicht neu.

## Selbst bauen

```bat
build-apk.bat
```

Ergebnis: `frontend\dist-apk\jarvis-debug.apk`
