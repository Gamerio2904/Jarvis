# Jarvis — On-Device

<p align="center">
  <img src="frontend/native/brand/cover.png" alt="Jarvis" width="920" />
</p>

Privater Assistant auf dem **Handy**. Live **`2.29.1`** — was geht und was nicht: [`docs/00-now.md`](docs/00-now.md).

PC im selben WLAN: `desktop/JarvisPC.bat`. Kein NAS, kein Docker, kein Ollama.

## Start (Dev)

```bash
cd frontend
npm install
npm run dev
```

Browser: http://localhost:5173 — einmal Modell herunterladen (~470 MB, Qwen2.5 0.5B Instruct Q4).

## Android-APK

Sideload **`2.29.1`** (versionCode `22901`): [`docs/apk.md`](docs/apk.md)

Lokal bauen: `build-apk.bat` → `frontend/dist-apk/jarvis-debug.apk`

1. Unbekannte Quellen erlauben, APK installieren.
2. App öffnen → Modell laden (WLAN).
3. Chat. Daten bleiben auf dem Gerät (IndexedDB).

Fernseher, Fire TV, Ventilator und WLAN-Steckdosen laufen **in der App**, nicht über NAS.

Planung: [`docs/README.md`](docs/README.md)
