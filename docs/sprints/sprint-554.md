# Sprint 554 — Zwei Anker

**Version:** `18.63.0` — **CODE** Must

**Plan:** [`../107-next.md`](../107-next.md)

**Hängt an:** 553

**Gateway:** go

## Ziel

Ein Tipp setzt einen Würfel in die Welt. Wegdrehen lässt Würfel 1 an Lage und Drehung unverändert.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S554-1 | Setzen | `welt.ts` | Ein Tipp auf eine Fläche legt `w1` mit Lage, Drehung und Anker. Der nächste Tipp legt `w2`. Der neunte Tipp legt nichts an. Kante `0,08 m`. |
| S554-2 | Blick | `welt.ts`, `test-welt.mjs` | Eine Änderung nur der Kameralage lässt Lage und Drehung von `w1` gleich. Der Zähler nennt auch Gegenstände außerhalb des Blicks. |
| S554-3 | Zeile | `WeltOverlay.tsx` | Nach zwei Würfeln, von denen einer im Blick liegt, steht `2 Gegenstände`. |

## Go, No-Go, Abbruch

- Go, wenn: A6 und A7 gelten, einschließlich der Grenze von acht Würfeln.
- No-Go, wenn: Die Kameradrehung Lage oder Drehung eines Würfels schreibt.
- Abbruch: Gewicht, Stoß, Hand, Griff. Die Versionsnummer `18.63.0` setzt nur dieser Sprint, und nur beim Bauen.

## Prompt

Ein Tipp auf eine Fläche legt einen Würfel mit eigener Nummer, Lage, Drehung und Anker in die Welt. Der zweite Tipp legt den nächsten, nach acht ist Schluss. Drehe im Test nur die Kamera: Würfel 1 behält Lage und Drehung, der Zähler zeigt 2 Gegenstände. Kein Gewicht und keine Hand in diesem Sprint.
