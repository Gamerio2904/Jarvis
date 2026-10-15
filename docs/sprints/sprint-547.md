# Sprint 547 — Deckeditor mit Filtern

**Version:** `18.59.0` — **CODE** Must

**Plan:** [`../106-next.md`](../106-next.md)

**Hängt an:** 530

**Gateway:** go

## Ziel

Das Deck steht links mit Main und Extra, die Suche rechts, mit Filtern auf dem schon geladenen Bestand.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S547-1 | Editor | `YugiohDuel.tsx` | Filter sind Typ, Attribut, Stufe, Rasse, Archetyp und Effekttext. Die Zähler 40–60 und 0–15 bleiben sichtbar. |
| S547-2 | Tests | `test-yugioh-duel.mjs` | Ein Stufenfilter zeigt nur diese Monster. Der Filter hebt kein Kopierlimit auf und schickt keine neue Suche los. |

## Go, No-Go, Abbruch

- Go, wenn: Main und Extra bleiben getrennte Listen.
- No-Go, wenn: Der Filter umgeht das Kopierlimit beim Hinzufügen.
- Abbruch: Der Filter verlangt einen neuen Katalog, den es lokal nicht gibt.
