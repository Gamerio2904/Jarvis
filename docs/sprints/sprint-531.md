# Sprint 531 — Aktivieren-Fenster

**Version:** `18.52.0` — **PLAN** Must

**Plan:** [`../106-next.md`](../106-next.md)

**Hängt an:** 530

**Gateway:** offen

## Ziel

Ein optionaler Effekt hält das Duell an und fragt mit Kartenbild und Kettennummer nach Ja oder Nein.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S531-1 | Fenster | `YugiohDuel.tsx` | Ja legt die Karte auf die bestehende Kette. Nein lässt sie in ihrer Zone. |
| S531-2 | Tests | `test-yugioh-duel.mjs` | Ein eigener Trigger und eine gegnerische Aktion öffnen das Fenster. Ein abgelehnter checkActivation-Fall öffnet es nicht. |
| S531-3 | Doku | `yugioh-duel.md` | Das Fenster als Bedienung beschreiben, sobald das Gate zu ist. |

## Go, No-Go, Abbruch

- Go, wenn: Ja und Nein verändern nur die Kette, die passDuelChain schon kennt.
- No-Go, wenn: Das Fenster aktiviert einen Effekt, den checkActivation ablehnt.
- Abbruch: Die bestehende Kette, LIFO oder Spell Speed wird umgangen.
