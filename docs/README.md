# Jarvis — Planungsdokumente

Dieses Verzeichnis enthält die **agile Projektplanung** für Jarvis.

## Lesereihenfolge

| Nr. | Dokument | Zweck |
|-----|----------|--------|
| 01 | [Vision & Produktziele](./01-vision.md) | Wozu Jarvis existiert, Ziele, Nicht-Ziele |
| 02 | [Architektur](./02-architecture.md) | Lokales Design, UI-Richtung, Kontext-Stufen |
| 03 | [Agiler Prozess (Scrum-lite)](./03-agile-process.md) | Rollen, Sprints, DoR/DoD |
| 04 | [Roadmap & Phasen](./04-roadmap-phases.md) | Phase 0 → 5+ |
| 05 | [Product Backlog](./05-product-backlog.md) | Epics & User Stories |
| 06 | [MVP & Sprint-Plan](./06-mvp-sprint-plan.md) | MVP + Sprint-Überblick |
| 07 | [Persona Jarvis](./07-persona.md) | Charakter, Stil, Beispiele |
| 08 | [Offene Fragen](./08-open-questions.md) | Restlücken |
| 09 | [Versionierung](./09-versioning.md) | SemVer, Sprint ↔ Version |
| 10 | [Intelligence Capabilities](./10-intelligence-capabilities.md) | Memory, Router, Eval, Research |
| 11 | [Delight & Settings](./11-delight-and-settings.md) | Momente, Jokes, Sound, Eggs, Settings-UX |
| 12 | [NAS & APK](./12-nas-apk.md) | historisch / superseded |
| 13 | [On-Device](./13-on-device.md) | Handy-LLM `0.13.2` |
| 14 | [Qualität & TV](./14-quality-tv.md) | **`0.14.1`** — härten + Tizen live |
| 16 | [Gemini](./16-gemini.md) | **`0.16`** — Google-API, Opt-in |
| 17 | [Nächste Versionen](./17-next.md) | **`1.1`–`1.6`** — Erinnerung, Wetter, Kalender, Sprache — **CODE** |
| 18 | [Timer bis GUI](./18-next.md) | **`1.7`–`1.13.2`** — Wecker, Widget, Wake-Word, Motion, Ton — **CODE** |
| 19 | [Alltag & Kontext](./19-next.md) | **`1.14`–`1.20` CODE** (in `1.24.0`) |
| 20 | [Extra-Alltag](./20-next.md) | **`1.21`–`1.24` CODE** |
| 21 | [Fahrmodus & Spotify](./21-next.md) | **`1.26` CODE** |
| 22 | [Internes Spotify](./22-next.md) | **`1.27` CODE** |
| 23 | [Alltag 1.29](./23-next.md) | **`1.29` CODE** — Suche, Fire TV, GUI, Widget, Ventilator |
| 24 | [CarPlay flüssig](./24-next.md) | **`1.30` CODE** — HUD, Voice-Tabs, Navi-Ansagen |
| 25 | [Stimme & Ton](./25-next.md) | **`1.31` CODE** — TTS, Smalltalk, Jarvis-Formulierung |
| 26 | [Samsung-Apps](./26-next.md) | **`1.32` CODE** — YouTube/Amazon/Disney/Netflix, Film-Lookup |
| 27 | [Sprachmodus Tempo](./27-next.md) | **`1.32.1` CODE** — sofort sprechen, keine Stille |
| 28 | [Qualität statt Breite](./28-next.md) | **`1.33`–`2.0` CODE** — Suche bis Haus-AI 2.0 |
| 29 | [WLAN-Steckdosen](./29-next.md) | **`2.1.0` CODE** — Shelly/Tasmota/Tuya-LAN |
| 30 | [Uhrzeit, Ort, Research](./30-next.md) | **`2.2.0` CODE** — Gerätzeit, GPS, Auto-Suche |
| 31 | [Alltag & Welt](./31-next.md) | **`3.1`–`3.17` CODE** — DWD bis Schach (in `3.0.0`) |
| 32 | [Intelligenz](./32-intelligence.md) | **`3.0` CODE** — Register, Score-Policy |
| 33 | [3.x danach](./33-next.md) | **`3.18.1` CODE** — Härten, Tablet-Lage, Traceroute, Telefon-Haus, GUI |
| 34 | [Stimme Kalender Debug](./34-next.md) | **`3.19.0` CODE** — ein Gespräch, Jahr, Debug |
| — | [APK](./apk.md) | Sideload `3.18.1`; Code `3.19.0` |

Sprints (numerisch = Lieferreihenfolge): [`sprints/README.md`](./sprints/README.md)

## Status (Kurz)

