# Jarvis — On-Device

Privater Assistant. Läuft **auf dem Handy**. Kein PC, keine NAS, kein Docker.

## Start (Dev-PC, nur zum Bauen)

```bash
cd frontend
npm install
npm run dev
```

Browser: http://localhost:5173 — einmal „Modell herunterladen“ (~470 MB).

## Android-APK

```bat
build-apk.bat
```

APK: `frontend\dist-apk\jarvis-debug.apk`

1. Installieren (unbekannte Quellen).
2. App öffnen → Modell laden (WLAN).
3. Chat. Daten bleiben auf dem Gerät (IndexedDB).

Modell: Qwen2.5 0.5B Instruct Q4 (kleiner als der alte PC-7b, dafür offline).

Als Nächstes (geplant): Latenz `0.13.2` → Qualität `0.13.3` → optional 1.5B `0.13.4` — [`docs/14-on-device-iq.md`](docs/14-on-device-iq.md)

## Was weg ist

Python-Backend, Ollama, NAS-Proxy, Docker. TV-Steuerung geparkt.

Planung: [`docs/README.md`](docs/README.md)
