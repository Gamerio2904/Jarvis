# Jarvis Android (Capacitor) — `0.9.3`

Die APK ist ein **WebView-Client** um das Jarvis-Frontend. Das LLM läuft weiter auf dem **Heim-PC/NAS via Ollama** — nicht on-device.

## APK

- Debug-Build: [`releases/jarvis-0.9.3-debug.apk`](../releases/jarvis-0.9.3-debug.apk)
- App-ID: `de.gamerio.jarvis`
- Version: `0.9.3` (versionCode 93)

## Installation

1. Backend auf PC/NAS starten (`uvicorn` Port 8000, im LAN erreichbar).
2. APK aufs Handy installieren (unbekannte Quellen erlauben).
3. In der App: **Einstellungen → Server-URL** = `http://<LAN-IP-des-Servers>:8000` speichern.
4. Chat testen.

Emulator: oft `http://10.0.2.2:8000`.

## Neu bauen

```bash
# SDK vorausgesetzt (ANDROID_HOME)
cd frontend
npm install
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
# → app/build/outputs/apk/debug/app-debug.apk
```

Hilfsskript: `scripts/build_android_apk.sh`

## Hinweis

Kein In-App-Modell-Download. Ollama muss auf dem Server laufen.
