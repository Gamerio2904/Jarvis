# Android-APK — `2.30.0`

Live-Stand: [`00-now.md`](./00-now.md). Einstellungen als JSON runterladen und hochladen. Kaufmodus getrennt von der Einkaufsliste. Interner Debug: Einstellungen → Tests. „Nochmal“ wiederholt den letzten Befehl. Fernseher koppeln per Stimme.

## Download

**APK `2.30.0`:**  
https://github.com/Gamerio2904/Jarvis/raw/cursor/jarvis-2-29-4728/releases/Jarvis.apk

- Dateiname: `Jarvis.apk`
- versionName `2.30.0` · versionCode `23000` (aus `frontend/package.json`)
- App-ID `local.jarvis.app`

Über 2.29.2 installieren.

## Lokal bauen

`build-apk.bat` im Repo-Root. Ausgabe: `frontend/dist-apk/jarvis-debug.apk` (Debug-Build aus Gradle). Das veröffentlichte Sideload-Artefakt liegt unter `releases/Jarvis.apk` auf dem Release-Branch — nicht dieselbe Datei wie der lokale Debug-Output.
