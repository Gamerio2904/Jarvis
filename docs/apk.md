# Android-APK — `2.2.2`

Live-Stand: [`00-now.md`](./00-now.md). Keine Testprompts in der App. Chat ohne Chips.

## Download

**APK `2.2.2`:**  
https://github.com/Gamerio2904/Jarvis/raw/cursor/remove-test-settings-3638/releases/Jarvis.apk

- Dateiname: `Jarvis.apk`
- versionName `2.2.2` · versionCode `20202` (aus `frontend/package.json`)
- App-ID `local.jarvis.app`

Über 2.2.1 installieren. Einstellungen hat kein Thema Tests.

## Lokal bauen

`build-apk.bat` im Repo-Root. Ausgabe: `frontend/dist-apk/jarvis-debug.apk` (Debug-Build aus Gradle). Das veröffentlichte Sideload-Artefakt liegt unter `releases/Jarvis.apk` auf dem Release-Branch — nicht dieselbe Datei wie der lokale Debug-Output.
