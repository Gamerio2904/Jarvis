# Sprint 408 — Anfassen

**Version:** `18.22.0` — **PLAN** Must
**Plan:** [`94-next.md`](../94-next.md)
**Voraussetzung:** 407. Finger und Satz bleiben auf `movePiece`.

## Ziel

Ein Satz sieht aus, als lege Jarvis die Hand auf das Stück. Die Antwort
kommt danach.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S408-1 | Ring | `board-motion.ts` `index.css` | Vor der Fahrt eines Satzes etwa 160 ms ein Akzent-Ring auf diesem Stück. Der Finger setzt keinen Ring |
| S408-2 | Reihe | `board-motion.ts` | `Räum den Tisch` fährt ein Stück nach dem anderen, Abstand etwa 140 ms. Wenig Bewegung: alle zugleich, nur umblenden |
| S408-3 | Antwort | `board.ts` | Der Satz im Chat erst nach `transitionend`, spätestens nach 1,2 s. Der Text bleibt der aus 406 und 407 |

## Won't

Gold, Version, Testkarten.

## Abbruchkriterium

Die Antwort steht, während das Stück noch in der Mitte liegt, oder der Finger einen Ring bekommt.
