# Sprint 406 — Sätze auf der Fläche

**Version:** `18.22.0` — **PLAN** Must
**Plan:** [`94-next.md`](../94-next.md)
**Voraussetzung:** 405. Der Satz ruft `movePiece`, keinen zweiten Weg.

## Ziel

Schieben und in die Mitte per Satz. `Zeig Sprints`, `Zeig PSP` und
`Zeig Quellen` holen das Stück nach vorn. Die anderen bleiben liegen.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S406-1 | Parser | `board-parse.ts` | `Schieb <Stück> nach links|rechts|oben|unten`, `Schieb <Stück> in die Mitte`, `Leg <Stück> in die Mitte`. Stücknamen aus dem Plan. Unbekanntes Stück: die neun Namen |
| S406-2 | Agent | `board.ts` `conflicts.ts` | Weiter `board`, ein Zug. Unter 900 px: `Die freie Fläche ist das Tablet.` Darüber: `movePiece` zum Anker, Antwort `<Stück> liegt <Anker>.` Thema, `nächster Lidl`, Idee und Recherche bleiben |
| S406-3 | Alte Sätze | `board.ts` `test-board.mjs` | `Zeig Sprints` bleibt parse-kind `view` und Tool `board`. Die Fläche blendet die anderen Stücke nicht mehr aus. Fokus-Ring auf der Sprintliste. PSP und Quellen genauso. `test-board.mjs` prüft den Fokus, nicht eine leere Fläche |

## Won't

Ablage, Werfen, Gold, Testkarten.

## Abbruchkriterium

`Zeig Sprints` leert die Fläche, oder `Hintergrund blau schwarz` schiebt ein Stück.
