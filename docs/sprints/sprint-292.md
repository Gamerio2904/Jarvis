# Sprint 292 — Overlay für Watchliste und Lieblinge

**Version:** `18.3.1` — **PLAN** Must
**Plan:** [`74-next.md`](../74-next.md)
**Voraussetzung:** Sprint **291**

## Ziel

Beide Listen sind Folien, nicht nur Chat-Text. `Öffne Lieblingsfilme`
liefert dieselbe Motion und dasselbe Slide-Layout wie die Watchliste,
nur mit Fokus `favorite`. Poster und Noten dürfen noch Platzhalter sein.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S292-1 | Overlay-Id | `overlay-fsm.ts` | `OverlayId` um `'watchlist'` erweitern. `overlayHidesDrive` wie Kalender/Settings. Back/Fertig schließt oben |
| S292-2 | Öffnen | `watchlist-parse.ts` + `App.tsx` | `öffne(?:\s+die)? watchliste` → Fokus `watch`, Chat `Watchliste.` `öffne(?:\s+die)? (?:lieblings(?:filme\|liste)\|lieblinge)` → Fokus `favorite`, Chat `Lieblinge.` Nach Execute Overlay auf. `zeig … watchliste` darf in 292 das Overlay mitöffnen (wie Kalender), `zeig … lieblingsfilme` ebenso |
| S292-3 | UI | `ui/WatchlistOverlay.tsx` **neu** | Eine Komponente. Überschrift = Fokus-Liste. Umschalter **Watchliste** / **Lieblinge**. Dieselbe Karte für beide: `scroll-snap-type: x mandatory`, Titel (+ Jahr). Leer Watch: `Noch nichts auf der Watchliste.` Leer Lieblinge: `Noch keine Lieblingsfilme.` Kein Fake-Plakat. Folien filtern nach `lists` |
| S292-4 | Motion | `index.css` + `overlay.ts` | Enter wie Settings (`translateY` + Opacity, 320 ms). Leave `useOverlay` / `is-leaving`. Aktives Poster: `scale` 1→1.03 in ~8 s, `animation-play-state` paused bei `document.hidden`. Nachbarn ~12 % sichtbar. Keine neue Lib |
| S292-5 | Reduced | `prefersReducedMotion` | Öffnen sofort, Ken-Burns aus, Scroll `auto`, Leave 1 ms. Testbar über Match-Media |
| S292-6 | Schließen | wie Kalender | Zurück, Fertig, Overlay-FSM `close`. 290 (Overlay vs. Gespräch) nicht umgehen: Zurück schließt nur die Fläche, startet kein neues Thema |

## Won’t

- OMDb-Call in der Render-Schleife (das ist 293).
- Film abspielen, Trailer, YouTube-Embed.
- Framer Motion, Lottie, GSAP, `requestAnimationFrame`-Loop über 30 fps.
- RT-Splat-Grafik.
- Zweites Overlay, zweites Layout oder Chat-only für Lieblinge.

## Abbruchkriterium

Overlay ohne Leave-Animation **und** ohne Reduce-Pfad. Oder
`Öffne Lieblingsfilme` zeigt Watchliste-only-Titel bzw. die Überschrift
Watchliste. Oder Öffnen legt einen Film an, der nicht im Store lag.

## Manuell

```
Watchliste: Heat
Lieblingsfilm: Arrival
Öffne Watchliste
Öffne Lieblingsfilme
```

Zwei Öffnungen, dieselbe Animation. Erst Folie Heat (Überschrift
Watchliste), dann Folie Arrival (Überschrift Lieblinge). Wischen bei
einem Eintrag ist harmlos. Reduce-Motion: keine Ken-Burns-Schleife.
Fertig schließt.
