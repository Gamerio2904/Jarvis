# Sprint 292 — Watchliste-Overlay

**Version:** `18.3.1` — **PLAN** Must
**Plan:** [`74-next.md`](../74-next.md)
**Voraussetzung:** Sprint **291**

## Ziel

Die Listen sind Folien, nicht nur Chat-Text. Öffnen mit hoher, aber
bestehender Motion: CSS, 320 ms, 30 fps. Poster und Noten dürfen noch
Platzhalter sein.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S292-1 | Overlay-Id | `overlay-fsm.ts` | `OverlayId` um `'watchlist'` erweitern. `overlayHidesDrive` wie Kalender/Settings. Back/Fertig schließt oben |
| S292-2 | Öffnen | `watchlist-parse.ts` + `App.tsx` | `öffne(?:\s+die)? watchliste`, `zeig(?:e)?(?:\s+mir)?(?:\s+meine)? watchliste` und Analogon Lieblinge → `kind:'show'`. Nach Execute Overlay auf, Fokus-Liste aus dem Satz. Chat bestätigt kurz: `Watchliste.` |
| S292-3 | UI | `ui/WatchlistOverlay.tsx` **neu** | Dialog. Umschalter **Watchliste** / **Lieblinge**. Horizontal `scroll-snap-type: x mandatory`, eine Karte = Titel (+ Jahr wenn da). Leer: `Noch nichts auf der Watchliste.` Kein Fake-Plakat |
| S292-4 | Motion | `index.css` + `overlay.ts` | Enter wie Settings (`translateY` + Opacity, 320 ms). Leave `useOverlay` / `is-leaving`. Aktives Poster: `scale` 1→1.03 in ~8 s, `animation-play-state` paused bei `document.hidden`. Nachbarn ~12 % sichtbar. Keine neue Lib |
| S292-5 | Reduced | `prefersReducedMotion` | Öffnen sofort, Ken-Burns aus, Scroll `auto`, Leave 1 ms. Testbar über Match-Media |
| S292-6 | Schließen | wie Kalender | Zurück, Fertig, Overlay-FSM `close`. 290 (Overlay vs. Gespräch) nicht umgehen: Zurück schließt nur die Fläche, startet kein neues Thema |

## Won’t

- OMDb-Call in der Render-Schleife (das ist 293).
- Film abspielen, Trailer, YouTube-Embed.
- Framer Motion, Lottie, GSAP, `requestAnimationFrame`-Loop über 30 fps.
- RT-Splat-Grafik.
- Eigenes Overlay nur für Lieblinge (ein Overlay, zwei Kollektionen).

## Abbruchkriterium

Overlay ohne Leave-Animation **und** ohne Reduce-Pfad. Oder Öffnen legt
einen Film an, der nicht im Store lag.

## Manuell

```
Watchliste: Heat
Öffne Watchliste
```

Fläche kommt von unten/oben wie Settings, eine Folie „Heat“. Wischen
tut nichts Schädliches bei einem Eintrag. Reduce-Motion in den
Systemeinstellungen: keine Ken-Burns-Schleife. Fertig schließt.
