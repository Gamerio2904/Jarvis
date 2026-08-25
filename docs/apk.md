# Android-APK — `2.29.1`

Live-Stand: [`00-now.md`](./00-now.md). Kaufmodus getrennt von der Einkaufsliste. Tablet / Sprachmodus / internes CarPlay nachgezogen. Interner Debug: Einstellungen → Tests.

## Download

**APK `2.29.1`:**  
https://github.com/Gamerio2904/Jarvis/raw/cursor/jarvis-2-29-4728/releases/Jarvis.apk

- Dateiname: `Jarvis.apk`
- versionName `2.29.1` · versionCode `22901` (aus `frontend/package.json`)
- App-ID `local.jarvis.app`

Über 2.29.0 installieren.

## Lokal bauen

`build-apk.bat` im Repo-Root. Ausgabe: `frontend/dist-apk/jarvis-debug.apk` (Debug-Build aus Gradle). Das veröffentlichte Sideload-Artefakt liegt unter `releases/Jarvis.apk` auf dem Release-Branch — nicht dieselbe Datei wie der lokale Debug-Output.
