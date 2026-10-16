# Sprint 551 — Kachel Welt

**Version:** `18.62.0` — **PLAN** Must

**Plan:** [`../107-next.md`](../107-next.md)

**Hängt an:** keine

**Gateway:** go

## Ziel

Die Kachel **Welt** liegt einmal im Homescreen und öffnet eine leere Sitzung mit dem Zähler `0 Gegenstände`.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S551-1 | Kachel | `home-apps.ts`, `HomeScreen.tsx` | `welt` in `HOME_APP_IDS` und `HOME_APPS`, Beschriftung Welt, Farbe `#7eb6ff`, ein eigenes Zeichen. `lage` und `server` bleiben. |
| S551-2 | Öffnen | `App.tsx`, `WeltOverlay.tsx` | `launchHomeApp('welt')` setzt `weltOpen` und schließt die anderen Vollflächen auf demselben Weg wie `server`. |
| S551-3 | Sitzung | `welt.ts`, `test-welt.mjs`, `test-18.18.mjs` | Eine neue Sitzung zählt 0. Die Home-Liste hat 16 Einträge und `welt` genau einmal. |

## Go, No-Go, Abbruch

- Go, wenn: A1 und A4 gelten und kein Kamerastrom geöffnet wird.
- No-Go, wenn: Die Kachel `raum` heißt oder `Scanne den Raum` diese Fläche öffnet.
- Abbruch: Eine zweite Welt-Kachel, ein Würfel oder eine Flächen-Erkennung in diesem Sprint.

## Prompt

Lege die Homescreen-Kachel Welt an, id welt, Farbe #7eb6ff, und öffne darüber eine leere Fläche mit der Zeile 0 Gegenstände. Schließen kehrt auf den Homescreen zurück. Die Sitzung zählt Gegenstände, ohne eine Kamera zu starten. Scanne den Raum bleibt der Tischplatten-Scan. Kein Würfel, keine Hand, keine Flächen-Erkennung.
