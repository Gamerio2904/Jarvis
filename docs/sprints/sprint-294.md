# Sprint 294 — Watchliste härten

**Version:** `18.3.3` — **PLAN** Must
**Plan:** [`74-next.md`](../74-next.md)
**Voraussetzung:** Sprints **291–293**

## Ziel

Parser stiehlt keine fremden Agenten. Motion hält Reduce und 30 fps.
Probe ist drei Sätze, kein neues Produkt.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S294-1 | Konflikte | `conflicts.ts` + Parser-Reihenfolge | `Spiel … Film` / `parseTvWatch` vor Watchlist. `parseFilmIntent` vor Watchlist bei Rate/Where/About. `Zeig Notizen` / `Zeig Ideen` / `Was steht an` unberührt. `merk dir ich mag …` bleibt Teach/Memory |
| S294-2 | Katalog | `parse-catalog.ts` | Score so, dass TV/Film gewinnen wenn beide matchen würden. Watchlist nur bei Listen-Wörtern (`watchliste`, `lieblingsfilm`, `zum schauen`, `lieblingsliste`) |
| S294-3 | Reduce + Hidden | Overlay | `@media (prefers-reduced-motion: reduce)` killt Ken-Burns und Smooth-Scroll. `visibilitychange` pausiert Animation. Kein `rAF` über `MOTION_FPS` |
| S294-4 | Tests | `test-watchlist.mjs`, `test-copy.ts` optional | Fälle aus [`74-next.md`](../74-next.md) §4 und §10. `Spiel Dune Film` expect TV. `Watchliste: Dune` expect `watchlist`. `Lieblingsfilm: Dune` expect `watchlist` + `favorite` |
| S294-5 | PO-Gerät | nur wenn CODE gezogen | Kein `TEST-18.3.x.md` anlegen, solange Sideload `18.1.2` ist. Gerät-PO schreibt die Testdatei beim Execute, Header = echte APK |

## Won’t

- Serien, Trailer, Streaming-Start aus der Folie.
- RT-Scrape „weil OMDb Lücken hat“.
- Sideload-Version in Docs auf `18.3` setzen ohne `releases/Jarvis.apk`.
- Freeze 282 anfassen. Ideen-Schiene 283–287 anfassen.

## Abbruchkriterium

`Spiel Dune Film` öffnet die Watchliste. Oder Reduce-Motion lässt das
Poster weiter zoomen. Oder ein Doc behauptet Sideload `18.3` bei APK
`18.1.2`.

## Manuell

```
Spiel Dune Film
Watchliste: Dune
Lieblingsfilm: Dune
Öffne Lieblingsfilme
von der Watchliste Dune
```

TV bleibt TV. Eine Folie Dune unter Lieblinge, Watchliste leer (oder
ohne Dune). Reduced-motion: Overlay steht sofort, keine Loop-Animation.
