# 31 — Alltag & Welt (`3.1`–`3.17`) **CODE**

> Historisch. **Jetzt mitgeliefert in `6.60.0`.** Hirn Gemini zuerst ([`16-gemini.md`](./16-gemini.md)).


PO 2026-08-20: Unwetter/DWD, Schulferien, Wechselkurse, Open Food Facts, Open Library, Bundesliga, Research, Stimme, Garten, Himmel, Tiere, Flüge, Recht, Haushalt, Sport, Handy-Sensoren, Schach. Freie APIs, nichts erfinden.

PO 2026-08-26: Intelligenz zuerst — [`32-intelligence.md`](./32-intelligence.md) ist **`3.0.0`**. Diese Reihe ist **`3.1`–`3.17`**, mitgeliefert in Sideload-Code `3.0.0`.

Reihe davor: Register `3.0.0`. Schiene gelandet in **`3.0.0`**, mitgeliefert in `6.60.0`.

Eine logische Stufe pro Version; Auslieferung gebündelt.

## Reihenfolge

| Version | Inhalt | API / Quelle | Status |
|---------|--------|--------------|--------|
| **`3.1.0`** | Unwetter / DWD-Warnung | DWD JSON, kein Key | **CODE** |
| **`3.2.0`** | Schulferien DE | ferien-api.de | **CODE** |
| **`3.3.0`** | Wechselkurse | EZB über Frankfurter.app | **CODE** |
| **`3.4.0`** | Research härten | Wikipedia + Destatis zuerst | **CODE** |
| **`3.5.0`** | Stimme Alltag | vorhandenes TTS, ganze Sätze | **CODE** |
| **`3.6.0`** | Open Food Facts | openfoodfacts.org | **CODE** |
| **`3.7.0`** | Open Library | openlibrary.org | **CODE** |
| **`3.8.0`** | Bundesliga | OpenLigaDB | **CODE** |
| **`3.9.0`** | Sport-Ergebnisse | gleiche Schiene, weitere Ligen | **CODE** |
| **`3.10.0`** | Garten & Pflanzen | iNaturalist | **CODE** |
| **`3.11.0`** | Himmel | Where The ISS At; Mond lokal | **CODE** |
| **`3.12.0`** | Tiere draußen | iNaturalist | **CODE** |
| **`3.13.0`** | Flüge überm Haus | OpenSky | **CODE** |
| **`3.14.0`** | Recht Alltag | Wikipedia + gesetze-im-internet.de | **CODE** |
| **`3.15.0`** | Haushalt | ISO-3758-Symbole, festes Wissen | **CODE** |
| **`3.16.0`** | Handy-Sensoren | Schritte/Luftdruck ehrlich leer; Kompass wenn Sensor | **CODE** |
| **`3.17.0`** | Schach | Chat-Brett, legale Züge | **CODE** |

Kickoff Docs: [`sprint-105.md`](./sprints/sprint-105.md). Intelligenz-Code: [`sprint-106.md`](./sprints/sprint-106.md).

## Leitentscheidung

| Thema | Entscheidung |
|-------|----------------|
| Netz | Nur freie APIs oder schon vorhandene Suche. Kein neuer Cloud-Zwang. |
| Ehrlichkeit | Fehlt die Zahl/Art/Warnung: das sagen. Kein Raten, kein Anwalts-Rat, keine Essbarkeit. |
| Wetter | `Wetter heute` bleibt Open-Meteo. Warnung nur bei Unwetter-Frage. |
| Foto | Food/Pflanze/Tier: Name oder Foto-Knopf. Unbekannt = ehrlich. |
| Stimme | Keine neue TTS-Firma. |
| Sport | Nur API-Stand. Kein Tippspiel. |
| Recht | Zitat + Link. Nicht „Sie sollten klagen“. |
| Sensoren | Ohne Sensor ehrlich. Keine Gesundheitsdiagnose. |
| Schach | Brett im Chat. Kein Account. |
| Routing | Jede Fähigkeit ist ein Register-Eintrag. |

## Chat (Zielbild)

| Version | Beispiel |
|---------|----------|
| `3.1.0` | `Gibt’s Unwetter?` / `DWD Warnung` |
| `3.2.0` | `Sind in BW Ferien?` |
| `3.3.0` | `Was ist der Dollar?` |
| `3.4.0` | `Was ist der BIP in Deutschland` — Wikipedia/Destatis zuerst |
| `3.5.0` | Uhr, Warnung, Ferien in ganzen Sätzen |
| `3.6.0` | `Was ist das für ein Produkt Nutella` |
| `3.7.0` | `Was ist das für ein Buch Der Prozess` |
| `3.8.0` | `Wie hat der VfB gespielt?` |
| `3.9.0` | `Ergebnis Bayern` / andere Liga, wenn die API sie hat |
| `3.10.0` | `Was ist das für eine Pflanze` |
| `3.11.0` | `Wann fliegt die ISS?` / `Mondphase` |
| `3.12.0` | `Welcher Vogel ist das?` |
| `3.13.0` | `Was fliegt da?` |
| `3.14.0` | `Kündigungsfrist Wohnung` — Text + Link, kein Rat |
| `3.15.0` | `Was bedeutet die Waschschüssel 30` |
| `3.16.0` | `Wie viele Schritte heute?` / `Luftdruck` — ehrlich ohne Sensor |
| `3.17.0` | `Schach e2e4` / `Schach neu` |

## Probe

1. Fragen wie in der Tabelle — Quelle oder ehrlich leer.  
2. Regression: `Wetter heute`, `Steckdose an`, `Wie spät ist es?`, `kein Kaffee mehr`, `Guten Morgen`, Fahrmodus-Lautstärke = Spotify.  
3. `/hilfe` Version `3.0.0`.  
4. Kein neues `if (handleX)` in `chat.ts`.

## Won’t

Alexa, Tuya-Cloud, Tapo, WhatsApp, Apple CarPlay, iOS, Play Store, Google-Kalender-OAuth, WLAN knacken, Brute-Force, Anwalts-Mandat, Giftpilz-Freigabe, Flugpassagiere identifizieren, neue Smart-Home-Marke.
