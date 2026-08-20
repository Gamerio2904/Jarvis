# 16 — Mapping: früher `0.13.2`–`0.14` → jetzt `2.2.x`

Die interne Nummerierung `0.13.2`–`0.14` war falsch (Sprints 46–48 auf `main` sind schon Hang-Fix / `0.14.0` / TV). Korrekt:

```text
0.13.2 Latenz          → schon in 2.2.2 (Stream/Threads)     CODE
0.13.3 Live-Qualität   → 2.2.3   Sprint 105                  CODE (in 2.19.0)
0.13.4 optionales 1.5B → 2.2.4   Sprint 106                  PLANNED SHOULD
0.14.0 native llama    → PO, nicht 2.3–2.19
```

Kanonisch: [`30-next.md`](./30-next.md) · [`sprint-105.md`](./sprints/sprint-105.md).  
Probe: [`15-live-probe.md`](./15-live-probe.md).  
Hebel: [`14-on-device-iq.md`](./14-on-device-iq.md).  
Danach Welt: [`31-next.md`](./31-next.md) `2.3`–`2.19`.

Doc-Nr. 16 in der Leseliste ist [`16-gemini.md`](./16-gemini.md).

## `2.2.3` Must (Reihenfolge)

1. Uhr und Akku **live** vom Gerät
2. Musik: kein Spotify-Modal, kein „ich öffne die Musik“ — **keine Spotify-API**
3. „Was steht an“ / „Was kommt heute?“ **ohne Wetter**
4. Wetter **nur** bei Wetterfrage + Standort
5. Ort aus dem Satz; kein München ohne Ort
6. „Guten Morgen“ **nicht** auf die Einkaufsliste
7. Switch-Kauf ≠ Film; Termin 15 Uhr ≠ Ort
8. Recall ohne Müll
9. 0.5B: Persona kompakt, repeat_penalty, Honesty, Siezen, Pack nur bei Overflow
10. Version `2.2.3`

Should: Tabelle, BIP-Zahl, Ticker, `/hilfe` ohne Spotify.

Won’t: Spotify bauen · Wetter ins Briefing · temp-Schnitt · Canned · 1.5B in dieser Version

## `2.2.4` SHOULD

Toggle scharf = 1.5B Q4. Default 0.5B. **Blockiert `2.3.0` nicht.**
