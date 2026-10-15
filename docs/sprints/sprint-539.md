# Sprint 539 — Angriffspfeil und LP-Zahl

**Version:** `18.55.0` — **PLAN** Must

**Plan:** [`../106-next.md`](../106-next.md)

**Hängt an:** 538

**Gateway:** offen

## Ziel

Ein Pfeil verbindet Angreifer und Ziel. Die LP-Differenz erscheint als Zahl, und die zerstörte Karte verlässt die Zone.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S539-1 | Bild | `yugioh-duel.css` | Bei prefers-reduced-motion bleiben Pfeil und Zahl ohne Flug. |
| S539-2 | Tests | `test-yugioh-duel.mjs` | Ein Schlag mit Schaden zeigt die negative Zahl. Die Animation ändert LP und Friedhof nicht ein zweites Mal. |

## Go, No-Go, Abbruch

- Go, wenn: Die Zahl stimmt mit der LP-Differenz der Engine überein.
- No-Go, wenn: Die LP ändern sich ohne sichtbare Zahl.
- Abbruch: Die Animation schreibt einen zweiten Schaden.
