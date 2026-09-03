# Sprint 171 — LocateAnything 3060 GO/NO-GO (`4.77`) **PLAN**

| Feld | Wert |
|------|------|
| Status | **PLAN** |
| Ziel-Version | `4.77.0` (kein Sideload, keine Gewichte) |
| Quelle | [`54-next.md`](../54-next.md) · [`41-next.md`](../41-next.md) |
| Blocker | RTX 3060 12 GB am Tisch. Ohne Karte bleibt das bestehende NO-GO. |

## Ziel

Messung, nicht Hoffnung: passt LocateAnything bei 1280 px in 12 GB, WSL2 vs nativ, Latenz, Lizenzzeile. **GO oder NO-GO schriftlich.** Parser und ehrliches „Sehen aus“ bleiben.

## Must

| ID | Inhalt |
|----|--------|
| L1 | Hardware-Protokoll: GPU, RAM, OS, Treiber |
| L2 | Fit 12 GB / 1280 px, eine Latenzzahl pro Shot (p50) |
| L3 | Lizenz: was darf in JarvisSee, was nicht in die APK |
| L4 | Votum GO oder NO-GO in `41-next.md` |
| L5 | Keine Gewichte in `releases/`, kein WASM-3B |

## Won’t

Sidecar-Execute (172). Erfundene Boxen. NVIDIA-Cloud. Face-ID. Live-Kamera.

## DoD

- [ ] Votum mit Zahlen, nicht „wirkt gut“
- [ ] Parser-Tests unangetastet grün
