# Sprint 311 — Intel-Leiste und Regionsdossier

**Version:** `18.6.4` — **CODE** Must
**Plan:** [`77-next.md`](../77-next.md)
**Voraussetzung:** 307; sinnvoll nach 308–310.

## Ziel

Was OSIRIS Intel-Feed + Rechtsklick-Dossier ist: **eine Leiste** und
**Tipp ins Leere** auf der Kugel. Kein zweites Panel-OS.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S311-1 | Leiste | `Lage.tsx` | 1–3 Zeilen: aktive Schicht, Zahl, Quelle, Alter. Leer wenn Schicht aus (ISS-Zeile darf) |
| S311-2 | Tipp leer | `GlobeView` `onEmpty` | Pin-Karte: Blickmitte + Pins in Sicht (Haversine-Kappe) + vorhandenes `briefPlace` |
| S311-3 | Kein Graph | | Keine cytoscape, kein Entity-Expand. Liste in der Karte reicht |
| S311-4 | `Was sehe ich` | `hud-parse` | Bleibt Stadt-Lexikon. Dossier ist Geste, stiehlt den Satz nicht |
| S311-5 | Reduced | | Leiste Text, keine Extra-Animation |

## Won’t

- OSIRIS-HUD klonen. Permanent tickender News-Crawl ohne Schicht.
- Telegram-Lean-Scores.

## Abbruchkriterium

Leertipp schließt die Kugel oder erfindet Ereignisse außerhalb des Cache.

## Manuell

Schicht an, Tipp neben Marker: Karte mit dem was da ist.
Schicht aus, Tipp: Stadt oder Meer ehrlich, wie heute.
