# Jarvis — On-Device

<p align="center">
  <img src="frontend/native/brand/cover.png" alt="Jarvis" width="920" />
</p>

Privater Assistant. Läuft **auf dem Handy**. App-Code **`6.99.0`**. Sideload zuletzt **`6.90.0`**. PC-Steuerung über die Windows-App `desktop/JarvisPC.bat` im selben WLAN — nicht über NAS/Docker.

**Hirn:** Gemini (API-Key in Einstellungen → Cloud) ist der **Hauptweg**. Groq ist Backup. Das lokale 0,5B-Qwen ist **reiner letzter Fallback**, kein ChatGPT. Parser wählen die Geräte; das Modell formuliert. Tools, Speicher und Keys bleiben auf dem Gerät.

## Start (Dev-PC, nur zum Bauen)

```bash
cd frontend
npm install
npm run dev
```

Browser: http://localhost:5173 — Overlay **Gemini zuerst**. Gemini-Key eintragen. Lokales 0,5B nur als Backup (~470 MB), nicht nötig für Timer, Kugel, Wetter.

## Android-APK

Sideload **`Jarvis.apk` `6.90.0`** (versionCode `69000`):  
`releases/Jarvis.apk` in diesem Repo.

```bat
build-apk.bat
```

Linux: `./build-apk.sh`

1. Installieren (unbekannte Quellen). Vor Neuinstall: Einstellungen → Hausstand → Exportieren — Deinstall löscht Keys.
2. App öffnen → Overlay: **Gemini-Key eintragen**. Optional Groq. 0,5B nur Backup.
3. Chat. Daten bleiben auf dem Gerät (IndexedDB).

## Was weg ist

Fernseher, Fire TV, Ventilator und WLAN-Steckdosen laufen in der Android-App.

Planung: [`docs/README.md`](docs/README.md) · Rest: LocateAnything-Gewichte nach 3060-GO, Debug-Hintergrund `5.12`, Alltag `8.0`, Recall `7.0`.
