# 16 — Fahrplan (verbindlich)

Aus den Docs: [`14`](./14-on-device-iq.md) · [`15`](./15-live-probe.md) · Sprints 46–48.

```text
0.13.2 Latenz     CODE
     ↓
0.13.3 Live-Qualität   IN SPRINT   ← jetzt
     ↓
0.13.4 Intelligenz     PLANNED     optional 1.5B
     ↓
0.14.0 native llama    PO
```

NAS, TV, Spotify-API, Play Store: **Parking**.

---

## Sprint 46 / `0.13.2` — Latenz — **CODE**

Gleiches Modell, gleicher Prompt, gleiches Sampling.

| Must | Inhalt |
|------|--------|
| L1 | Threads `min(4, cores−1)` statt 1 |
| L2 | Token-Stream bis EOS |
| L3 | Version `0.13.2` |

---

## Sprint 47 / `0.13.3` — Live-Qualität — **IN SPRINT**

Quelle: Live-Screens Jarvis **2.2.1** (Gemini) + On-Device 0.5B.  
Detail: [`15-live-probe.md`](./15-live-probe.md) · [`sprints/sprint-47.md`](./sprints/sprint-47.md)

### Must (Reihenfolge)

1. Uhr und Akku **live** vom Gerät (nicht 07:47 / 97 %)
2. Musik: kein Spotify-Modal, kein „ich öffne die Musik“ — **keine Spotify-API bauen**
3. „Was steht an“ / „Was kommt heute?“ **ohne Wetter**
4. Wetter **nur** bei Wetterfrage + Standort
5. Ort aus dem Satz; kein München ohne Ort
6. „Guten Morgen“ **nicht** auf die Einkaufsliste
7. Switch-Kauf ≠ Film; Termin 15 Uhr ≠ Ort
8. Recall ohne Müll
9. 0.5B: Persona kompakt, repeat_penalty, Honesty, Siezen, Pack nur bei Overflow
10. Version `0.13.3`

### Should

- Tabelle im Chat (BIP)
- Fakten: Zahl oder „keine Quelle“
- Ticker überlappt nicht die Icons
- `/hilfe` ohne Spotify-Claim

### Won’t

Spotify bauen · Wetter ins Briefing · Karte/Bahn/Shelly · temp-Schnitt · Canned · 1.5B

---

## Sprint 48 / `0.13.4` — Intelligenz — **PLANNED**

| Must | Inhalt |
|------|--------|
| I1 | Toggle **scharf** = 1.5B Q4 (~1,1 GB); Default bleibt 0.5B |
| I2 | Task-Nudge nur bei Task |
| I3 | OOM → Fallback 0.5B |
| I4 | Version `0.13.4` |

Kein Auto-Switch, kein Cloud.

---

## Danach (PO)

| Version | Thema |
|---------|--------|
| `0.14.0` | Native llama.cpp |
| `1.0.0` | MAJOR, Inhalt offen |
| — | TTS |

---

## Was dieses Git-Repo liefern kann

Dieses Repo ist **on-device WASM** (`0.13.2`), nicht Gemini 2.2.1. In Sprint 47 hier umsetzbar: Intent/Memory/Tools (L6, L7, L10, Q1–Q5), ehrliche `/hilfe`, kein Fake-Musik-Pfad.

Uhr, Akku, Open-Meteo, Briefing-Wetter, Spotify-Modal sitzen in der **Live-App 2.2.1** — bleiben Must in der Planung, bis derselbe Alltag in diesem Stack steckt.
