# 31 — Alltag & Welt (`2.3`–`2.20`)

PO 2026-08-20: Nächste Updates planen — Unwetter/DWD, Schulferien, Wechselkurse, Open Food Facts, Open Library, Bundesliga, Research, Stimme, Garten, Himmel, Tiere, Flüge, Recht, Haushalt, Sport, Handy-Sensoren, Schach. Freie APIs, nichts erfinden.

Reihe davor: [`30-next.md`](./30-next.md). Reihe danach: [`32-next.md`](./32-next.md) Fahren/Musik/Chat/Angebot/FC 26 (`2.21`–`2.27`) **CODE**.

App jetzt: Sideload **`2.28.0`** — `2.4`–`2.20` **mitgeliefert** (nach `2.21.0`, damit versionCode steigt).

Eine Sideload-Stufe pro Version. Hier gebündelt, weil der PO die ganze Reihe angefordert hat.

## Reihenfolge

| Version | Inhalt | API / Quelle | Status |
|---------|--------|--------------|--------|
| **`2.3.0`** | Tablet-Modus + Telefon-Stuck | intern | **CODE** |
| **`2.4.0`** | Unwetter / DWD-Warnung | DWD WFS/CAP, kein Key | **CODE** in `2.28.0` |
| **`2.5.0`** | Schulferien DE | Ferien-API, kein Key | **CODE** in `2.28.0` |
| **`2.6.0`** | Wechselkurse | EZB über Frankfurter.app, kein Key | **CODE** in `2.28.0` |
| **`2.7.0`** | Research härten | Wikipedia/Destatis zuerst, dann bestehende Suche | **CODE** in `2.28.0` |
| **`2.8.0`** | Stimme Alltag | vorhandenes TTS; Uhr, Warnung, Ferien ganze Sätze | **CODE** in `2.28.0` |
| **`2.9.0`** | Open Food Facts | openfoodfacts.org + Name/EAN/Foto-Text | **CODE** in `2.28.0` |
| **`2.10.0`** | Open Library | openlibrary.org | **CODE** in `2.28.0` |
| **`2.11.0`** | Bundesliga | OpenLigaDB, frei | **CODE** in `2.28.0` |
| **`2.12.0`** | Sport-Ergebnisse | gleiche Sport-Schiene, BL2/CL/DFB | **CODE** in `2.28.0` |
| **`2.13.0`** | Garten & Pflanzen | iNaturalist, Foto-Text | **CODE** in `2.28.0` |
| **`2.14.0`** | Himmel | ISS WhereTheISS/Open Notify; Mond lokal | **CODE** in `2.28.0` |
| **`2.15.0`** | Tiere draußen | xeno-canto / iNaturalist | **CODE** in `2.28.0` |
| **`2.16.0`** | Flüge überm Haus | OpenSky, kein Key | **CODE** in `2.28.0` |
| **`2.17.0`** | Recht Alltag | gesetze-im-internet.de | **CODE** in `2.28.0` |
| **`2.18.0`** | Haushalt | festes Pflege-/Fleckwissen | **CODE** in `2.28.0` |
| **`2.19.0`** | Handy-Sensoren | Schritte, Barometer, Kompass — lokal | **CODE** in `2.28.0` |
| **`2.20.0`** | Schach | Chat-Notation, Züge legal; optional Lichess-lesen | **CODE** in `2.28.0` |

Sprint-Kickoff: [`sprint-105.md`](./sprints/sprint-105.md). Lieferung: [`sprint-108.md`](./sprints/sprint-108.md).

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
| `2.3.0` | `aktiviere fullscreen` / `zeig das bild` |
| `2.4.0` | `Gibt’s Unwetter?` / `DWD Warnung` |
| `2.5.0` | `Sind in BW Ferien?` |
| `2.6.0` | `Was ist der Dollar?` |
| `2.7.0` | `Was ist der BIP in Deutschland` — zuerst belegte Quelle |
| `2.8.0` | Uhr, Warnung, Ferien werden vorgelesen, ganze Sätze |
| `2.9.0` | Foto + `Was ist das für ein Produkt?` |
| `2.10.0` | `Was ist das für ein Buch?` / Titel |
| `2.11.0` | `Wie hat der VfB gespielt?` |
| `2.12.0` | `Ergebnis Bayern` / andere Liga, wenn die API sie hat |
| `2.13.0` | Foto + `Was ist das für eine Pflanze?` |
| `2.14.0` | `Wann fliegt die ISS?` / `Mondphase` |
| `2.15.0` | `Welcher Vogel ist das?` (Foto oder ehrliche Absage ohne Clip) |
| `2.16.0` | `Was fliegt da?` |
| `2.17.0` | `Kündigungsfrist Wohnung` — Paragraph + Link |
| `2.18.0` | `Was bedeutet die Waschschüssel?` / Fleck |
| `2.19.0` | `Wie viele Schritte heute?` / `Luftdruck` |
| `2.20.0` | `Schach e2e4` / `Schach neu` |

## Probe (wenn die jeweilige Version CODE ist)

1. Frage wie in der Tabelle — Antwort aus der Quelle oder ehrlich leer.
2. Regression: `Wetter heute`, `Steckdose an`, `Wie spät ist es?`, `kein Kaffee mehr`, `Guten Morgen`, Fahrmodus-Lautstärke = Spotify.
3. `/hilfe` nennt die neue Fähigkeit erst nach dem Sideload.

## Won’t

Alexa, Tuya-Cloud, Tapo, WhatsApp, Apple CarPlay, iOS, Play Store, Google-Kalender-OAuth, WLAN knacken, Brute-Force, Anwalts-Mandat, Giftpilz-Freigabe, Flugpassagiere identifizieren, neue Smart-Home-Marke.
