# Sprint 47 — Live-Qualität (`0.13.3`)

| Feld | Wert |
|------|------|
| Status | **IN SPRINT** |
| Priorität | **MUST** — PO-Screenshots 2026-08-20 (2.2.1 / Gemini) |
| Ziel-Version | **`0.13.3`** |
| Quelle | [`15-live-probe.md`](../15-live-probe.md), [`14-on-device-iq.md`](../14-on-device-iq.md) |

## Ziel

Live-Alltag **wahr**: Uhr/Akku frisch, kein Fake-Spotify, Briefing ohne Wetter, Wetter nur mit Standort, Begrüßung ≠ Einkauf.

## Must — Live

| ID | Verbesserung | Done wenn |
|----|--------------|-----------|
| L1 | Musik: kein Spotify-Modal, kein Settings-Link, **kein „ich öffne die Musik“** ohne Player | „Spiel mal was Nettes“ ehrlich; keine API |
| L2 | „Was steht an“ / „Was kommt heute?“ ohne Wetter/Luft/Sonne | kein Open-Meteo, kein Valeo-Wetterblock |
| L3 | Wetter nur bei Wetterfrage + Standort | „anziehen“ ohne Ort = kein Wetter |
| L4 | Ort aus Satz, nicht ganzer Satz als Name | Bietigheim+Schirm trifft Ort |
| L5 | Kein München-Default ohne Ort | Luft ohne Ort → nachfragen |
| L6 | Kauf ≠ Film; Terminzeit ≠ Ort | Switch-2-Kauf; Steuer 15 Uhr |
| L7 | Recall ohne Müll | Steuer-Frage nicht Valeo-Wischer |
| L8 | **Uhr live** vom Gerät | ±1 min zur Statusleiste |
| L9 | **Akku live** vom OS | Prozent = Statusleiste |
| L10 | Smalltalk/Begrüßung **nicht** auf die Einkaufsliste | „Guten Morgen“ ≠ Posten |

## Should — Live

| ID | Inhalt |
|----|--------|
| L11 | Einfache Tabelle im Chat (BIP-Beispiel) |
| L12 | Fakten mit Netz: Zahl oder „keine Quelle“, kein leeres Verweigern trotz Gemini |
| L13 | Ticker überlappt nicht Menu/Settings |
| L14 | `/hilfe` nennt kein Spotify, solange keine API |

## Must — On-Device 0.5B (gleiche Version)

| ID | Verbesserung | Done wenn |
|----|--------------|-----------|
| Q1–Q5 | Persona kompakt, repeat_penalty, Honesty, Siezen, Pack-bei-Overflow | wie [`14`](../14-on-device-iq.md) |
| Q6 | Version `0.13.3` | UI/Changelog |

## Won’t

- Spotify-API / Playback
- Wetter an Briefings
- Smart-Home/Karte/Bahn aus der 2.2.1-Hilfe als Lieferziel
- temp-Schnitt, Hart-Kappen, Canned, 1.5B

## Exit / Abnahme

PO: Uhr/Akku stimmen; Musik ohne Lüge; Briefing ohne Wetter; „Guten Morgen“ nicht im Einkauf; Wetter nur mit Standort. Tag **`v0.13.3`**.

## Danach

Sprint 48 / `0.13.4` optionales 1.5B.
