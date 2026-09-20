# Sprint 308 — Kugel: Erde und Orbit

**Version:** `18.6.1` — **PLAN** Must
**Plan:** [`77-next.md`](../77-next.md)
**Voraussetzung:** 307.

## Ziel

Unwetter, Luft, GPS-Störung, Satelliten-Subset und Weltraumwetter-Text
auf Zuruf. Feuer darf FIRMS nutzen, EONET bleibt Fallback.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S308-1 | `weather` | `globe-layers.ts` | EONET open, nicht nur Wildfire. Max 40. Quelle NASA EONET |
| S308-2 | `air` | | Stationen **BBox** um Standort/DE-Mitte. OpenAQ oder gleichwertig public. Kein Welt-Grid |
| S308-3 | `radar` | | Öffentliche GNSS-Stör-Meldungen. Fehlt die Quelle: Schicht ehrlich aus, Sprint trotzdem grün für den Rest |
| S308-4 | `fires` | | FIRMS keyless wenn machbar, sonst EONET lassen. Nicht beide Teppiche |
| S308-5 | `sats` | | Höchstens 16 Objekte **plus** vorhandene ISS. Kein CelesTrak-1700 in der APK |
| S308-6 | Weltraumwetter | `globe-brief.ts` / Reply | NOAA SWPC als Satz (Kp/Flare), keine Pin-Wolke |
| S308-7 | Parser | `hud-parse.ts` | Sätze aus Plan §4. Skip `unknown_place` |

## Won’t

- Starlink-Wolke. Label Live. Weltweites ADS-B (bleibt `overhead`).

## Abbruchkriterium

Mehr als 16 Orbit-Pins oder Lage-Start lädt FIRMS von allein.

## Manuell

`Zeig Unwetter`, `Luftqualität`, `Zeig Satelliten`, `Weltraumwetter`.
Quelle + Alter. Lite: weniger Marker.
