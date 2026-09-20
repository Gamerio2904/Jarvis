# 77 — Lage-Kugel OSINT (OSIRIS-Fähigkeiten) **PLAN** (`18.6`)

PO 2026-09-20: Alles, was [OSIRIS](https://osirisai.live) auf der
Weltkarte kann, soll **in die Lage-Kugel**. Referenz:
[simplifaisoul/osiris](https://github.com/simplifaisoul/osiris) (MIT),
Docs: [osirisai.live/docs](https://osirisai.live/docs).

**Ist:** Code **`18.4.4`**. Kugel = Canvas 2D (`GlobeView.tsx`), GIBS,
Terminator, ISS-Bahn, **eine** Schicht auf Zuruf (`quakes` / `fires` /
`overhead`, max 40 / 16 Lite). Stadt-Briefing + Welt-Tour **CODE**.
Kein `globe.gl` (270 nicht gezogen). Kein EarthOS.

**Dieses Dokument ist PLAN, kein Sideload.** Execute: Sprints **307–314**.
`18.5` (Stimme/TV) bleibt PLAN daneben. **Nicht parallel ausführen** —
beide Schienen treffen `hud-parse.ts`, `store.ts`, `Lage.tsx`.

---

## 0. Leitentscheidung

| Thema | Entscheidung |
|-------|----------------|
| Oberfläche | Dieselbe Kugel. Kein OSIRIS-iframe, kein MapLibre, kein Cesium, kein Next.js-Fork. |
| Renderer | Canvas 2D. `globe.gl` bleibt Freeze 270. |
| Daten | Öffentliche Feeds **direkt**, wie USGS/EONET/OpenSky heute. `osirisai.live` ist **kein** Pflicht-Backend. |
| Schichten | **Eine** Overlay-Schicht gleichzeitig, **aus** bis zum Satz. Lage-Start ohne Extra-Fetch außer ISS. |
| Budget | `MAX_FULL` 40, `MAX_LITE` 16. Polylinien (Front, ISS) wenige Dutzend Punkte. 30 fps, Pause wenn Lage zu. |
| Label | Quelle + Alter. Kein Wort „Live“. |
| Hirn | Parser wählt Schicht/Tool. Gemini/Groq formuliert Briefing über **gelieferte** Fakten, erfindet keine Pins. |
| Lizenz | OSIRIS MIT: Muster und Feed-Liste dürfen inspirieren. Kein Copy-Paste ihrer App. Hinweis in CHANGELOG. |

Jarvis wird kein zweites OSIRIS und kein Überwachungsprodukt. Die
**Fähigkeiten** (was auf der Erde liegt, worüber man sprechen kann)
kommen auf die Kugel. Die **GIS-Desktop-Optik** und der aktive Scanner
nicht.

---

## 1. OSIRIS → Jarvis (vollständig)

Gleiche API, die das Dashboard nutzt: 57 öffentliche Routen, davon Reads
keyless. Unten: jede Fläche, wohin sie in der Kugel gehört.

### 1.1 Schon da (nicht neu bauen)

| OSIRIS | Jarvis jetzt |
|--------|----------------|
| `/api/earthquakes` | Schicht `quakes` (USGS 4,5 / 24 h) |
| `/api/fires` (Ereignisse) | Schicht `fires` (NASA EONET Wildfire) |
| `/api/flights` welt-weit | **eng:** `overhead` OpenSky-**BBox** um Standort |
| `/api/sentinel` / Sat-Kacheln | GIBS True Color, Stunden alt |
| `/api/region-dossier` Idee | Stadt-Briefing `globe-brief.ts` + Welt-Tour |
| News am Ort | Tagesschau/DW über `news` / `outlook` |
| `/api/health` | unnötig; App lebt on-device |

### 1.2 Auf die Kugel (Must, diese Schiene)

| OSIRIS | Jarvis-Schicht / Fläche | Quelle (direkt) | Kappe |
|--------|-------------------------|-----------------|-------|
| `/api/fires` Hotspots | `fires` um FIRMS erweitern, sonst EONET lassen | NASA FIRMS keyless oder EONET | 40 |
| `/api/weather` | `weather` Unwetter/EONET | NASA EONET open | 40 |
| `/api/air-quality` | `air` Stationen um Standort | OpenAQ o. ä. public | BBox, 40 |
| `/api/radar` | `radar` GPS-Störung | öffentliche GNSS-Stör-Meldungen, sonst ehrlich leer | 40 |
| `/api/satellites` | `sats` **Subset**, kein Katalog | CelesTrak / vorhandene ISS-Logik | 16 inkl. ISS |
| `/api/space-weather` | kein Pin-Teppich: **Ticker/Briefing** | NOAA SWPC | Text |
| `/api/maritime` | `ships` Schiffe um Standort + wenige Häfen/Engstellen | AIS-public oder OSM-Häfen-Tabelle | BBox 40 + ~12 fest |
| `/api/infrastructure` | `infra` Kernkraft/große Anlagen | statische Tabelle, kein Scraping | ~40 fest |
| `/api/conflicts` | `conflicts` Zonen-Pins | vorhandene öffentliche Konflikt-Feeds (ACLED-public / UCDP-ähnlich, sonst ehrlich) | 40 |
| `/api/frontlines` | dieselben Pins + **wenige** Linien | vereinfachte GeoJSON, nicht Millionenpunkte | Lite: keine Linien |
| `/api/gdelt` | `events` geocodierte Meldungen | GDELT public, stark gefiltert | 40 |
| `/api/cyber-attacks` `/api/malware` | `cyber` geolocated Hosts | abuse.ch Feodo/URLhaus public | 40 |
| `/api/stats` | Chip/Ticker wenn Schicht an | Zählung aus **unserem** Cache, nicht 10 MB GeoJSON | — |
| `/api/country-risk` | Feld im Dossier, kein Layer | aus Konflikten + News, nicht Orakel | — |

### 1.3 Kugel-UI, kein zweiter Atlas (Must)

| OSIRIS | Jarvis |
|--------|--------|
| Layer-Panel links | **Sätze**, nicht 20 Nav-Icons. Ein Chip „Schicht aus“ bleibt. |
| Intel Feed | Schmale **Leiste** unter der Kugel: 1–3 Zeilen aus der **aktiven** Schicht oder Tour. |
| Region Dossier (Rechtsklick) | **Tipp ins Leere** auf der Kugel: was in Sichtweite aus Cache + Briefing. |
| Entity Graph | **Won’t** extra Graph-Lib. Dossier-Liste reicht. |
| `/api/ai/analyze` `/briefing` `/overview` | Eigenes Hirn: sichtbare Pins + Quellen in `globe-brief`. **Nicht** `osirisai.live/api/ai`. Rate-Limit dort 5/min und fremder Gemini-Key. |

### 1.4 Chat + Pin, nicht Schicht (Should)

Passive Lookups, ein Subject, öffentlich. Treffer mit Koordinaten → Fly-to.

| OSIRIS | Jarvis | Bedingung |
|--------|--------|-----------|
| `/api/osint/dns` `/whois` `/certs` | Parser `osint` Domain | nur öffentliche CT/WHOIS |
| `/api/osint/ip` `/bgp` `/mac` | IP → grober Ort auf der Kugel | MaxMind-light / öffentliche Geo-IP, grob |
| `/api/osint/cve` | CVE-Text, kein Pin | NVD public |
| `/api/osint/sanctions` | Name → Treffer/kein Treffer | OFAC/OpenSanctions public |
| `/api/osint/github` | öffentliches Profil | GitHub public API |
| `/api/osint/shodan` | nur wenn **eigener** Shodan-Key in Settings, sonst ehrlich aus | kein Key in der APK |
| `/api/cyber-threats` | CVE-Rollup als Satz, nicht Welt voller Punkte | NVD |

### 1.5 Won’t (hart, auch wenn OSIRIS es hat)

| OSIRIS | Warum nicht in Jarvis |
|--------|------------------------|
| Weltweites ADS-B, 9 000 Flieger | Sprint 269: sprengt Netz, Akku, Lesbarkeit. `overhead` bleibt BBox. |
| 2 000 Satelliten / Starlink-Wolke | 70-next Won’t. Subset oder nichts. |
| `/api/cctv` + Stream-Proxy | 48-next: Live-Webcam/Street-View **Won’t**. Keine Überwachung, kein Kameraraster. |
| `/api/live-news` Broadcast-Streams | Video-Player in der Kugel ist ein anderes Produkt. |
| `/api/osint/sweep` `/api/scanner` | Aktiver Scan gegen fremde Netze. Nur eigene Infra, und **Traceroute liegt schon**. Kein Portscan-Backend. |
| `/api/osint/leaks` `/hudsonrock` `/phone` | Fremde Leaks, Infostealer, Telefon-OSINT — nicht der private Assistent. |
| `/api/sdk/ingest` `/sdk/stream` | Fremdes COP in unsere Kugel schieben. |
| `/api/github-webhook` | Server-Hook. Jarvis hat keinen Server. |
| `/api/markets` `/crypto` `/scm-suppliers` als Lage-GIS | Outlook/E10/FX bleiben Text. Kein Aktien-Orakel auf der Erde. |
| `osirisai.live` als Proxy für alles | Keys, Telemetrie, Ausfall, Privacy. Feeds direkt. |
| EarthOS / MapLibre / 60 fps Idle | 70-next. |

**CCTV und Scanner sind bewusst vollständig abgelehnt**, nicht „später“.
Wer Straßenkameras oder Recon will, nutzt OSIRIS selbst. Jarvis bleibt
Lage + Gespräch.

---

## 2. Architektur (Execute)

```text
Satz → hud-parse / osint-parse
         │
         ▼
   globe-layers.ts   eine aktive GlobeLayer
         │  fetch + TTL + Kappe + Quelle/Alter
         ▼
   GlobeView.tsx     Pins + wenige Linien (Canvas)
         │
         ├─ Lage-Chip „Schicht aus“
         ├─ Intel-Leiste (1–3 Zeilen)
         └─ Tipp leer → Dossier (Sicht + briefPlace)
```

Neue Dateien (Vorschlag, Execute darf schieben):

| Datei | Rolle |
|-------|--------|
| `globe-layers.ts` | Registry statt drei `if`. Eine Cache-Slot-Map pro Schicht-Id. |
| `globe-fronts.ts` | Polylinien klein halten. |
| `osint.ts` | Passive Lookups, Confirm bei Shodan-Key. |
| `Lage.tsx` | Intel-Leiste, Chip-Label je Schicht, Dossier-Karte. |

Settings: `globe_layer` Enum erweitern. Leerer String = aus.
`globe_webgl` bleibt Lite-Canvas, kein WebGL.

Parser: Schicht-Phrasen in die HUD-Skip-Liste (`unknown_place`), analog
Erdbeben/Schachbrett.

Ehrliche Leer-Texte wie `replyFor()` heute: Quelle antwortet nicht →
Kugel bleibt, kein Fake-Live.

---

## 3. Schiene `18.6` (Sprints 307–314)

Harte Kette: **307 → alles**. 308–310 unabhängig voneinander nach 307.
**311 braucht mindestens eine** der Schichten 308–310 (Dossier ohne Daten
ist nur Stadt-Briefing, das gibt es schon). **313 braucht 307** plus
irgendeine Schicht. 312 frei neben 311. **314 zuletzt**.

| Version | Sprint | Thema |
|---------|--------|-------|
| `18.6.0` | [307](./sprints/sprint-307.md) | Layer-Registry, Parser-Gerüst, eine API, Budget |
| `18.6.1` | [308](./sprints/sprint-308.md) | Erde + Orbit: FIRMS/Unwetter/Luft/Radar, Sats-Subset, Weltraumwetter-Text |
| `18.6.2` | [309](./sprints/sprint-309.md) | See + Infra: Schiffe-BBox, Häfen/Engstellen, Anlagen-Tabelle |
| `18.6.3` | [310](./sprints/sprint-310.md) | Geo + Cyber: Konflikte, Front-Linien, GDELT, Malware-Hosts |
| `18.6.4` | [311](./sprints/sprint-311.md) | Intel-Leiste + Regionsdossier (Tipp leer) |
| `18.6.5` | [312](./sprints/sprint-312.md) | Passive OSINT + Pin wenn Geo |
| `18.6.6` | [313](./sprints/sprint-313.md) | Lage-Briefing: Hirn nur über sichtbare Fakten |
| `18.6.7` | [314](./sprints/sprint-314.md) | Härten, Gold, Meilenstein |

Kein Versionsbump der Sideload-APK in diesem PLAN. 282 bleibt
versionCode-Schema-Freeze.

---

## 4. Sätze (Parser, Beispiele)

Schicht an (Kugel auf, Fetch, Chip):

| Satz | Schicht |
|------|---------|
| `Zeig Erdbeben` | `quakes` (CODE) |
| `Wo brennt es` | `fires` (CODE, Quelle darf FIRMS werden) |
| `Was fliegt über uns` | `overhead` (CODE) |
| `Zeig Unwetter` / `Wo tobt ein Sturm` | `weather` |
| `Luftqualität` / `Wie ist die Luft hier` | `air` |
| `GPS-Störung` / `Zeig Radar-Störung` | `radar` |
| `Zeig Satelliten` / `Was ist im Orbit` | `sats` |
| `Weltraumwetter` | Text, keine Pin-Wolke |
| `Was fährt auf See` / `Zeig Schiffe` | `ships` (BBox) |
| `Zeig Häfen` / `Meeresengen` | `ships` + feste Pins |
| `Kritische Anlagen` / `Kernkraft` | `infra` |
| `Zeig Konflikte` / `Wo wird geschossen` | `conflicts` |
| `Frontlinien` | `conflicts` + Linien |
| `Welt-Ereignisse` / `GDELT` | `events` |
| `Cyber auf der Karte` / `Malware-Hosts` | `cyber` |
| `Schicht aus` / vorhandener Chip | `globe_layer: ''` |

Dossier: `Was sehe ich` bleibt Blickmitte-Stadt. **Tipp ins Leere** füllt
die Pin-Karte mit Dossier, kein zweiter Satz nötig.

OSINT: `Wer hat example.com`, `WHOIS example.com`, `IP 1.2.3.4 auf der Kugel`,
`Was ist CVE-2024-1234`, `Steht X auf der Sanktionsliste`.

Briefing: `Briefing zur Lage` / `Was liegt auf der Kugel` → sichtbare
Schicht + Alter + 1–3 Fakten, sonst ehrlich leer.

---

## 5. Won’t in `18.6` (kurz)

- iframe OSIRIS, MapLibre, Cesium, `globe.gl`, EarthOS, 60 fps Idle.
- Welt-ADS-B, Starlink, 2 000 TLEs in der APK.
- CCTV, Live-Streams, Gesicht, Mitschnitt.
- Portscan, Sweep, Scanner-Backend, fremde Leaks, Telefon-OSINT.
- `osirisai.live` Pflicht-Proxy, deren Gemini-Routen, SDK-Ingest.
- Zweites Hirn, Qdrant, e5 in `pickRoute`, LLM-Organizer, cytoscape.
- Neue permanente Poll-Schleife ohne Nutzersatz.
- Label „Live“.

---

## 6. Probe (nach 314)

```
Lage auf → Kugel. Keine Erdbeben-/Schiffs-Wolke (ISS darf).
Zeig Erdbeben
```

USGS, Alter, wenige Kreise, Chip „Beben aus“.

```
Was fährt auf See
Zeig Konflikte
Tipp neben die Marker ins Leere
```

BBox-Schiffe oder ehrliches Leer. Konflikte mit Quelle. Dossier-Karte:
was in der Sicht ist, Stand, keine Erfindung.

```
WHOIS example.com
Briefing zur Lage
```

Öffentliche Registrierung, kein Scan. Briefing nennt nur Pins, die da sind.

```
Zeig Kameras
Scan 8.8.8.8
```

Ehrlich Won’t / Traceroute-Hinweis, keine CCTV-Schicht, kein Portscan.

Gerät: Kugel bleibt drehbar. Lite-Flag halbiert Marker. Flugmodus: Cache
oder „kein Netz“, kein Spinner-Hang.
