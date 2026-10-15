# Sprint 538 — Kampfschritte und Schadensfenster

**Version:** `18.55.0` — **PLAN** Must

**Plan:** [`../106-next.md`](../106-next.md)

**Hängt an:** 537

**Gateway:** offen

## Ziel

Die Kampfphase zeigt Start, Angriffsdeklaration, Schadensrechnung und Ende. Vor der Schadensrechnung bleibt ein Antwortfenster.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S538-1 | Schritte | `yugioh-duel.ts` | Eine Falle kann zwischen Deklaration und Schaden noch auf die Kette. Ohne Antwort rechnet der Schlag wie bisher. engineStamp erhöhen. |
| S538-2 | Tests | `test-yugioh-rules.mjs` | negateAttack im Fenster verhindert den Schaden. Ein Schlag ohne Antwort trifft denselben LP-Stand wie vor diesem Sprint. |

## Go, No-Go, Abbruch

- Go, wenn: Der Schaden wird erst festgeschrieben, wenn das Fenster zu ist.
- No-Go, wenn: Deklaration und Schaden sind derselbe Tipp, bevor eine Antwort möglich war.
- Abbruch: Das Fenster erreicht negateAttack nicht mehr.
