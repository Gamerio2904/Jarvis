# Jarvis — On-Device

<p align="center">
  <img src="frontend/native/brand/cover.png" alt="Jarvis" width="920" />
</p>

Privater Assistant. Läuft **auf dem Handy**. App-Code **`5.11.0`**. Sideload **`3.18.1`**. PC-Steuerung über die Windows-App `desktop/JarvisPC.bat` im selben WLAN — nicht über NAS/Docker.

## Start (Dev-PC, nur zum Bauen)

```bash
cd frontend
npm install
npm run dev
```

Browser: http://localhost:5173 — einmal „Modell herunterladen“ (~470 MB).

## Android-APK

Letzter Sideload **`Jarvis.apk` `3.18.1`** (Code `3.19.0`):  
https://github.com/Gamerio2904/Jarvis/raw/main/releases/Jarvis.apk

```bat
build-apk.bat
```

Linux: `./build-apk.sh`

APK: `releases/Jarvis.apk`

1. Installieren (unbekannte Quellen).
2. App öffnen → Modell laden (WLAN).
3. Chat. Daten bleiben auf dem Gerät (IndexedDB).

Modell: Qwen2.5 0.5B Instruct Q4 (kleiner als der alte PC-7b, dafür offline).

## Was weg ist

Fernseher, Fire TV, Ventilator und WLAN-Steckdosen laufen in der Android-App.

Planung: [`docs/README.md`](docs/README.md) · offene Pläne: Körper `4.66`, Sehen `4.76`, Debug-Lauf `5.11`
