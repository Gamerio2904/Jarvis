# Jarvis — On-Device

<p align="center">
  <img src="frontend/native/brand/cover.png" alt="Jarvis" width="920" />
</p>

Privater Assistant. Läuft **auf dem Handy**. PC-Steuerung über die Windows-App `desktop/JarvisPC.bat` im selben WLAN — nicht über NAS/Docker.

## Start (Dev-PC, nur zum Bauen)

```bash
cd frontend
npm install
npm run dev
```

Browser: http://localhost:5173 — einmal „Modell herunterladen“ (~470 MB).

## Android-APK

**`Jarvis.apk` `2.2.2`:**  
https://github.com/Gamerio2904/Jarvis/raw/cursor/remove-test-settings-3638/releases/Jarvis.apk

```bat
build-apk.bat
```

APK: `releases/Jarvis.apk`

1. Installieren (unbekannte Quellen).
2. App öffnen → Modell laden (WLAN).
3. Chat. Daten bleiben auf dem Gerät (IndexedDB).

Modell: Qwen2.5 0.5B Instruct Q4 (kleiner als der alte PC-7b, dafür offline).

Als Nächstes: Sprint 47 Live-Qualität `0.13.3` — [`docs/16-fahrplan.md`](docs/16-fahrplan.md)

## Was weg ist

Fernseher, Fire TV, Ventilator und WLAN-Steckdosen laufen in der Android-App.

Planung: [`docs/README.md`](docs/README.md)
