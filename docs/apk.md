# Android-APK — On-Device (`0.14.1`)

Jarvis denkt **auf dem Handy**. Einmal Modell laden (~470 MB, WLAN), danach **offline**. Fernseher: suchen, koppeln, steuern — nativ in der APK.

## Download

**Debug-APK `0.14.1` (Qualität + TV):**  
https://github.com/Gamerio2904/Jarvis/raw/cursor/impl-0-14-0bf8/releases/jarvis-0.14.1-debug.apk

- App-ID: `local.jarvis.app`
- versionName `0.14.1` · versionCode `141`
- Modell von `0.13.x` bleibt auf dem Gerät — kein erneuter 470-MB-Download

1. Alte App überschreiben oder deinstallieren.
2. APK installieren (unbekannte Quellen).
3. App öffnen → Modell starten, wenn es schon da ist.
4. Chat: Memory/Todos in Alltagssprache; Status sagt **Gerät**, nicht Ollama.
5. Einstellungen → Fernseher: suchen → am TV erlauben → testen. Dann „Fernseher an/aus“, „lauter“, „HDMI 2“.

## Selbst bauen

```bat
build-apk.bat
```

Linux (nach `npx cap add android`):

```bash
cd frontend
npm install
npm run build
npx cap sync android
node scripts/apply-native-tv.mjs
cd android && ./gradlew assembleDebug --no-daemon
```

Ergebnis: `frontend/android/app/build/outputs/apk/debug/app-debug.apk`
