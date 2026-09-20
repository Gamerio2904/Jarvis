# Sprint 317 — Overlay Hand und Befehl dieselbe FSM

**Version:** `18.7.2` — **PLAN** Must
**Plan:** [`78-next.md`](../78-next.md)
**Voraussetzung:** Sprint **316**. Watchlist-Parser aus `18.6` bleibt.

## Ziel

Hand und Satz öffnen **dieselbe** Folie. Fertig, Dock-Chat und
`Einstellungen zu` / `Overlay zu` schließen oben. Kein Drive-Diebstahl.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S317-1 | Open-Parity | `watchlist-parse.ts` `App.tsx` | Dock-Filme und `Öffne Watchliste` / `Öffne Lieblingsfilme` / `Öffne das watchlist overlay` rufen **eine** Funktion. Fokus aus Intent, nicht aus zuletzt getipptem Tab |
| S317-2 | Close | `app-parse.ts` `overlay-fsm.ts` | `overlay.close`: `Einstellungen zu`, `Overlay zu`, `Folie zu`, `Fertig` (nur wenn eine Folie oben). `reduceOverlay({ type:'close' })`. Drive/Schach nicht über diesen Satz |
| S317-3 | Conflicts | `conflicts.ts` `drive-parse.ts` | `watchliste` / `lieblinge` / `overlay` bleiben Watchliste, nicht Navi. Regression aus 18.6 nicht aufweichen |
| S317-4 | Dock | `App.tsx` `goDock` | Chat schließt Watchliste (schon da). Lage/Hören/Kalender/Mehr ebenso. Thumb sitzt auf Filme, solange die Folie oben ist |
| S317-5 | Test | `test-watchlist.mjs` o. ä. | Gold: Open-Sätze, Close-Sätze, Dock-Fokus. `Öffne das watchlist overlay` ≠ drive |

## Won’t

- Zweites Overlay für Lieblinge. Trailer / YouTube. Neue Overlay-Id.

## Abbruchkriterium

Dock und Befehl zeigen verschiedene Tabs. Oder Close schließt Drive.
Oder der Watchlist-18.6-Fix fällt zurück auf Fahrmodus.

## Manuell

```
Öffne die Watchliste
Öffne Lieblinge
Einstellungen zu
```

Thumb danach weg von Filme. `Öffne das watchlist overlay` bleibt Watchliste.
