# Sprint 426 — Drei Rahmen

**Version:** `18.25.0` — **PLAN** Must
**Plan:** [`97-next.md`](../97-next.md) §4
**Voraussetzung:** 425. Eine Zeile `offen` hat Varianten.

## Ziel

Bis zu drei stumme Bildschirme liegen in der Mitte der Tafel.
Bausteine nehmen keinen Finger an.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S426-1 | Rahmen | `EntwurfStage.tsx` | Maße und Kopfzeile aus Plan §4. Dieselbe Platte wie Start und Tafel. Ab 900 px eine Reihe, darunter untereinander. Die sieben Stücke auf Deckkraft 0,45, `inert`. Mini-Chat bleibt |
| S426-2 | Bausteine | `EntwurfStage.tsx` | Leiste, Liste, Karte, Knopf, Feld, Tab aus der Zeile. Ein Tipp darauf ändert nichts. Leere Zeile zeigt `Noch leer.` |
| S426-3 | Erscheinen | `EntwurfStage.tsx` | Live: Bausteine nacheinander, etwa 80 ms, dann Status **offen**. Bewegung nur `sofort`, `gleiten`, `aufklappen`, höchstens 280 ms. `prefers-reduced-motion`: 120 ms Deckkraft. Wenig Bewegung: alles auf einmal |

## Won't

Wahl, Hausstand, WebGL, Ziehen der Rahmen.

## Abbruchkriterium

Der Knopf in der Attrappe öffnet eine Fläche, oder der Tisch scrollt mit.
