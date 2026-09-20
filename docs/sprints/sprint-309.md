# Sprint 309 — Kugel: See und Infra

**Version:** `18.6.2` — **PLAN** Must
**Plan:** [`77-next.md`](../77-next.md)
**Voraussetzung:** 307.

## Ziel

Schiffe um **uns**, plus wenige Häfen/Engstellen und eine feste
Anlagen-Tabelle. Kein weltweites AIS.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S309-1 | `ships` BBox | `globe-layers.ts` | Wie `overhead`: Ausschnitt um GPS/DE. Public-AIS oder ehrlich leer |
| S309-2 | Häfen/Engstellen | Tabelle klein | Hormus, Malakka, Suez, Panama, Rotterdam, Hamburg, … fest, kein Crawl |
| S309-3 | `infra` | statische Liste | Kernkraft/große Anlagen öffentlich bekannt, Koordinaten im Repo. Kein Scraping |
| S309-4 | Parser | `hud-parse.ts` | `Was fährt auf See`, `Zeig Häfen`, `Kernkraft` / `Kritische Anlagen` |
| S309-5 | Reply | | Zahl + BBox-Label + Alter. Keine Schiffsnamen erfinden |

## Won’t

- AIS-Key Pflicht. Weltkarte voller Schiffe. OSM-Dump in der APK.

## Abbruchkriterium

Default-Lage lädt AIS. Oder mehr als 40 Schiffs-Pins.

## Manuell

`Was fährt auf See` → wenige Marker oder ehrliches Leer.
`Kernkraft` → feste Pins, Quelle „Tabelle“, kein Live.
