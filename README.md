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

**`Jarvis.apk` `1.28.2`:**  
https://github.com/Gamerio2904/Jarvis/raw/cursor/impl-1-16-1-24-0bf8/releases/Jarvis.apk

```bat
build-apk.bat
```

APK: `releases/Jarvis.apk`

1. Installieren (unbekannte Quellen).
2. App öffnen → Modell laden (WLAN).
3. Chat. Daten bleiben auf dem Gerät (IndexedDB).

Modell: Qwen2.5 0.5B Instruct Q4 (kleiner als der alte PC-7b, dafür offline).

## Was weg ist

Python-Backend, Ollama, NAS-Proxy, Docker. TV-Steuerung geparkt.

Planung: [`docs/README.md`](docs/README.md)
