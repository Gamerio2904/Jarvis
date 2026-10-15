# Sprint 537 — Knöpfe Kampf und Ende

**Version:** `18.55.0` — **PLAN** Must

**Plan:** [`../106-next.md`](../106-next.md)

**Hängt an:** 532

**Gateway:** offen

## Ziel

Aus Main 1 führen eigene Knöpfe in die Kampfphase oder direkt in die Endphase. Main 2 gibt es nur nach einem Kampf. Turn 1 bietet keinen Kampf.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S537-1 | Phasen | `YugiohDuel.tsx` | Kampf und Ende ersetzen den einzelnen Sprung „Nächste Phase“ für diese beiden Übergänge. Die übrigen Pflichtschritte bleiben. |
| S537-2 | Tests | `test-yugioh-rules.mjs` | Turn 1 hat keinen Kampfknopf. Ende aus Main 1 überspringt den Kampf. Nach dem Kampf folgt Main 2. |

## Go, No-Go, Abbruch

- Go, wenn: Jarvis spielt dieselben Übergänge ohne hängen zu bleiben.
- No-Go, wenn: Turn 1 kann in die Kampfphase.
- Abbruch: Der Phasenautomat von Jarvis verlangt den alten einzelnen Knopf und stoppt.
