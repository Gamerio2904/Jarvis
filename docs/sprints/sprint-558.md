# Sprint 558 — Gelenk

**Version:** `18.66.0` — **PLAN** Must

**Plan:** [`../107-next.md`](../107-next.md)

**Hängt an:** 557

**Gateway:** go

## Ziel

Ein Zangengriff in `0,04 m` hebt den Würfel über ein Gelenk. Ein Griff daneben lässt die Anker liegen.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S558-1 | Treffer | `welt.ts` | Die Zange gilt, wenn Daumen und Zeigefinger nah beieinander sind, gemessen an der eigenen Hand. Der nächste Würfel muss innerhalb von `0,04 m` liegen. |
| S558-2 | Gelenk | `welt-physik.ts` | Der gehaltene Würfel hängt an der Hand, behält `0,2 kg`, zieht kurz nach, nimmt die Handdrehung mit und stößt Boden und andere Würfel. Zustand `gehalten`. |
| S558-3 | Fehlgriff | `welt.ts`, `test-welt.mjs` | Daneben, oder ohne Weltlage, schreibt die Zeile `fehlgeschlagen`. Lage und Drehung beider Würfel bleiben die Werte von vor dem Griff. |

## Go, No-Go, Abbruch

- Go, wenn: A11 gilt.
- No-Go, wenn: Ein Griff neben dem Würfel ihn verschiebt oder der gehaltene Würfel durch den Tisch fällt.
- Abbruch: Loslassen, Cloud-Anker, neunter Würfel.

## Prompt

Hebe einen Würfel nur an, wenn die Zange höchstens 4 cm von ihm entfernt ist. Er hängt dann an der Hand, behält seine Masse, stößt andere Würfel und den Boden. Ein Griff daneben schreibt fehlgeschlagen und lässt beide Anker liegen. Das Loslassen baut dieser Sprint noch nicht.