| Sprint | Version | Status |
|--------|---------|--------|
| 0 | — | **DONE** |
| 1–7 | `0.1.0`–`0.3.1` | **READY FOR REVIEW** |
| 8 | `0.4.0` | **READY FOR REVIEW** (Gedächtnis) |
| 9 | `0.4.1` | **READY FOR REVIEW** (Memory Must-Fixes) |
| 10 | `0.4.2` | **READY FOR REVIEW** (Memory Polish) |
| 11 | `0.4.3` | **READY FOR REVIEW** (Memory Hotfix) |
| 12 | `0.5.0` | **READY FOR REVIEW** (Router + Memory-Intent) |
| 13 | `0.5.1` | **READY FOR REVIEW** (Router Hotfix) |
| 14 | `0.5.2` | **READY FOR REVIEW** (Router Polish) |
| 15 | `0.6.0` | **READY FOR REVIEW** (Internet-Research) |
| 16 | `0.6.1` | **READY FOR REVIEW** (Research Hotfix) |
| 17 | `0.6.2` | **READY FOR REVIEW** (Research Polish) |
| 18 | `0.7.0` | **READY FOR REVIEW** (Delight + Settings) |
| 19 | `0.7.1` | **READY FOR REVIEW** (Quality Hotfix) |
| 20 | `0.7.2` | **READY FOR REVIEW** (mitgeliefert in `0.8.0`) |
| 21 | `0.7.3` | **READY FOR REVIEW** (mitgeliefert in `0.8.0`) |
| 22 | `0.8.0` | **READY FOR REVIEW** (Assist Clarity) |
| 23 | `0.8.1` | **READY FOR REVIEW** (mitgeliefert in `0.8.3`) |
| 24 | `0.8.2` | **READY FOR REVIEW** (mitgeliefert in `0.8.3`) |
| 25 | `0.8.3` | **READY FOR REVIEW** (Assist Ops) |
| 26 | `0.8.4` | **READY FOR REVIEW** (Siezen & Recall Hotfix) |
| 27 | `0.8.5` | **READY FOR REVIEW** (in `0.9.0`) |
| 28–30 | `0.9.0`–`0.9.2` | **READY FOR REVIEW** (Local Tools) |
| 31–33 | `0.9.3`–`0.9.5` | **PLANNED** |
| 34–39 | `0.10.0`–`0.10.5` | **PLANNED** (NAS + APK) |
| 40–42 | `0.11.0`–`0.11.2` | **CODE** (Samsung-TV, Pairing offen) |
| 43 | `0.12.0` | **SUPERSEDED** (NAS-Proxy) |
| 44 | `0.13.0` | **CODE** (On-Device Handy) |
| 45 | `0.13.1` | **CODE** (Modell-Download Hotfix) |
| 46 | `0.13.2` | **CODE** (Chat-Hang Hotfix) |
| 47 | `0.14.0` | **CODE** (in `0.14.1`) |
| 48 | `0.14.1` | **CODE** (TV verbinden & steuern) |
| 50 | `0.16.0` | **CODE** (Gemini Opt-in) |
| 51–54 | `1.1`–`1.4` | **CODE** (Sound/Quellen, Erinnerung, Wetter, Kalender) |
| 55 | `1.5.0` | **CODE** (Sprachmodus) |
| 56 | `1.6.0` | **CODE** (Wetter als Lage) |
| 57–61 | `1.7`–`1.11` | **CODE** (Timer, Serie, Wetter-Follow-up, Widget, Wake-Word) |
| 62–65 | `1.12`–`1.13.2` | **CODE** (Wecker-Ton, GUI, Datum, Timer-Ton) |
| 66 | `1.14.0` | **CODE** (Kontext, ein Name, ehrliche Suche, Titel) |
| 67 | `1.15.0` | **CODE** (Personen/Orte, Maps-Route) |
| 68–72 | `1.16`–`1.20` | **CODE** (in `1.24.0`) |
| 73–76 | `1.21`–`1.24` | **CODE** |
| 77–85 | `1.25`–`1.32.1` | **CODE** (Settings, Fahrmodus, Spotify, Wake-Word, TV-Apps, Voice-Tempo) |
| 86 | `1.33.0` | **CODE** (Suche, Preise, Antworten, CarPlay öffnen) |
| 87–93 | `1.34`–`1.40` | **CODE** (Qualität — [`28-next.md`](./28-next.md)) |
| 94 | `1.41.0` | **CODE** (Tanke E10) |
| 95 | `1.42.0` | **CODE** (Live-Ort) |
| 96 | `1.43.0` | **CODE** (CarPlay ehrlich + Alltag am Steuer) |
| 97 | `1.44.0` | **CODE** (Filme IMDb/RT + Rabatt-Suche) |
| 98 | `1.45.0` | **CODE** (Öffnungszeiten Läden) |
| 99 | `1.46.0` | **CODE** (Anruf/SMS mit Nachfrage) |
| 100 | `1.47.0` | **CODE** (PC live) |
| 101 | `1.48.0` | **CODE** (Luft/Sonne/Bahn/Nachrichten/Feiertage) |
| 102 | `2.0.0` | **CODE** (Haus-AI, ein Kontext) |
| 103 | `2.1.0` | **CODE** (WLAN-Steckdosen) |
| 104 | `2.2.0` | **CODE** (Uhrzeit, Ort, Auto-Research) |
| 105 | — | **CODE** (Welt-Reihe Docs + Code in `3.0.0`) |
| 106 | `3.0.0` | **CODE** (Intelligenz / Register) |
| 107 | `3.18.0` | **CODE** (Lage, Traceroute, Digest; `3.0.1`–`3.45`) |
| 108 | `3.18.1` | **CODE** (GUI Premium: Overlay-Slides) |
| 109 | `3.19.0` | **CODE** (Stimme-Thread, Kalender, Debug) |

**Aktuell:** Code **`3.19.0`**. Sideload-APK `3.18.1` — [`Jarvis.apk`](./apk.md). Stimme/Kalender: [`34-next.md`](./34-next.md). Lage/Härten: [`33-next.md`](./33-next.md).
