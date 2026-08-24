# 00 — Jetzt (`2.2.2`)

Single source of truth für den **laufenden Code**. Fähigkeitenliste im Chat: `/hilfe` (`HELP_TEXT` in `frontend/src/engine/guards.ts`). Version: `APP_VERSION` in `frontend/src/engine/store.ts` und `frontend/package.json`.

Sideload: [`apk.md`](./apk.md). Changelog: [`CHANGELOG.md`](./CHANGELOG.md).

## Stack

Android-APK (Capacitor + React). Denken **on-device** (wllama, Qwen2.5 0.5B Instruct Q4) **oder** Gemini Opt-in. Speicher IndexedDB auf dem Gerät. PC-Steuerung: `desktop/JarvisPC.bat` im selben WLAN — kein NAS, kein Docker, kein Ollama.

Einstellungen (14 Themen): Allgemein, Modell, Cloud, Sprache, Wecker, Ort, Fernseher, PC, Haus, Musik, Ton, Netz, Gedächtnis, Gefahr.

## Was der Code tut

| Bereich | Live |
|---------|------|
| Chat | Smalltalk, merken/vergessen, Siezen |
| Listen | Einkaufsliste, Todos, Notizen — **kein Kaufmodus** |
| Zeit | Gerätuhr, Timer (spricht), Wecker, Erinnerungen, lokaler Kalender |
| Ort | GPS, Losgehen, Zuhause, POI, Öffnungszeiten OSM |
| Fahren | Internes Overlay (OSM/OSRM), nicht Apple CarPlay. Overlay = Karte außer Spotify |
| Haus | WLAN-Steckdosen lokal (Shelly, Tasmota, Tuya-LAN, Broadlink). Ventilator über Broadlink-Brücke |
| TV | Samsung Tizen + Fire TV. Film: IMDb/RT über OMDb, wo gratis JustWatch |
| PC | Bildschirm, Maus, FIFA, Ordner — nur mit laufender JarvisPC-App |
| Netz | Research opt-in, Zahlen nur aus Treffern. Rabatt-Suche extra (Default aus) |
| Lage | Wetter Open-Meteo. Luft/Sonne nur auf Nachfrage. Bahn nur wenn „Bahn“. Nachrichten Tagesschau. Feiertage DE |
| Gerät | Akku, Taschenlampe, Wake-Word „Jarvis“, Widget |

## Was der Code nicht tut

Kaufmodus / Preis-Overlay ([`32-next.md`](./32-next.md) **PLAN**). DWD, Ferien, Schach und die restliche Reihe [`31-next.md`](./31-next.md) **PLAN**. Apple CarPlay, WhatsApp, Play Store, iOS, Tuya-Cloud, Tapo, In-App-Bestellung. Einkaufsliste ≠ Produktsuche.

`Milch kaufen` / `Pack Milch auf die Liste` → **Einkaufsliste** (`shopping.ts`). `Such mir Milch im Angebot` fällt heute auf Research, nicht auf ein Shopping-Overlay.

## Router (`chat.ts`)

Deterministisch **vor** dem LLM, Reihenfolge wie im Code:

`/hilfe` → Maps-Pending → PC-Pending → Rabatt-Toggle → Ordinal → TV → Film → Ventilator → Steckdose → Hier → Tanke → POI → Bahn → Fahrmodus → Gerät → PC → Maps → Memory → **Einkaufsliste** → Geburtstag → Zuhause → Losgehen → Tageslage → Feiertag → Kalender → Wecker → Timer → Erinnerung → Tools → Auge → Wetter → Nachrichten → Chatsuche → LLM (+ Research bei Live-Fakten).

Kaufmodus-Parser gibt es **nicht**. Wenn er kommt: vor der Einkaufsliste, siehe [`32-next.md`](./32-next.md).

## Nächste Updates (kein Code)

1. [`31-next.md`](./31-next.md) — `2.3`–`2.19` Alltag & Welt, zuerst DWD. Kickoff Sprint 105.
2. [`32-next.md`](./32-next.md) — `2.20`–`2.28` Kaufmodus. Kickoff Sprint 122. Vorziehen nur auf PO-Kommando.

Sprints 106–121 sind in der Versionstabelle **reserviert** für 31-next; Dateien entstehen erst, wenn eine Stufe gebaut wird.

## APK bauen

`build-apk.bat` schreibt `frontend/dist-apk/jarvis-debug.apk` (versionName aus `package.json`, versionCode z. B. `20202`). Veröffentlichtes Sideload: [`apk.md`](./apk.md) (`releases/Jarvis.apk` auf dem Release-Branch).
