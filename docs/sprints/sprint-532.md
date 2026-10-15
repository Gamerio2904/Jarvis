# Sprint 532 — Schalter OFF, AUTO und ON

**Version:** `18.52.0` — **PLAN** Must

**Plan:** [`../106-next.md`](../106-next.md)

**Hängt an:** 531

**Gateway:** offen

## Ziel

Der Schalter auf der Matte filtert, wann das Fenster erscheint, und bleibt lokal gespeichert.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S532-1 | Schalter | `YugiohDuel.tsx` | AUTO fragt bei gegnerischer Aktion und eigenem Trigger. ON zusätzlich vor dem Phasenwechsel und nach jeder Auflösung. OFF nur bei Pflicht-Effekten. |
| S532-2 | Tests | `test-yugioh-duel.mjs` | Drei Stellungen ändern die Fragen. OFF lässt einen Pflicht-Effekt durch. Die Stellung überlebt das Schließen des Duells. |

## Go, No-Go, Abbruch

- Go, wenn: Die Stellung filtert die Frage und ersetzt die Engine-Priorität nicht.
- No-Go, wenn: OFF verschluckt einen Pflicht-Effekt.
- Abbruch: Der Schalter entscheidet die Auflösung statt nur die Frage.
