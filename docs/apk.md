# Android-APK — `2.29.2`

Live-Stand: [`00-now.md`](./00-now.md). Kaufmodus getrennt von der Einkaufsliste. Interner Debug: Einstellungen → Tests. „Nochmal“ wiederholt den letzten Befehl. Fernseher koppeln per Stimme.

## Download

**APK `2.29.2`:**  
https://github.com/Gamerio2904/Jarvis/raw/cursor/jarvis-2-29-4728/releases/Jarvis.apk

- Dateiname: `Jarvis.apk`
- versionName `2.29.2` · versionCode `22902` (aus `frontend/package.json`)
- App-ID `local.jarvis.app`

Über 2.29.1 installieren.

## Lokal bauen

`build-apk.bat` im Repo-Root. Ausgabe: `frontend/dist-apk/jarvis-debug.apk` (Debug-Build aus Gradle). Das veröffentlichte Sideload-Artefakt liegt unter `releases/Jarvis.apk` auf dem Release-Branch — nicht dieselbe Datei wie der lokale Debug-Output.
