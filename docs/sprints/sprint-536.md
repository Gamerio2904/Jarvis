# Sprint 536 — Reihenfolge gleichzeitiger Trigger

**Version:** `18.54.0` — **CODE** Must

**Plan:** [`../106-next.md`](../106-next.md)

**Hängt an:** 535

**Gateway:** go

## Ziel

Liegen mehrere eigene Trigger gleichzeitig, wählt der Spieler, welches Glied zuerst auf die Kette kommt.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S536-1 | Wahl | `yugioh-duel.ts` | Die gewählte Reihenfolge wird die Kettenreihenfolge. Spell Speed bleibt die Grenze. |
| S536-2 | Tests | `test-yugioh-rules.mjs` | Zwei gleichzeitige eigene Trigger erzeugen eine Wahl. Eine verbotene Reihenfolge lässt sich nicht bestätigen. |

## Go, No-Go, Abbruch

- Go, wenn: AUTO und ON fragen nach der Reihenfolge, wenn mehr als ein eigener Trigger liegt.
- No-Go, wenn: Die Engine erzwingt eine feste Reihenfolge, obwohl der Spieler wählen darf.
- Abbruch: Die Wahl legt ein Spell-Speed-1-Glied über ein schnelleres Antwortfenster.
