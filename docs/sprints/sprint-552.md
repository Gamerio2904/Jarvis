# Sprint 552 — Auge der Welt

**Version:** `18.62.0` — **CODE** Must

**Plan:** [`../107-next.md`](../107-next.md)

**Hängt an:** 551

**Gateway:** go

## Ziel

Die Rückkamera füllt die Weltfläche, und Schließen gibt den Kamerastrom frei.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S552-1 | Bild | `WeltOverlay.tsx` | Rückkamera als Hintergrund. Die Zeile bleibt `0 Gegenstände`, solange nichts gesetzt ist. |
| S552-2 | Freigabe | `WeltOverlay.tsx` | Schließen stoppt jeden Kamerastrom dieser Fläche. |
| S552-3 | Erlaubnis | Capacitor-Android-Hülle | `CAMERA` eintragen, sobald die Hülle im Baum liegt. Fehlt sie, nennt die Zeile den Grund und die Fläche bleibt leer. Lücke L3. |

## Go, No-Go, Abbruch

- Go, wenn: A2 und A3 gelten und der Zähler danach weiter 0 ist.
- No-Go, wenn: Ohne Kamerabild ein Würfel oder eine erfundene Fläche erscheint.
- Abbruch: Tracker, Anker oder Hand in diesem Sprint. Die Versionsnummer `18.62.0` setzt nur dieser Sprint, und nur beim Bauen.

## Prompt

Fülle die Weltfläche mit der Rückkamera. Ohne Erlaubnis oder ohne Kamera bleibt sie leer und die Zeile nennt den Grund. Schließen beendet den Strom. Der Zähler bleibt 0 Gegenstände. Lege noch keinen Würfel und keine Flächen-Erkennung an. Die Android-Erlaubnis kommt in die Capacitor-Hülle, sobald sie im Baum liegt.
