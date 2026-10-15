# Sprint 534 — Ziele in Friedhof, Deck, Extra und Verbannung

**Version:** `18.53.0` — **CODE** Must

**Plan:** [`../106-next.md`](../106-next.md)

**Hängt an:** 533

**Gateway:** go

## Ziel

Liegt das Ziel in einem öffentlichen Stapel, zeigt das Fenster das Orts-Icon und diese Liste.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S534-1 | Stapel | `YugiohDuel.tsx` | Suche und Wiederbelebung wählen in der offenen Liste. Gegner-Deck und gegnerisches Extra bleiben verdeckt. |
| S534-2 | Tests | `test-yugioh-rules.mjs` | Eine verdeckte gegnerische Karte erscheint nicht in der Auswahlliste. |

## Go, No-Go, Abbruch

- Go, wenn: Der Spieler sieht nur öffentliche Karten und das eigene Deck oder Extra.
- No-Go, wenn: Eine verdeckte gegnerische Karte ist wählbar.
- Abbruch: Die Liste sortiert den Friedhof um. Die Engine-Reihenfolge bleibt.
