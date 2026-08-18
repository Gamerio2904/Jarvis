# Jarvis — On-Device

<p align="center">
  <img src="frontend/native/brand/cover.png" alt="Jarvis" width="920" />
</p>

Privater Assistant. Läuft **auf dem Handy**. Kein PC, keine NAS, kein Docker.

## Start (Dev-PC, nur zum Bauen)

```bash
cd frontend
npm install
npm run dev
```

Browser: http://localhost:5173 — einmal „Modell herunterladen“ (~470 MB).

## Android-APK

**`Jarvis.apk` `1.43.0`:**  
https://github.com/Gamerio2904/Jarvis/raw/cursor/updates-1-29-1-33-3638/releases/Jarvis.apk

```bat
build-apk.bat
```

APK: `releases/Jarvis.apk`

1. Installieren (unbekannte Quellen).
2. App öffnen → Modell laden (WLAN).
3. Chat. Daten bleiben auf dem Gerät (IndexedDB).

Modell: Qwen2.5 0.5B Instruct Q4 (kleiner als der alte PC-7b, dafür offline).

## Was weg ist

Python-Backend, Ollama, NAS-Proxy, Docker. Fernseher, Fire TV und Ventilator laufen in der Android-App.

Planung: [`docs/README.md`](docs/README.md)
