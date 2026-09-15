Privater Assistant. Läuft **auf dem Handy**. App-Code **`18.1.0`**. Sideload-APK **`18.0.7`**. PC-Steuerung: `desktop/JarvisPC.bat` → **QR-Code öffnen**, auf dem Handy scannen.

**Hirn:** **Groq primär** (API-Key). **Gemini Spezialist** (Vision, Deep Research). Lokales 0,5B **Fallback**. Agenten-Netzwerk: Director + 60 Domänen-Agenten, Agenten-Karte in Lage. Parser wählen Geräte; Groq/Gemini formuliert Smalltalk.

## Start (Dev-PC, nur zum Bauen)

```bash
cd frontend
npm install
npm run dev
```

Browser: http://localhost:5173 — Groq-Key für Smalltalk. Gemini für Vision/Deep. Lokales 0,5B Backup (~470 MB).

## Android-APK

Sideload **`Jarvis.apk` `18.0.7`** (versionCode `180007`):  
https://github.com/Gamerio2904/Jarvis/raw/main/releases/Jarvis.apk

```bat
build-apk.bat
```

Linux: `./build-apk.sh`

Testanleitung: [`docs/TEST-18.1.0.md`](docs/TEST-18.1.0.md) · Versionen: [`docs/apk.md`](docs/apk.md)

1. Installieren (unbekannte Quellen). Vor Neuinstall: Einstellungen → Hausstand → Exportieren — Deinstall löscht Keys.
2. **Groq-Key** eintragen (Smalltalk). Optional **Gemini** (Vision/Research).
3. Chat. Daten bleiben auf dem Gerät (IndexedDB).

## Prüfen

```bash
cd frontend
npm run lint
npx tsc -b
bash scripts/run-all-tests.sh
```

Fernseher, Fire TV, Ventilator und WLAN-Steckdosen laufen in der Android-App, nicht im Browser.

Planung: [`docs/README.md`](docs/README.md) · Änderungen: [`docs/CHANGELOG.md`](docs/CHANGELOG.md)
