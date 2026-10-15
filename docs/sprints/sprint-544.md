# Sprint 544 — Pendel-Skalen

**Version:** `18.58.0` — **CODE** Must

**Plan:** [`../106-next.md`](../106-next.md)

**Hängt an:** 540

**Gateway:** go

## Ziel

Links und rechts der Monsterreihe liegen zwei Skalen-Slots. Nur eine Karte mit gelieferter Skala belegt einen Slot.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S544-1 | Skalen | `yugioh-duel.ts` | Fehlt die Skala in den Kartendaten, bleibt die Karte als Pendel unspielbar und die Meldung sagt das. Keine erfundene Skala. engineStamp erhöhen. |
| S544-2 | Tests | `test-yugioh-rules.mjs` | Zwei Pendelkarten besetzen die beiden Slots. Eine Nicht-Pendelkarte wird abgelehnt. |

## Go, No-Go, Abbruch

- Go, wenn: Die angezeigte Skala ist die gelieferte Skala.
- No-Go, wenn: Eine Karte ohne Skala erhält eine Zahl.
- Abbruch: Ein Slot verdrängt eine Monsterzone.
