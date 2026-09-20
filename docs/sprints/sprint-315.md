# Sprint 315 — 18.7 Leit + UI-Action-Katalog

**Version:** `18.7.0` — **PLAN** Must
**Plan:** [`78-next.md`](../78-next.md)
**Voraussetzung:** App-Code `18.6.0`. Nicht parallel zu `18.5` (301–306).

## Ziel

Die Leitentscheidung steht im Code: Jarvis steuert **Jarvis-Flächen**,
nicht das Betriebssystem. Ein Schnitt `ui-action` im Agent `app` listet
die Ids, bevor Chips oder Writes kommen.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S315-1 | Typ | `app-parse.ts` `app.ts` | `AppIntent` um `ui`: `{ kind:'ui', action: UiAction }`. `UiAction` = `overlay.open` / `overlay.close` / `settings.tab` / `settings.set` / `dock.go`. Kein zweiter Organizer, kein neuer Agent |
| S315-2 | Katalog | `app-parse.ts` oder `ui-action.ts` **neu** | Tabelle aus Plan §3.2 als Konstanten: Overlay-Ids aus `overlay-fsm.ts`, Dock-Ids `chat\|lage\|voice\|calendar\|settings`. `lage.view` **nicht** hier — bleibt `hud` |
| S315-3 | Won’t-Gate | `app-parse.ts` | `wlan\|wifi\|bluetooth\|nicht stören` bleibt `null` (schon da). Neu: `klick\|tipp\|speichern\|screenshot` → nicht `ui`. Computer-Use bleibt Freeze |
| S315-4 | Docs | `78-next.md` bleibt Quelle | Keine zweite Wahrheit. `42` / `09` / Sprint-Index nur in 321 anfassen, wenn Execute das verlangt — dieser PLAN-Sprint schreibt sie schon mit |

## Won’t

- Chips (316). Overlay-Hand (317). Settings-Writes (319). Propose-DOMAIN (320).
- LLM wählt die Fläche. e5 in `pickRoute`.

## Abbruchkriterium

Ein zweiter Agent oder ein Computer-Use-Pfad entsteht. Oder `lage.view`
wird hier nachgebaut und stiehlt `hud`.

## Manuell

Kein sichtbarer Unterschied. Katalog-Test: jede Id aus §3.2 existiert
genau einmal, `wlan aus` bleibt `null`.
