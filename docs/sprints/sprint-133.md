# Sprint 133 — Fly-to Satellit + Stadt-Briefing (`6.80`) **PLAN**

| Feld | Wert |
|------|------|
| Status | **PLAN** |
| Priorität | nach Research `6.71` |
| Ziel-Version | `6.80.0` |
| Quelle | [`48-next.md`](../48-next.md) |
| Baut auf | `handleHud` pin/look, `news.ts` place, `outlook.ts` Tags, `polishToolLine` |

## Ziel

`Zeig London` landet in GIBS. Danach **ein** Briefing: Lexikon-Satz + Tagesschau-Ort oder ehrlich leer + Markt **nur** bei Kette. Pin-Tap derselbe Text. Gemini-Schliff, Guard hält Zahlen.

## Must

| ID | Inhalt |
|----|--------|
| E1 | Focus-Zoom ≥ GIBS (Default ~4.4 laut Research) |
| E2 | `handleHud` pin sammelt news/outlook, fehlende Teile weglassen |
| E3 | Hormus/OPEC/EZB: Öl/FX wie outlook, kein Aktien-Rat |
| E4 | Unbekannter Ort unverändert ehrlich |
| E5 | Gold 1–4 aus [`48-next.md`](../48-next.md) |
| E6 | Parser bleibt `hud` |

## Won’t

Neue Tools. Geocoder. Live. Anomalien/Plan (134). Sideload.
