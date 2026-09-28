# Sprint 367 — Lage: Pin-Satz nur aus Feldern

**Version:** `18.15.0` — **CODE + APK** Must
**Plan:** [`87-next.md`](../87-next.md)
**Voraussetzung:** `18.14.2` `globe-copy.ts` CODE. Kein neuer Agent.

## Ziel

Jeder Pin und jede Intel-Zeile spricht nur, was **dieses** Objekt geliefert
hat. Kein Gazetteer-Klischee einer anderen Stadt, kein Briefing-Rest, kein
erfundenes Ziel, kein „Live“.

## Ist

`flightLine` / `fireLine` / `quakeLine` / `satLine` u. a. bauen Sätze aus
Feldern. `pinLineFor` nimmt erst den Quell-Satz, sonst `briefFitsPlace`,
sonst **Gazetteer-Blurb** (`cityLine`), sonst Briefing-Fallback — so kann
„Kiew“ noch einen London-Rest verlieren (Tests decken den einen Fall) oder
einen Pin mit Berlin-Blurb füllen, obwohl der Pin ein Flug ist.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S367-1 | Pin-first | `globe-geo.ts` `pinLineFor` | Reihenfolge: `GeoFix.line` (Felder) → kurzer Ortsname+Quelle → „Keine Kurzlage zu diesem Ort.“ Gazetteer-Blurb **nur** bei kind `outlook`/`glow` ohne `line` |
| S367-2 | Kein Briefing-Diebstahl | `pinLineFor` | `last_globe_brief` nicht als Pin-Text, wenn der Briefing-Ort ≠ Pin-Name (schon Teil-Test; Restschichten) |
| S367-3 | Schicht-Reste | `globe-layers.ts` `replyFor` / Intel | Keine Roh-`extra`-Dumps („Punkte“, Source-IDs). Gleiche Satz-Helfer wie 18.14.2 |
| S367-4 | Honesty | Copy | Nie Interpolation zwischen Polls. Nie „Live“. Heading `null` = Form nach Norden, kein Zufallskurs |
| S367-5 | Test | `test-globe-18.mjs` | Flug-Pin ohne `line` erfindet keine Airline. Kiew-Pin schluckt kein London. `doesNotMatch(/Live/)` bleibt „kein Live“ |

## Won’t

Cesium / `globe.gl`. Welt-ADS-B. Starlink. Positions-Tween. Neuer Agent.
Klischee-Halbsätze aus `PLACES` auf Flug/Sat/Feuer.

## Abbruchkriterium

Pin erzählt eine andere Stadt als sein Name. Oder Copy enthält „Live“
ohne „kein“. Oder Position wandert zwischen zwei Fetches.

## PO-Prüfung

1. Flugzeug antippen: Callsign, Höhe/Kurs wenn Feld da, OpenSky, kein Ziel raten.
2. Stadt-Pin ohne Briefing: Gazetteer nur für Orts-Pins.
3. Intel: Quelle + Alter, „kein Live“.
