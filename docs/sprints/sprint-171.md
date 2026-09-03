# Sprint 171 — LocateAnything 3060 GO/NO-GO (`4.77`) **NO-GO**

| Feld | Wert |
|------|------|
| Status | **NO-GO** (Freeze in 172) |
| Ziel-Version | `4.77.0` (kein Sideload, keine Gewichte) |
| Quelle | [`54-next.md`](../54-next.md) · [`41-next.md`](../41-next.md) |
| Blocker | RTX 3060 12 GB am Tisch. Ohne Karte bleibt das bestehende NO-GO. |

## Ziel

Messung, nicht Hoffnung. **GO oder NO-GO schriftlich.** Parser und ehrliches „Sehen aus“ bleiben.

## Messung

| Feld | Wert |
|------|------|
| GPU | keine RTX 3060 in dieser Umgebung |
| RAM / 1280 px | nicht gemessen |
| WSL2 vs nativ | nicht gemessen |
| Lizenz in APK | weiterhin **nein** |
| Votum | **NO-GO Gewichte** (bestätigt 2026-08-29 und 2026-09-03) |

Ohne Karte keine Zahlen, keine Hoffnung, keine Dummy-Boxen.

## Must

| ID | Inhalt | Stand |
|----|--------|-------|
| L1 | Hardware-Protokoll | keine 3060 |
| L2 | Fit 12 GB / 1280 px | ungemessen → NO-GO |
| L3 | Lizenz: nicht in die APK | gehalten |
| L4 | Votum in `41-next.md` | **NO-GO** |
| L5 | Keine Gewichte in `releases/` | gehalten |

## Won’t

Sidecar-Execute ohne GO. Erfundene Boxen. NVIDIA-Cloud. Face-ID. Live-Kamera.

## DoD

- [x] Votum mit Begründung (keine Karte = keine Gewichte)
- [x] Parser-Tests unangetastet grün
