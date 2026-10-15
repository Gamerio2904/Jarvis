# Sprint 546 — Ritualbeschwörung

**Version:** `18.58.0` — **PLAN** Must

**Plan:** [`../106-next.md`](../106-next.md)

**Hängt an:** 533

**Gateway:** offen

## Ziel

Ritual beschwört aus der Hand mit Tributmonstern, deren Stufensumme mindestens die Ritualstufe erreicht.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S546-1 | Ritual | `yugioh-duel.ts` | Nennt der Text eine Ritualzauber, liegt diese Karte dabei. Die Tributmonster gehen auf den Friedhof. Die Normalbeschwörung bleibt unberührt. engineStamp erhöhen. |
| S546-2 | Tests | `test-yugioh-rules.mjs` | Zu wenig Stufe beschwört nicht. Eine Nicht-Ritualkarte zeigt den Ritualweg nicht. |

## Go, No-Go, Abbruch

- Go, wenn: Ritual verbraucht normalSummonUsed nicht.
- No-Go, wenn: Ritual benutzt den Normalbeschwörungsschritt.
- Abbruch: Der Text ist kein Ritual, und der Knopf erscheint trotzdem.
