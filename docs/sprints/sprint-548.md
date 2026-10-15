# Sprint 548 — Banlist-Farben und verwandte Karten

**Version:** `18.59.0` — **CODE** Must

**Plan:** [`../106-next.md`](../106-next.md)

**Hängt an:** 547

**Gateway:** go

## Ziel

Die Farben kommen aus dem gelieferten Kopierlimit, und verwandte Karten aus demselben Archetyp-Namen im lokalen Katalog.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S548-1 | Farben | `YugiohDuel.tsx` | Limit 0, 1 und 2 haben drei Farben. Fehlt ein Limit, bleibt die Karte ohne Banlist-Farbe. |
| S548-2 | Tests | `test-yugioh-duel.mjs` | Verwandte Karten stammen nur aus dem lokalen Katalog. Fehlt der Archetyp-Name, ist die Liste leer und sagt das. |

## Go, No-Go, Abbruch

- Go, wenn: Keine Farbe behauptet eine Banlist, die der Katalog nicht geliefert hat.
- No-Go, wenn: Eine Karte ohne Limit wird als verboten gezeigt.
- Abbruch: Die Liste erfindet einen Archetyp-Namen.
