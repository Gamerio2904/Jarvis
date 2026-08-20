# Sprint 47 — Live-Qualität (`0.13.3`)

| Feld | Wert |
|------|------|
| Status | **PLANNED** |
| Priorität | **MUST** — PO-Screenshots 2026-08-20 |
| Ziel-Version | **`0.13.3`** |
| Quelle | [`15-live-probe.md`](../15-live-probe.md), [`14-on-device-iq.md`](../14-on-device-iq.md) |

## Ziel

Live-Alltag **ehrlich**: kein Fake-Spotify, Briefing ohne Wetter, Wetter nur bei Standort-Frage. Danach 0.5B-Ton/Recall wie gehabt.

## Must — Live (zuerst)

| ID | Verbesserung | Done wenn |
|----|--------------|-----------|
| L1 | **Kein Spotify.** Musik-Intent → kein Modal, kein „API-Zugangsdaten“, kein Settings-Link. Satz: Musik ist nicht angebunden — oder kein Musik-Pfad. | Screenshot-Fehler weg; keine Spotify-API |
| L2 | **„Was steht an“** = Termine/Agenda, **ohne** Wetter/Luft/Sonne | Briefing ohne Open-Meteo |
| L3 | **Wetter nur** bei Wetterfrage **plus** Standort („in X“, „hier“, „Wetter heute“ am Home) | „Was soll ich anziehen?“ / Follow-up ohne Ort = kein Wetter |
| L4 | Ort aus Satz ziehen („in Bietigheim … Schirm“) — nicht den ganzen Satz als Ortsname | kein Chip „Kein Ort“ auf Bietigheim |
| L5 | Kein Stadt-Default (München), wenn kein Ort da ist | „Wie ist die Luft?“ ohne Ort → nachfragen, nicht München |
| L6 | Intent: Konsole/Kauf ≠ Film; „Termin morgen 15 uhr“ = Zeit, kein Ort | Switch-2-Kauf nicht Zoomania; Steuer-Termin nicht „Kein Ort“ |
| L7 | Recall ohne Persona-/Müll-Treffer | „Wann Steuer?“ nicht Valeo-Wischer |

## Must — On-Device 0.5B (danach, gleiche Version)

| ID | Verbesserung | Done wenn |
|----|--------------|-----------|
| Q1 | Persona kompakt, Charakter bleibt | Ton-Anker da |
| Q2 | `repeat_penalty 1.12`; temp 0.7 bleibt | weniger Loops |
| Q3 | Memory-Honesty | unbekannte Prefs nicht raten |
| Q4 | Siezen-Scrub ohne `willst Sie` | Probe sauber |
| Q5 | Pack nur bei Overflow | 8 Turns sonst |
| Q6 | Version `0.13.3` | UI/Changelog |

## Won’t

- Spotify-API / Playback bauen
- Wetter an Briefings hängen
- temp-Schnitt, Hart-Kappen, Canned, 1.5B

## Exit / Abnahme

PO: Musik ohne Spotify-Dialog. „Was steht an“ ohne Wetter. Wetter nur bei Standort-Wetterfrage. Switch-Kauf ≠ Film. Tag **`v0.13.3`**.

## Danach

Sprint 48 / `0.13.4` optionales 1.5B.
