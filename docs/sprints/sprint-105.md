# Sprint 105 — Live-Qualität (`2.2.3`) **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** (in Sideload `2.19.0`) |
| Priorität | **MUST** |
| Ziel-Version | **`2.2.3`** — geliefert in **`2.19.0`** |
| Quelle | PO-Screenshots 2026-08-20 (Live **2.2.1**, Sideload damals **2.2.2**) |
| Voraussetzung | `2.2.2` |
| Plan | [`30-next.md`](../30-next.md) · Probe [`15-live-probe.md`](../15-live-probe.md) |
| Früher falsch | intern `0.13.3` / Sprint 47 — **nicht** [`sprint-47.md`](./sprint-47.md) (`0.14.0`) |

## Ziel

Alltag **wahr**: Uhr/Akku frisch, kein Fake-Spotify, Briefing ohne Wetter, Wetter nur mit Standort, Begrüßung ≠ Einkauf.

## Must — Live (Reihenfolge)

| ID | Verbesserung | Done wenn |
|----|--------------|-----------|
| L1 | Uhr **live** vom Gerät | ±1 min zur Statusleiste |
| L2 | Akku **live** vom OS | Prozent = Statusleiste |
| L3 | Musik: kein Spotify-Modal, kein Settings-Link, **kein „ich öffne die Musik“** | „Spiel mal was Nettes“ ehrlich; **keine API** |
| L4 | „Was steht an“ / „Was kommt heute?“ ohne Wetter/Luft/Sonne | kein Open-Meteo-Block |
| L5 | Wetter nur bei Wetterfrage + Standort | „anziehen“ ohne Ort = kein Wetter |
| L6 | Ort aus dem Satz, nicht der ganze Satz als Name | Bietigheim+Schirm trifft Ort |
| L7 | Kein München-Default ohne Ort | Luft ohne Ort → nachfragen |
| L8 | Kauf ≠ Film; Terminzeit ≠ Ort | Switch-2-Kauf; Steuer 15 Uhr |
| L9 | Recall ohne Müll | Steuer-Frage nicht Valeo-Wischer |
| L10 | Smalltalk/Begrüßung **nicht** auf die Einkaufsliste | „Guten Morgen“ ≠ Posten |
| L11 | Version `2.2.3` | in Sideload `2.19.0` / versionCode `21900` |

## Should

| ID | Inhalt |
|----|--------|
| L12 | Einfache Tabelle im Chat (BIP-Beispiel) |
| L13 | Fakten mit Netz: Zahl oder „keine Quelle“ |
| L14 | Ticker überlappt nicht Menu/Settings |
| L15 | `/hilfe` nennt kein Spotify, solange keine API |

## Must — On-Device 0.5B (gleiche Version, wenn Gemini aus)

| ID | Verbesserung | Done wenn |
|----|--------------|-----------|
| Q1–Q5 | Persona kompakt (Charakter bleibt), `repeat_penalty 1.12`, Honesty, Siezen-Scrub, Pack nur bei Overflow | wie [`14-on-device-iq.md`](../14-on-device-iq.md) |

## Won’t

- Spotify-API / Playback
- Wetter an Briefings
- temp-Schnitt, Hart-Kappen, Canned-Begrüßung
- 1.5B (→ Sprint 106 / `2.2.4`)
- DWD / `2.3.0` (→ Sprint 107, PO-Kommando)

## Exit / Abnahme

PO: Uhr/Akku stimmen; Musik ohne Lüge; Briefing ohne Wetter; „Guten Morgen“ nicht im Einkauf; Wetter nur mit Standort. Geliefert in **`2.19.0`**.

## Danach

`2.3.0` DWD auf PO-Kommando ([`31-next.md`](../31-next.md)). Optionales 1.5B [`sprint-106.md`](./sprint-106.md) **blockiert DWD nicht**.
