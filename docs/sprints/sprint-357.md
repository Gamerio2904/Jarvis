# Sprint 357 — Stecknadel Standort

**Version:** `18.14.0` — **PLAN** Must
**Plan:** [`86-next.md`](../86-next.md)
**Voraussetzung:** 356 (kein Pflicht-Datenfeld). Zeichnung darf parallel zu 358/359.

## Ziel

Der eigene Ort ist eine Stecknadel, kein grüner Punkt. Ein älterer Fix
bleibt als „letzter Stand“ sichtbar.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S357-1 | Letzter Fix | `globe-pins.ts` + `location-keep.ts` | Frisch: wie heute `isFreshHereFix`. Sonst: gültige `last_lat`/`last_lon` (nicht 0/0) als `here` mit `line` / Name „letzter Stand“ |
| S357-2 | Form | `GlobeView.tsx` | `drawHerePin`: Tropfen (Kopfkreis + Spitze), Puls nur wenn frisch. Farbe frisch `#1ed760`, alt `#6a8f72` |
| S357-3 | Lite | `drawPins` | Nadel und Label bleiben im Lite-Modus |
| S357-4 | Kein Fake | — | Ohne Koordinaten keine Nadel „Sie“. DE-Mitte ist nur Overhead-Herkunft, kein Standort-Pin |
| S357-5 | Test | `test-location-keep.mjs` / globe | Frisch vs. 15 min alt vs. 0/0. Kein Pin bei leerem Store |

## Won’t

Neuen GPS-Wert erfinden. Nadel auf Deutschland-Mitte als „Sie“.
Flugzeug/Sat-Form (358/359). Standort-Polling schneller als heute.

## Abbruchkriterium

Ein Punkt statt Nadel. Oder eine Nadel ohne gespeicherte Koordinate.
Oder 0/0 wird „Sie“.
