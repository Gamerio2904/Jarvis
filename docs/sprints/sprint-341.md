# Sprint 341 — Lage Serie-Netz (Rick and Morty)

**Version:** `18.10.0` — **CODE + APK** Must
**Plan:** [`83-next.md`](../83-next.md)
**Voraussetzung:** 340 / Lage-Tabs.

## Ziel

In der Lage ist jeder Charakter der offenen Rick-and-Morty-API ein
Knoten. Antippen öffnet den Steckbrief mit Rasse, Fähigkeiten und
Staffel/Folge. Kanten sind Familie/Verbündet/Gegner oder gemeinsame
Auftritte. Nichts erfinden, das nicht in API oder kuratierter Liste steht.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S341-1 | Snapshot | `rm-snapshot.json` | 826 / 51, Refresh-Skript |
| S341-2 | Skills/Kanten | `rm-dossier.ts` | nur mit Episode-Code |
| S341-3 | Graph | `rm-graph.ts` | Layout, Nachbarn, Steckbrief |
| S341-4 | Lage | Tab Serie, runde Fotos, Dossier | Klick + Suche + Vollbild |
| S341-5 | Stimme | `hud-parse` | Rick and Morty / Charakter-Netz |
| S341-6 | Test | `test-rm-graph.mjs` | 826 Knoten, Schild ≠ S05E05 |
