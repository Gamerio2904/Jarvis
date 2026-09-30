# Sprint 405 — Finger

**Version:** `18.22.0` — **PLAN** Must
**Plan:** [`94-next.md`](../94-next.md)
**Voraussetzung:** 404.

## Ziel

Auf dem Tablet zieht der Finger ein Stück. Die Stelle überlebt den Neustart.
Das Handy bleibt die Spalte.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S405-1 | Weg | `board-motion.ts` | `movePiece(id, ziel)`. Anfassen 80 ms, Fahrt etwa 480 ms mit kleinem Überschwingen, Ablegen. Ein Stück zur Zeit |
| S405-2 | Finger | `Workbench.tsx` | Zeiger nur ab 900 px. Loslassen speichert x und y als Anteil 0…1. Fünf Anker (links, rechts, oben, unten, Mitte) als feste Bruchteile |
| S405-3 | Speicher | `store.ts` `settings-schema.ts` | Schlüssel `tischplatte_pieces_json`. Mit im Hausstand. Unter 900 px ignoriert der Zeiger das Stück |

## Won't

Neue Sätze, Ablage, Antworttext.

## Abbruchkriterium

Der Finger verschiebt ein Stück auf dem Handy, oder die Lage liegt nur im RAM.
