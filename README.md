Privater Assistant. Die aktuelle App-Version ist **`18.66.0`** (versionCode `186600`). Sie läuft als Android-App; zusätzlich gibt es eine Browser-Dev-Oberfläche. Der Stand ist ein Test-Build, keine finale Geräte- oder Release-Freigabe. Dieselbe Nummer steht in `frontend/package.json`, `APP_VERSION` und in `releases/Jarvis.apk`. PC-Steuerung: `desktop/JarvisPC.bat` → **QR-Code öffnen**, auf dem Handy scannen. YouTube-Schnitt schreibt die Datei erst, wenn JarvisPC auf Windows läuft.

**Hirn:** **Groq primär** (API-Key). **Gemini Spezialist** (Vision, Deep Research). Lokales 0,5B **Fallback**. Agenten-Netzwerk: Director + 60 Domänen-Agenten, Agenten-Karte in Lage. Parser wählen Geräte; Groq/Gemini formuliert Smalltalk.

## Start (Dev-PC, nur zum Bauen)

```bash
cd frontend
npm install
npm run dev
```

Browser: http://localhost:5173 — Groq-Key für Smalltalk. Gemini für Vision/Deep. Lokales 0,5B Backup (~470 MB).

## Android-App und Tablet

Die Android-App enthält Notizen/Todos, die überarbeitete Tischplatte, Echo-Theme, Tabletmodus und das Yu-Gi-Oh!-Duell: Self-Play, Zugsuche, Nachweis (`18.45.0`), das TCG-Subset aus Plan 105 und die Master-Duel-Bedienung aus Plan 106 (`engineStamp` `18.60.0-ygo-md`). Einstieg und Grenzen stehen in [`docs/yugioh-duel.md`](docs/yugioh-duel.md). Der Tabletmodus zeigt die Lage im Vollbild; der Hausstand-Server wird separat und ausdrücklich gestartet. Die Hausstand-Kopplung nutzt TLS mit Geräte-Zertifikat-Pinning und blockiert Sync bei abweichender App-/Protokollversion. Hausstand-Abgleich beruht derzeit noch auf Zeitstempeln, nicht auf kausalen Revisionen.

Der Sideload heißt **`Jarvis.apk` `18.66.0`** (versionCode `186600`, `engineStamp` `18.60.0-ygo-md`). Die Geräteabnahme mit ARCore ist offen:
https://github.com/Gamerio2904/Jarvis/raw/main/releases/Jarvis.apk

```bat
build-apk.bat
```

Linux: `./build-apk.sh`

PC-Test: [`docs/TEST-PC.md`](docs/TEST-PC.md) · Seit 1.16: [`docs/TEST-1.16-plus.md`](docs/TEST-1.16-plus.md) · Gerät 18.9: [`docs/TEST-18.9.md`](docs/TEST-18.9.md) · Versionen: [`docs/apk.md`](docs/apk.md)

1. Installieren (unbekannte Quellen). Vor Neuinstall: Einstellungen → Hausstand → Exportieren — Deinstall löscht Keys.
2. **Groq-Key** eintragen (Smalltalk). Optional **Gemini** (Vision/Research).
3. Chat. Daten bleiben auf dem Gerät (IndexedDB).

Im Code dieses Stands liegen Self-Play und Zugsuche ([`docs/104-next.md`](docs/104-next.md), Sprints 503–510), das TCG-Subset ([`docs/105-next.md`](docs/105-next.md), Sprints 511–530), die Master-Duel-Bedienung ([`docs/106-next.md`](docs/106-next.md), Sprints 531–550, `engineStamp` `18.60.0-ygo-md`) und die Welt auf der Kamera ([`docs/107-next.md`](docs/107-next.md), Sprints 551–559). Die App-Version ist `18.66.0`. Routing, Tablet-Sync und Projektplanung in [`docs/101-next.md`](docs/101-next.md) bis [`docs/103-next.md`](docs/103-next.md) sind teilweise vorbereitet; ihre Geräte-Gates `18.32.0`–`18.41.0` sind nicht als eigene Releases freigegeben. Vorhandener Code gilt nicht automatisch als abgenommenes Release.

## Prüfen

```bash
cd frontend
npm run lint
npx tsc -b
bash scripts/run-all-tests.sh
```

Fernseher, Fire TV, Ventilator und WLAN-Steckdosen laufen in der Android-App, nicht im Browser.

Planung: [`docs/README.md`](docs/README.md) · Änderungen: [`docs/CHANGELOG.md`](docs/CHANGELOG.md)
