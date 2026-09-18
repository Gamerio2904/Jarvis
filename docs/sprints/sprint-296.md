# Sprint 296 — Filmtipp aus Lieblingen

**Version:** `18.3.5` — **PLAN** Must
**Plan:** [`74-next.md`](../74-next.md)
**Voraussetzung:** Sprints **291** und **295**. **293** Should (Genre).

## Ziel

`Nenn mir Horrorfilme für Filmabend` liefert Watchliste-Titel, die zum
Profil passen. Lieblinge zählen **dreimal** so schwer wie Gesehenes.
Keine erfundenen Namen.

Der Algorithmus ist CODE in `film-taste.ts` (`npm run test:film-taste`).
Dieser Sprint verdrahtet Parser → Katalog → Reply.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S296-1 | Katalog | `parse-catalog.ts`, `meta.ts`, `execute-map.ts` | Agent `watchlist` darf `parseTasteIntent` (seen+recommend) **oder** derselbe Agent wie 291, Extra-Score nur bei Tipp-/Gesehen-Wörtern. Kein neues `favorites`. Deutsch: **Watchliste / Tipp** |
| S296-2 | Execute Tipp | `watchlist.ts` | Kandidaten = `listWatchMovies('watch')`. Favoriten = `lists` inkl. `favorite`. Gesehen = `listWatchedMovies`. `recommend({ ask, favorites, watched, candidates })`. Reply `formatRecommendReply`. Leer: den `emptyReason`, keine Modell-Nachschub-Titel |
| S296-3 | Genre | nach 293 | `WatchMovie.genres` aus `genresFromOmdb(hit.genre)`. Ohne Genre: Filter Horror lässt den Titel fallen (fail-closed) |
| S296-4 | Konflikte | `conflicts.ts` | `Spiel … Film` TV. `Wie gut ist …` film. `Nenn mir Horrorfilme` nicht film-about. `Was steht an` keine Filme |
| S296-5 | Test | `test-film-taste.mjs` | Liebling Sci-Fi Gewicht 3, Gesehen Horror Gewicht 1. Gesehenes nicht in den Picks. Horror-Filmabend mit Alien auf der Watchliste trifft Alien, nicht Heat |

## Won’t

- LLM oder Research als Titellieferant in v1.
- JustWatch-Popular als zweite Kandidatenliste in v1.
- Tipp spielt den Film am Fernseher.
- Overlay nur für Tipps.
- Sideload `18.3.5`.

## Abbruchkriterium

Ein Titel in der Reply, der nicht in `candidates` stand. Oder
`FAV_WEIGHT <= SEEN_WEIGHT`.

## Manuell

```
Lieblingsfilm: Dune
Watchliste: Alien
Watchliste: Heat
Nenn mir Horrorfilme für Filmabend
```

Reply nennt Alien (Horror, Watchliste, Lieblinge sind Sci-Fi — Alien hat
beides), nicht Heat, nicht einen erfundenen dritten Horror. Danach
`Ich habe Alien geschaut` — nächster Horror-Tipp ohne Alien.
