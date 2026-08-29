# Sprint 98 — Öffnungszeiten Läden (`1.45.0`)

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Priorität | **MUST** |
| Ziel-Version | **`1.45.0`** |
| Quelle | PO: Öffnungszeiten bei Laden usw. ergänzen |
| Voraussetzung | `1.44.0` |
| Plan | [`28-next.md`](../28-next.md) |

## Ziel

Bestehende POI-Suche um ehrliche Öffnungszeiten aus OSM erweitern. Keine erfundenen Stunden. Drogerie/Laden als weitere Orte derselben Familie.

## Must

| ID | Inhalt | Done wenn |
|----|--------|-----------|
| H1 | `opening_hours` aus OSM sprechen (auf/zu, heute) | Fehlt der Tag: ehrlich |
| H2 | `Hat die Apotheke auf` / `Öffnungszeiten …` ohne Pflicht-Route | Parser vor LLM |
| H3 | Nächste offene nennen, wenn die nächste zu ist | Nur bei bekanntem Status |
| H4 | Version `1.45.0` Sideload | versionCode 14500 |

## Probe

`nächste Apotheke` mit Zeiten. `Hat die Apotheke auf`. `nächster Laden`. Ohne Tag keine erfundenen Stunden.

## Won’t

Google-Places-Stunden, Joyn/ARD als TV-Apps, erfundene Öffnungszeiten, Saisonregeln raten.
