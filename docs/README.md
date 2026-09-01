# Jarvis — Planungsdokumente

**Jetzt:** Code **`6.96.0`**. Sideload **`6.90.0`**. **Hirn:** Gemini (Key) Hauptweg → Groq Backup → 0,5B letzter Fallback. Stabilität V1+V2 [`51-phase0-audit.md`](./51-phase0-audit.md) `6.91`–`6.96` **CODE**. Globus-Briefing [`48-next.md`](./48-next.md) `6.90` **CODE**. Parser [`46-next.md`](./46-next.md) `6.51` · Split/Identität/Overlay/APK [`47-next.md`](./47-next.md) `6.60`. Index: [`42-planned.md`](./42-planned.md). Vor Neuinstall Hausstand exportieren.

Dieses Verzeichnis ist die **agile Projektplanung**. Historische `0.x`/`1.x`-Docs bleiben als Protokoll.

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
| 13 | [On-Device](./13-on-device.md) | Handy: Parser + Speicher lokal; Hirn Gemini zuerst |
| 14 | [Qualität & TV](./14-quality-tv.md) | **`0.14.1`** — härten + Tizen live |
| 16 | [Gemini](./16-gemini.md) | **Hauptweg** (Key); historisch `0.16` Opt-in |
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
| 35 | [Weltlage / Vorhersage](./35-next.md) | **`4.0` CODE** — Ausblick zitiert, Serie, Szenario, kein Orakel |
| 36 | [Alltagskette Stimme](./36-next.md) | **`4.19` CODE** — Bar, SMS-Note, Taxi, Kette |
| 37 | [Gespräch / Stimme / Steuer](./37-next.md) | **`4.33` CODE** — Film-TTS Algieba, HUD am Steuer |
| 38 | [Hausstand Backup + Korrektur](./38-next.md) | **`4.46` CODE** — Export/Import, Tippfehler Schreib+Sprache |
| 39 | [Zwei Gesichter + Tablet](./39-next.md) | **`4.53` CODE** — Jarvis/Friday Stimme, Lage neben Chat |
| 40 | [Körper intern](./40-next.md) | **`4.66` CODE** — 3D-Schema in der Lage; PC nur PC-Organe (in `5.11`) |
| 41 | [Lokales Sehen / LocateAnything](./41-next.md) | **`4.76` CODE** Parser, Vision ehrlich aus; Gewichte nach 3060-GO |
| 42 | [Alles geplant](./42-planned.md) | Index Code `6.90` + offene Pläne |
| 44 | [Debug-Lauf](./44-next.md) | **`5.11` CODE** — Kategorien, Sequenz, Export mit Verdict |
| 45 | [Bühne & Hirn](./45-next.md) | **`6.50` CODE** in Sideload `6.60` — Gemini Hauptweg, Globus Zoom/GIBS, Motion, Stimme |
| 46 | [Prompt-Test + Parser](./46-test-650.md) | **`6.50` Test** · Execute [`46-next.md`](./46-next.md) **`6.51` CODE** |
| 47 | [Split, Identität, Sideload](./47-next.md) | **`6.60` CODE** |
| 48 | [Globus-Briefing](./48-next.md) | **`6.90` CODE** — Stadt-Satellit + Welt-Tour |
| 49 | [Agentic Recall](./49-next.md) | **`7.0` PLAN** — Retrieve/RRF nach `6.90` |
| 50 | [Alltag vom Zettel](./50-next.md) | **`8.0` PLAN** — Blitzer, Steuer-Stimme, Settings-IA, Musik-Fallback, Chat-Ordner, Preiswache |
| 51 | [Phase-0-Audit / Industry-Track](./51-phase0-audit.md) | **`6.96` V1+V2 CODE** — Audit, Overlay, Gemini-Abbruch, TTS, App-Actions; V3+ PLAN |
| — | [APK](./apk.md) | Sideload `6.90.0`; Deinstall löscht Keys — erst Hausstand-Export |

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
| 31–33 | `0.9.3`–`0.9.5` | **CODE** (historisch, in späteren Sideloads) |
| 34–39 | `0.10.0`–`0.10.5` | **SUPERSEDED** (NAS; On-Device `0.13`) |
| 40–42 | `0.11.0`–`0.11.2` | **CODE** (Samsung-TV, in `0.14.1`) |
| 43 | `0.12.0` | **SUPERSEDED** (NAS-Proxy) |
| 44 | `0.13.0` | **CODE** (On-Device Handy) |
| 45 | `0.13.1` | **CODE** (Modell-Download Hotfix) |
| 46 | `0.13.2` | **CODE** (Chat-Hang Hotfix) |
| 47 | `0.14.0` | **CODE** (in `0.14.1`) |
| 48 | `0.14.1` | **CODE** (TV verbinden & steuern) |
| 50 | `0.16.0` | **CODE** (Gemini Opt-in; ab `6.50` Hauptweg) |
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
| 110 | `4.0.0` | **CODE** (Weltlage / Vorhersage) |
| 111 | `4.19.0` | **CODE** (Alltagskette Bar/SMS/Taxi) |
| 112 | `4.33.0` | **CODE** (Gespräch, Film-Stimme, Reel am Steuer) |
| 113 | `4.46.0` | **CODE** (Hausstand Export/Import, Autokorrektur) |
| 114 | `4.53.0` | **CODE** (Jarvis/Friday + Tablet-Lage flüssig) |
| 115 | `4.66.0` | **CODE** (Körper intern, in `5.11.0`) |
| 116 | `4.76.0` | **CODE** (LocateAnything-Parser, Vision ehrlich aus) |
| 117 | `4.87.0` | **CODE** (Sehen Alltag Parser) |
| 118 | `4.94.0` | **CODE** (Schreibtisch/Wasch/EAN/zwei Schritte Parser) |
| 119 | `5.0.0` | **CODE** (Weltkugel, in `5.11.0`) |
| 120 | `5.11.0` | **CODE** (Debug-Lauf: Kategorien, Sequenz, Export) |
| 121 | `6.0.0` | **CODE** (Leitentscheidung, in `6.50.0`) |
| 122 | `6.10.0` | **CODE** (Motion-Kern + GUI, in `6.50.0`) |
| 123 | `6.20.0` | **CODE** (Körper-Show + virtueller Globus, in `6.50.0`) |
| 124 | `6.30.0` | **CODE** (Fahrmodus-Bühne, in `6.50.0`) |
| 125 | `6.40.0` | **CODE** (Sprach-Theater + Stimme, in `6.50.0`) |
| 126 | `6.50.0` | **CODE** (Gemini zuerst, Groq/0,5B Backup) |
| 127 | `6.51.0` | **CODE** (Parser nach Prompt-Test) |
| 128 | `6.52.0` | **CODE** (Live-Split + Identität, in `6.60.0`) |
| 129 | `6.53.0` | **CODE** (Overlay Gemini zuerst, in `6.60.0`) |
| 130 | `6.60.0` | **CODE** (Sideload APK) |
| 131 | `6.70.0` | **CODE** (Globus-Briefing Leitentscheidung, Docs) |
| 132 | `6.71.0` | **CODE** (Research Satellit + Land) |
| 133 | `6.80.0` | **CODE** (Fly-to Satellit + Briefing) |
| 134 | `6.82.0` | **CODE** (Welt-Tour Glow/Seite/Zoom) |
| 135 | `6.81.0` | **CODE** (Anomalien + Ihr Plan) |
| 136 | `6.90.0` | **CODE** (Gold / Debug, kein Sideload) |
| 137+ | `7.0.0` | **PLAN** (Agentic Recall) — nach Stabilität |
| 141 | `8.0.0` | **PLAN** (Alltag vom Zettel) |
| 142 | `6.91.0` | **CODE** (Stabilität Kern — Audit + Parser + Debug-Session) |
| 143 | `6.92.0` | **CODE** (Overlay-FSM & Weltlage, in `6.93.0`) |
| 144 | `6.93.0` | **CODE** (Gemini-Abbruch, `ja bitte`, Tweets, Siezen) |
| 145 | `6.94.0` | **CODE** (TTS Gemini-Primary, in `6.96.0`) |
| 146 | `6.95.0` | **CODE** (App-Action-Registry, in `6.96.0`) |
| 147 | `6.96.0` | **CODE** (Banner, Chips, Wake) |
| 148+ | `6.97`+ | **PLAN** (V3 Verified Actions) |

**Aktuell:** Code **`6.96.0`**. Sideload zuletzt `6.90.0`. Audit [`51-phase0-audit.md`](./51-phase0-audit.md) V1+V2 **CODE**. Globus-Briefing [`48-next.md`](./48-next.md) **CODE**. Alltag-Plan [`50-next.md`](./50-next.md). Recall-Plan [`49-next.md`](./49-next.md). LocateAnything-Sidecar nach 3060-GO. Index: [`42-planned.md`](./42-planned.md).
