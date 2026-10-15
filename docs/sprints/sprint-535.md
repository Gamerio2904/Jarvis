# Sprint 535 — Kette als Kartenstapel

**Version:** `18.54.0` — **CODE** Must

**Plan:** [`../106-next.md`](../106-next.md)

**Hängt an:** 531

**Gateway:** go

## Ziel

Aktivierte Karten stehen nummeriert auf der Matte, CL1 unten, und lösen sich von oben mit Pause auf.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S535-1 | Stapel | `yugioh-duel.css` | Dieselben Kartenbilder wie in der Zone. Die Textliste bleibt als zugängliche Bezeichnung erhalten. |
| S535-2 | Tests | `test-yugioh-duel.mjs` | Zwei Glieder lösen in derselben Reihenfolge auf wie passDuelChain. Die Pause ändert das Ergebnis nicht. |

## Go, No-Go, Abbruch

- Go, wenn: Die sichtbare Reihenfolge ist die Engine-Reihenfolge.
- No-Go, wenn: Die Animation vertauscht zwei Glieder.
- Abbruch: Die Pause schreibt den Spielstand ein zweites Mal.
