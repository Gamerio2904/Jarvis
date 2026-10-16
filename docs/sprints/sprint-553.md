# Sprint 553 — Ursprung

**Version:** `18.63.0` — **PLAN** Must

**Plan:** [`../107-next.md`](../107-next.md)

**Hängt an:** 552

**Gateway:** go

## Ziel

Die erste erkannte Fläche setzt den Ursprung der Welt. Ohne Flächen-Erkennung entsteht kein Würfel.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S553-1 | Schnitt | `welt-tracker.ts` | Der Tracker liefert Flächen, Anker und die Kameralage. Der Test liefert dieselben Felder aus einem festen Ablauf. |
| S553-2 | Ursprung | `welt.ts` | Die erste gehaltene Fläche schreibt den Ursprung. Die Zeile sagt `Fläche`. |
| S553-3 | Fehlen | `WeltOverlay.tsx`, `test-welt.mjs` | Fehlt der Tracker, sagt die Zeile `ARCore fehlt`. Setzen bleibt geschlossen. |

## Go, No-Go, Abbruch

- Go, wenn: A5 gilt. Ein Gerät ohne Flächen-Erkennung ist dabei ein gültiger Ausgang.
- No-Go, wenn: Ein Würfel an den Bildschirm geheftet wird, damit die Fläche trotzdem etwas zeigt.
- Abbruch: Cloud-Anker, mehrere Ursprünge, Hand.

## Prompt

Setze den Ursprung der Welt auf die erste erkannte Fläche und schreibe Fläche in die Zeile. Der Tracker ist eine Schnittstelle. Tests füttern sie mit einem festen Ablauf. Fehlt die Erkennung, steht ARCore fehlt in der Zeile und es lässt sich nichts setzen. Hefte keinen Würfel an den Bildschirm.
