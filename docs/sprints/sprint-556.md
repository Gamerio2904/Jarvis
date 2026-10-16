# Sprint 556 — Stoß

**Version:** `18.64.0` — **CODE** Must

**Plan:** [`../107-next.md`](../107-next.md)

**Hängt an:** 555

**Gateway:** go

## Ziel

Zwei Würfel stoßen sich, können aufeinander liegen, und eine Kopfdrehung schreibt keine Lage.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S556-1 | Stoß | `welt-physik.ts` | Würfel sind bewegliche Körper. Sie durchdringen einander und den Boden nicht. |
| S556-2 | Liegen | `welt-physik.ts` | Ein Würfel kann auf einem anderen zur Ruhe kommen. Ruhende Würfel schlafen. |
| S556-3 | Test | `test-welt.mjs` | Zwei Würfel auf derselben Fläche überlappen am Ende nicht. Eine reine Kameradrehung lässt beide Lagen gleich. |

## Go, No-Go, Abbruch

- Go, wenn: A9 gilt.
- No-Go, wenn: Ein Würfel durch den anderen hindurch liegt oder die Kopfdrehung eine Lage neu schreibt.
- Abbruch: Hand und Griff. Die Versionsnummer `18.64.0` setzt nur dieser Sprint, und nur beim Bauen.

## Prompt

Würfel stoßen sich und bleiben auf dem Boden oder aufeinander liegen. Sie durchdringen sich nicht. Ruhende Würfel schlafen. Im Test dreht sich nur die Kamera, beide Lagen bleiben. Noch keine Hand.
