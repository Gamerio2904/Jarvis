# Sprint 549 — Duellprotokoll

**Version:** `18.60.0` — **CODE** Must

**Plan:** [`../106-next.md`](../106-next.md)

**Hängt an:** 535

**Gateway:** go

## Ziel

Unter der Statuszeile steht eine Zeile je Beschwörung, Aktivierung, Kettenglied, Angriff und Phasenwechsel.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S549-1 | Protokoll | `YugiohDuel.tsx` | Die Reihenfolge ist die der Engine, einschließlich der Kettenreihenfolge aus Sprint 535. |
| S549-2 | Tests | `test-yugioh-duel.mjs` | Ein abgeschlossener Zug lässt sich Zeile für Zeile nachlesen. Eine nicht ausgeführte Aktion hat keine Zeile. |

## Go, No-Go, Abbruch

- Go, wenn: Jede Zeile nennt eine Aktion, die die Engine ausgeführt hat.
- No-Go, wenn: Das Protokoll ergänzt eine Aktion, die nicht stattfand.
- Abbruch: Dieser Sprint baut kein Replay.
