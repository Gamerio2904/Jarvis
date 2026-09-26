# Sprint 356 — OpenSky ehrlich: BBox, Heading, Alter

**Version:** `18.14.0` — **CODE** Must
**Plan:** [`86-next.md`](../86-next.md)
**Voraussetzung:** main `18.12.0`. Kein neuer Agent. Kein weltweites ADS-B.

## Ziel

Wenn die Schicht `overhead` an ist, holt Jarvis einen Ausschnitt, der
über einem Dorf nicht leer sein muss, speichert den Kurs und sagt den
Fehler, statt eine leere Kugel ohne Grund zu zeigen.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S356-1 | BBox | `globe-layers.ts` `fetchOverhead` | `box = 2.0` (±2°). Fläche 16 sq° ≤ 25 → 1 Credit. Konstante, kein weltweiter `/states/all` |
| S356-2 | Heading | `globe-geo.ts` `GeoFix`, Fetch | `heading?: number` aus OpenSky Feld 10 `true_track`. `null`/NaN weglassen |
| S356-3 | Status | `fetchOverhead` | 429 → „OpenSky-Tageslimit, Schicht bleibt leer“ + Retry-After wenn Header da. 401/403 OAuth ehrlich. Netz/SSL wie heute „nicht erreichbar“ |
| S356-4 | Alter | `ageLine` | Unter 60 s: „Stand vor N s“. Overhead-Antwort und Intel nutzen das. Nie „Live“ |
| S356-5 | Leer | `replyFor` | Bleibt „kein Flugzeug in dem Ausschnitt“ + Herkunft (`Standort` / `Deutschland-Mitte`) |
| S356-6 | Test | `test-globe-layers.mjs` oder bestehend | BBox-Formel, Heading-Map, 429-Text, ageLine(12 s). Gold=TEST_PROMPTS |

## Won’t

Icons (357–359). Poll-Schleife (360). OAuth-Felder (360 Should).
Welt-Query. Interpolation. Neuer Agent.

## Abbruchkriterium

`/states/all` ohne BBox. Oder „Live“ im User-Text. Oder 429 wird
verschluckt und die Kugel tut so, als wäre der Himmel leer.
