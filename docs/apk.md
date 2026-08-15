# Android-APK — On-Device (`0.13.2`)

Jarvis denkt **auf dem Handy**. Einmal Modell laden (~470 MB, WLAN), danach **offline**.

## Download

**Debug-APK `0.13.2` (Chat-Hang Hotfix):**  
https://github.com/Gamerio2904/Jarvis/raw/cursor/hotfix-0-13-2-0bf8/releases/jarvis-0.13.2-debug.apk

- App-ID: `local.jarvis.app`
- versionName `0.13.2` · versionCode `132`
- Modell von `0.13.1` bleibt auf dem Gerät — kein erneuter 470-MB-Download

1. Alte App deinstallieren oder überschreiben.
2. APK installieren (unbekannte Quellen).
3. App öffnen → wenn das Modell schon da ist, nur starten.
4. „Hallo Jarvis“ — Text oder klare Fehlermeldung, kein endloses Tippen.

## Selbst bauen

```bat
build-apk.bat
```

Ergebnis: `frontend\dist-apk\jarvis-debug.apk`
