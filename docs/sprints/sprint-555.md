# Sprint 555 — Boden

**Version:** `18.64.0` — **PLAN** Must

**Plan:** [`../107-next.md`](../107-next.md)

**Hängt an:** 554

**Gateway:** go

## Ziel

Flächen sind feste Böden. Ein gesetzter Würfel kommt auf der Fläche zur Ruhe.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S555-1 | Boden | `welt-physik.ts` | Jede Tracker-Fläche ist ein fester Körper. Sie wächst mit, ohne die ruhenden Anker zu verschieben. |
| S555-2 | Gewicht | `welt-physik.ts`, `welt.ts` | Masse `0,2 kg`. Nach dem Setzen fällt der Würfel auf den Boden und wechselt von `fällt` zu `liegt`. |
| S555-3 | Test | `test-welt.mjs` | Ein Ablauf mit einer Fläche und einem Würfel darüber endet mit dem Würfel auf der Fläche und Geschwindigkeit 0. |

## Go, No-Go, Abbruch

- Go, wenn: A8 gilt und ein ruhender Würfel seine Lage behält, solange niemand ihn trifft.
- No-Go, wenn: Der Würfel in der Luft stehen bleibt oder durch den Boden fällt.
- Abbruch: Hand, Griff, ein zweiter beweglicher Gegenstand außer dem gesetzten Würfel.

## Prompt

Mache jede erkannte Fläche zu einem festen Boden. Ein neu gesetzter Würfel hat 0,2 kg, fällt auf die Fläche und bleibt liegen. Ein ruhender Würfel ändert seine Lage nicht, solange ihn nichts trifft. Noch keine Hand und kein zweiter Stoß.
