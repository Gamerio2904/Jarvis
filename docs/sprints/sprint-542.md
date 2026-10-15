# Sprint 542 — Genannte Fusions- und Synchro-Materialien

**Version:** `18.56.0` — **CODE** Must

**Plan:** [`../106-next.md`](../106-next.md)

**Hängt an:** 540

**Gateway:** go

## Ziel

Nennt der Text einen Namen oder eine Stufensumme, gilt diese Angabe. Fehlt sie, bleibt die bisherige Mindestregel.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S542-1 | Materialprüfung | `yugioh-effects.ts` | Ein mehrdeutiger Text ist fail-closed und zeigt eine Meldung. Keine erfundene Materialliste. engineStamp erhöhen. |
| S542-2 | Tests | `test-yugioh-fidelity.mjs` | Eine Karte mit erkanntem Namen lässt sich ohne dieses Material nicht beschwören. Eine Karte ohne Angabe bleibt bei der Mindestregel. |

## Go, No-Go, Abbruch

- Go, wenn: Die Mindestregel überschreibt einen erkannten Namen nicht.
- No-Go, wenn: Ein unklarer Text erhält trotzdem eine feste Materialliste.
- Abbruch: Die Prüfung lehnt jede Fusion ab, deren Text keine Namen nennt.
