# 00 — Jetzt (`2.29.1`)

Single source of truth für den **laufenden Code**. Fähigkeitenliste im Chat: `/hilfe` (`HELP_TEXT` in `frontend/src/engine/guards.ts`). Version: `APP_VERSION` in `frontend/src/engine/store.ts` und `frontend/package.json`.

Sideload: [`apk.md`](./apk.md). Changelog: [`CHANGELOG.md`](./CHANGELOG.md).

## Stack

Android-APK (Capacitor + React). Denken **on-device** (wllama, Qwen2.5 0.5B Instruct Q4) **oder** Gemini Opt-in. Speicher IndexedDB auf dem Gerät. PC-Steuerung: `desktop/JarvisPC.bat` im selben WLAN — kein NAS, kein Docker, kein Ollama.

Einstellungen (16 Themen): Allgemein, Modell, Cloud, Sprache, Wecker, Ort, Fernseher, PC, Haus, Musik, Ton, Netz, Gedächtnis, Tests, Debug, Gefahr. Tests sind intern: Prompts ankreuzen, Auto-Lauf in einen Debug-Chat oder sofort in den offenen Chat. Nicht in `/hilfe`.

## Was der Code tut

| Bereich | Live |
|---------|------|
| Chat | Smalltalk, merken/vergessen, Siezen |
| Listen | Einkaufsliste (`shopping`) **und** Kaufmodus-Overlay (`kauf`) — getrennt |
| Zeit | Gerätuhr, Timer (spricht), Wecker, Erinnerungen, lokaler Kalender |
| Ort | GPS, Losgehen, Zuhause, POI, Öffnungszeiten OSM |
| Fahren | Internes Overlay (OSM/OSRM), nicht Apple CarPlay. Overlay = Karte außer Spotify. Polish `2.29` Tablet-HUD |
| Haus | WLAN-Steckdosen lokal (Shelly, Tasmota, Tuya-LAN, Broadlink). Ventilator über Broadlink-Brücke |
| TV | Samsung Tizen + Fire TV. Film: IMDb/RT über OMDb, wo gratis JustWatch |
| PC | Bildschirm, Maus, FIFA, Ordner — nur mit laufender JarvisPC-App |
| Netz | Research opt-in, Zahlen nur aus Treffern. Wikipedia/Destatis zuerst bei Fakten. Rabatt-Suche extra (Default aus) |
| Lage | Wetter Open-Meteo. Unwetter DWD/Bright Sky. Luft/Sonne nur auf Nachfrage. Bahn nur wenn „Bahn“. Nachrichten Tagesschau. Feiertage DE. Schulferien, EZB-Kurs |
| Welt | Open Food Facts, Open Library, Bundesliga/OpenLigaDB, iNaturalist, ISS, Mond lokal, OpenSky, Gesetzestext+Link, Waschsymbole, Schritte/Barometer/Kompass, Schach e2e4 |
| Gerät | Akku, Taschenlampe, Wake-Word „Jarvis“, Widget, Sprachmodus. Tablet-Layout ab 900 px |

## Was der Code nicht tut

Apple CarPlay, WhatsApp, Play Store, iOS, Tuya-Cloud, Tapo, In-App-Bestellung, kaufDA-Prospekte (ehrliche Lücke), erfundene Preise/Versand. Einkaufsliste ≠ Produktsuche.

`Milch kaufen` / `Pack Milch auf die Liste` → **Einkaufsliste**. `Kaufmodus` / `Such mir einen Fernseher` → **Kaufmodus**. `Gibt’s Unwetter?` → DWD, nicht Open-Meteo-Alltag.

## Router (`chat.ts`)

Deterministisch **vor** dem LLM, Reihenfolge wie im Code:

`/hilfe` → Maps-Pending → PC-Pending → Rabatt-Toggle → Ordinal → TV → Film → Ventilator → Steckdose → Hier → Tanke → POI → Bahn → Fahrmodus → Gerät → PC → Maps → Memory → **Kaufmodus** → **Einkaufsliste** → Geburtstag → Zuhause → Losgehen → Tageslage → Feiertag → **Welt** → Kalender → Wecker → Timer → Erinnerung → Tools → Auge → Wetter → Nachrichten → Chatsuche → LLM (+ Research bei Live-Fakten).

## Diese Lieferung

Sideload **`2.29.1`** bündelt [`31-next.md`](./31-next.md) `2.3`–`2.19`, [`32-next.md`](./32-next.md) `2.20`–`2.28` und Polish [`33-next.md`](./33-next.md), plus internen Debug-Auto-Lauf. Sprint [`sprint-123.md`](./sprints/sprint-123.md).

## APK bauen

`build-apk.bat` schreibt `frontend/dist-apk/jarvis-debug.apk` (versionName `2.29.1`, versionCode `22901`). Veröffentlichtes Sideload: [`apk.md`](./apk.md) (`releases/Jarvis.apk` auf dem Release-Branch).
