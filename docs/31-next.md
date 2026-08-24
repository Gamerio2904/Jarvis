# 31 — Alltag & Welt (`2.3`–`2.19`) **CODE** (in `2.29.0`)

PO 2026-08-20: Nächste Updates planen — Unwetter/DWD, Schulferien, Wechselkurse, Open Food Facts, Open Library, Bundesliga, Research, Stimme, Garten, Himmel, Tiere, Flüge, Recht, Haushalt, Sport, Handy-Sensoren, Schach. Freie APIs, nichts erfinden.

Mitgeliefert in Sideload **`2.29.0`**. App jetzt: [`00-now.md`](./00-now.md). Reihe danach: Kaufmodus [`32-next.md`](./32-next.md) **CODE** (ebenfalls in `2.29.0`). Polish: [`33-next.md`](./33-next.md).

Engine: `frontend/src/engine/world.ts` + `world-parse.ts`. Router nach Feiertag, vor Kalender.

## Reihenfolge

| Version | Inhalt | API / Quelle | Status |
|---------|--------|--------------|--------|
| **`2.3.0`** | Unwetter / DWD-Warnung | Bright Sky / DWD, kein Key | **CODE** (in `2.29.0`) |
| **`2.4.0`** | Schulferien DE | ferien-api.de, kein Key | **CODE** (in `2.29.0`) |
| **`2.5.0`** | Wechselkurse | EZB über Frankfurter.app, kein Key | **CODE** (in `2.29.0`) |
| **`2.6.0`** | Research härten | Wikipedia/Destatis zuerst, dann bestehende Suche | **CODE** (in `2.29.0`) |
| **`2.7.0`** | Stimme Alltag | vorhandenes TTS spricht die kurzen Fakten | **CODE** (in `2.29.0`) |
| **`2.8.0`** | Open Food Facts | openfoodfacts.org | **CODE** (in `2.29.0`) |
| **`2.9.0`** | Open Library | openlibrary.org | **CODE** (in `2.29.0`) |
| **`2.10.0`** | Bundesliga | OpenLigaDB, frei | **CODE** (in `2.29.0`) |
| **`2.11.0`** | Sport-Ergebnisse | gleiche Sport-Schiene, 2. Liga | **CODE** (in `2.29.0`) |
| **`2.12.0`** | Garten & Pflanzen | iNaturalist, keine Essbarkeit | **CODE** (in `2.29.0`) |
| **`2.13.0`** | Himmel | ISS Where The ISS At; Mond lokal | **CODE** (in `2.29.0`) |
| **`2.14.0`** | Tiere draußen | iNaturalist | **CODE** (in `2.29.0`) |
| **`2.15.0`** | Flüge überm Haus | OpenSky, kein Key | **CODE** (in `2.29.0`) |
| **`2.16.0`** | Recht Alltag | gesetze-im-internet.de über Research | **CODE** (in `2.29.0`) |
| **`2.17.0`** | Haushalt | festes Wissen, keine Live-Erfindung | **CODE** (in `2.29.0`) |
| **`2.18.0`** | Handy-Sensoren | Schritte, Barometer, Kompass — lokal | **CODE** (in `2.29.0`) |
| **`2.19.0`** | Schach | Chat-Notation e2e4, Züge pseudo-legal | **CODE** (in `2.29.0`) |

Sprint-Kickoff historisch: [`sprint-105.md`](./sprints/sprint-105.md). Lieferung: [`sprint-123.md`](./sprints/sprint-123.md) / `2.29.0`.

## Leitentscheidung

| Thema | Entscheidung |
|-------|----------------|
| Netz | Nur freie APIs oder schon vorhandene Suche. Kein neuer Cloud-Zwang. |
| Ehrlichkeit | Fehlt die Zahl/Art/Warnung: das sagen. Kein Raten, kein Anwalts-Rat, keine Essbarkeit. |
| Wetter | `Wetter heute` bleibt Open-Meteo ohne AQI/Sonne. Warnung nur bei Unwetter-Frage oder klarer Lage. |
| Foto | Food/Pflanze/Tier nur mit Treffer + Link. Unbekannt = ehrlich. |
| Stimme | Keine neue TTS-Firma. Vorhandenes TTS spricht die neuen kurzen Fakten. |
| Sport | Nur API-Stand. Kein Tippspiel, keine erfundenen Tore. |
| Recht | Zitat + Link. Nicht „Sie sollten klagen“. |
| Sensoren | Ohne Freigabe ehrlich. Keine Gesundheitsdiagnose. |
| Schach | Brett im Chat. Kein Account-Zwang. |

## Chat (Zielbild)

| Version | Beispiel |
|---------|----------|
| `2.3.0` | `Gibt’s Unwetter?` / `DWD Warnung` |
| `2.4.0` | `Sind in BW Ferien?` |
| `2.5.0` | `Was ist der Dollar?` |
| `2.6.0` | `Was ist der BIP in Deutschland` — zuerst belegte Quelle |
| `2.7.0` | Uhr, Warnung, Ferien werden vorgelesen, ganze Sätze |
| `2.8.0` | Foto + `Was ist das für ein Produkt?` |
| `2.9.0` | `Was ist das für ein Buch?` / Titel |
| `2.10.0` | `Wie hat der VfB gespielt?` |
| `2.11.0` | `Ergebnis Bayern` / andere Liga, wenn die API sie hat |
| `2.12.0` | Foto + `Was ist das für eine Pflanze?` |
| `2.13.0` | `Wann fliegt die ISS?` / `Mondphase` |
| `2.14.0` | `Welcher Vogel ist das?` (Foto oder ehrliche Absage ohne Clip) |
| `2.15.0` | `Was fliegt da?` |
| `2.16.0` | `Kündigungsfrist Wohnung` — Paragraph + Link |
| `2.17.0` | `Was bedeutet die Waschschüssel?` / Fleck |
| `2.18.0` | `Wie viele Schritte heute?` / `Luftdruck` |
| `2.19.0` | `Schach e2e4` / `Schach neu` |

## Probe (wenn die jeweilige Version CODE ist)

1. Frage wie in der Tabelle — Antwort aus der Quelle oder ehrlich leer.
2. Regression: `Wetter heute`, `Steckdose an`, `Wie spät ist es?`, `kein Kaffee mehr`, `Guten Morgen`, Fahrmodus-Lautstärke = Spotify.
3. `/hilfe` nennt die neue Fähigkeit erst nach dem Sideload.

## Won’t

Alexa, Tuya-Cloud, Tapo, WhatsApp, Apple CarPlay, iOS, Play Store, Google-Kalender-OAuth, WLAN knacken, Brute-Force, Anwalts-Mandat, Giftpilz-Freigabe, Flugpassagiere identifizieren, neue Smart-Home-Marke.
