# Sprint 316 — Listen-Chips über dem Dock

**Version:** `18.7.1` — **PLAN** Must
**Plan:** [`78-next.md`](../78-next.md)
**Voraussetzung:** Sprint **315**. Material: Dock bleibt 5 Ziele.

## Ziel

Watchliste und Lieblinge liegen **sichtbar unten**, ohne ein 6. Dock-Icon.
Zwei Chips über `.nav-dock`. Ein Overlay, Tab = Fokus.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S316-1 | Chrome | `App.tsx` `index.css` | Leiste `nav-listen` **über** `NavIsland.nav-dock`, nur wenn `!driveOpen && !chessOpen` (gleiche Bedingung wie Dock). Zwei Buttons: Watchliste, Lieblinge. Aktiv wie Dock-Thumb (`is-on` + SlidingThumb oder gleicher Pill) |
| S316-2 | Hand | `App.tsx` | Chip Watchliste → `handleWatchlist({ action:'open', focus:'watch' })` bzw. bestehendes `setWatchlistOpen` + Fokus. Chip Lieblinge → Fokus `favorite`. Dieselbe FSM wie Befehl. Zweiter Tap auf denselben Chip: Folie zu (wie Dock-Chat schließt) |
| S316-3 | Aktiv | `App.tsx` | Chip an, wenn `watchlistOpen` und Fokus passt. `dockId` bleibt Chat/Lage/… — Watchliste färbt **nicht** Mehr oder Kalender |
| S316-4 | Reach | `index.css` | Chips in der Daumen-Zone, nicht unter der Tastatur. `has-nav-dock` Padding um Chip-Höhe erweitern. Overlay/Settings/Kalender sitzen weiter über der Chrome, nicht darunter |
| S316-5 | Reduce | `prefersReducedMotion` | Kein Wischen-Zwang. Chip-Wechsel ohne Ken-Burns. Leave wie WatchlistOverlay |

## Won’t

- 6. `dockItems`-Eintrag. Drawer statt Dock. Drittes Chip (Gesehen).
- Neue Motion-Lib. Icons Pflicht — Text-Chips reichen.

## Abbruchkriterium

Sechstes Dock-Icon. Oder Chip öffnet Fahrmodus / Kalender. Oder die
Leiste verschwindet hinter der Tastatur.

## Manuell

Leiste: Chat Lage Hören Kalender Mehr. Darüber zwei Chips. Tap
Watchliste → Folie Watchliste. Tap Lieblinge → Tab Lieblinge. Drive
und Schach: Chips weg wie Dock.
