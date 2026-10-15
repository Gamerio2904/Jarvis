# Sprint 545 — Pendelbeschwörung

**Version:** `18.58.0` — **CODE** Must

**Plan:** [`../106-next.md`](../106-next.md)

**Hängt an:** 544

**Gateway:** go

## Ziel

Ein Pendelmonster vom Feld geht offen ins Extra Deck. Die Pendelbeschwörung nimmt einmal pro Zug Karten aus Hand und diesem Extra, deren Stufe zwischen den Skalen liegt.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S545-1 | Beschwörung | `yugioh-duel.ts` | Monster aus dem Extra brauchen eine Extra-Monsterzone oder einen eigenen Link-Zeiger. engineStamp erhöhen. |
| S545-2 | Tests | `test-yugioh-rules.mjs` | Nach der Zerstörung liegt das Pendelmonster im Extra, nicht im Friedhof. Eine Stufe außerhalb der Skalen wird abgelehnt. |

## Go, No-Go, Abbruch

- Go, wenn: Die Pendelbeschwörung umgeht das Zonenlimit aus Sprint 540 nicht.
- No-Go, wenn: Ein Pendelmonster vom Feld landet im Friedhof.
- Abbruch: Die Beschwörung öffnet eine Zone, die ein Link nicht zeigt.
