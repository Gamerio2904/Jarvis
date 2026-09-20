# Sprint 316 — 6. Dock-Icon Filme

**Version:** `18.7.1` — **PLAN** Must
**Plan:** [`78-next.md`](../78-next.md)
**Voraussetzung:** Sprint **315**. PO: sechs Slots, nicht Chips.

## Ziel

Watchliste und Lieblinge liegen **sichtbar unten** als ein Dock-Ziel
**Filme**. Ein Overlay, Tab = Fokus. Kein Chip-Streifen.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S316-1 | Item | `App.tsx` `NavIsland.tsx` | `dockItems` um `{ id:'watchlist', label:'Filme', icon:<IconFilm /> }` **vor** Mehr. Mehr bleibt letzter Slot. `IconFilm` gleicher Strich (24er viewBox, stroke 1.8) |
| S316-2 | Hand | `App.tsx` `goDock` | `watchlist`: Overlay auf, Fokus `watch` wenn neu, sonst letzter Tab. Zweiter Tap auf Filme bei offener Folie → `close`. Drive/Schach: Dock weg wie heute |
| S316-3 | Aktiv | `App.tsx` | `dockId === 'watchlist'` wenn `watchlistOpen`. Thumb folgt `data-nav="watchlist"`. Färbt nicht Mehr oder Kalender |
| S316-4 | Enge | `index.css` | Sechs Labels: Schrift auf ~`0.55rem` oder zwei Zeilen, kein Umbruch aus der Insel. Thumb-Spring unverändert (`useSlidingThumb`) |
| S316-5 | Reduce | `prefersReducedMotion` | Thumb ohne Spring. Overlay-Leave wie WatchlistOverlay |

## Won’t

- Chips über dem Dock. 7. Icon (Gesehen / Lieblinge extra).
- Drawer statt Dock. Neue Motion-Lib.

## Abbruchkriterium

Fünf Slots bleiben. Oder Filme öffnet Fahrmodus / Kalender. Oder Labels
laufen aus der Insel.

## Manuell

Leiste: Chat Lage Hören Kalender Filme Mehr. Tap Filme → Folie
Watchliste. Drive und Schach: Dock weg.
