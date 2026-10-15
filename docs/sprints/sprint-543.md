# Sprint 543 — Status auf Zone und im Blatt

**Version:** `18.57.0` — **CODE** Must

**Plan:** [`../106-next.md`](../106-next.md)

**Hängt an:** 530

**Gateway:** go

## Ziel

Negiert, unzielbar und immun stehen als Symbol auf der liegenden Karte und als Zeile im Blatt.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S543-1 | Blatt | `YugiohDuel.tsx` | Das Blatt nennt außerdem Attribut, Stufe oder Rang oder Link-Pfeile und die Typzeile, soweit die Karte sie trägt. |
| S543-2 | Tests | `test-yugioh-duel.mjs` | Das Symbol ist nur sichtbar, solange die Engine den Zustand führt, und verschwindet mit ihm. |

## Go, No-Go, Abbruch

- Go, wenn: Symbol und Blattzeile nennen denselben Zustand.
- No-Go, wenn: Das Symbol bleibt nach dem Ende der Negation stehen.
- Abbruch: Das Symbol zeigt einen Zustand, den die Engine nicht führt.
