Privater Assistant. Läuft **auf dem Handy**. App-Code **`15.3.0`**. Sideload **`15.3.0`**. PC-Steuerung: `desktop/JarvisPC.bat` → **QR-Code öffnen**, auf dem Handy scannen.

**Hirn (15.1):** **Groq primär** (API-Key). **Gemini Spezialist** (Vision, Deep Research). Lokales 0,5B **Fallback**. Agenten-Netzwerk: Director + 60 Domänen-Agenten, Agenten-Karte in Lage. Parser wählen Geräte; Groq/Gemini formuliert Smalltalk.

## Start (Dev-PC, nur zum Bauen)

```bash
cd frontend
npm install
npm run dev
```

Browser: http://localhost:5173 — Groq-Key für Smalltalk. Gemini für Vision/Deep. Lokales 0,5B Backup (~470 MB).

## Android-APK

Sideload **`Jarvis.apk` `15.1.0`** (versionCode `150100`):  
https://github.com/Gamerio2904/Jarvis/raw/main/releases/Jarvis.apk

Testanleitung: [`docs/TEST-15.1.0.md`](docs/TEST-15.1.0.md)

```bat
build-apk.bat
```

Linux: `./build-apk.sh`

1. Installieren (unbekannte Quellen). Vor Neuinstall: Einstellungen → Hausstand → Exportieren — Deinstall löscht Keys.
2. **Groq-Key** eintragen (Smalltalk). Optional **Gemini** (Vision/Research).
3. Chat. Daten bleiben auf dem Gerät (IndexedDB).

## Was weg ist

Fernseher, Fire TV, Ventilator und WLAN-Steckdosen laufen in der Android-App.

Planung: [`docs/README.md`](docs/README.md) · Rest: LocateAnything-Gewichte nach 3060-GO, Debug-Hintergrund `5.12`, Alltag `8.0`, Recall `7.0`.
