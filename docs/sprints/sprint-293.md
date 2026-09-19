# Sprint 293 — Poster und Rotten-Tomatoes-Noten (OMDb)

**Version:** `18.3.2` — **CODE** Must
**Plan:** [`74-next.md`](../74-next.md)
**Voraussetzung:** Sprints **291** und **292**

## Ziel

Jede Folie — Watchliste **und** Lieblinge — zeigt Plakat, **Kritiker**
und **Publikum**, wenn OMDb sie liefert. Dieselbe Karte, dieselben Felder.
Die Quelle heißt OMDb, nicht „Rotten-Tomatoes-API“. Leere Felder bleiben
leer.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S293-1 | Hit erweitern | `omdb.ts` | `OmdbHit.audience?`, `OmdbHit.poster?`, `OmdbHit.genre?`. `fromOmdb`: `tomatoUserMeter` → `audience` (nicht `N/A`). `Poster` → `poster` wenn URL und nicht `N/A`. `Genre` → Rohstring, Keys über `genresFromOmdb`. `tomatoes` bleibt Kritiker |
| S293-2 | Nachladen | `watchlist.ts` | Nach `add` oder vor Overlay-Show: `lookupOmdb(title, year)` **einmal**. Treffer auf `WatchMovie` schreiben (`critic` = `hit.tomatoes`, `audience`, `poster`, `imdbId`, `year`, `genres` = `genresFromOmdb`, `scoresAt`). Ohne Key / ohne Treffer: Felder `null`, Reply/Overlay ohne Zahl |
| S293-3 | Cache | `watchlist.ts` | Kein zweiter Request, wenn `scoresAt` jünger als 24 h. Overlay liest den Store, nicht OMDb pro Frame |
| S293-4 | Folie | `WatchlistOverlay.tsx` | Dieselbe Karte in beiden Kollektionen. Poster `<img>` nur bei `poster`. Sonst neutrale Fläche, Titel lesbar. Zwei Zeilen: `Kritiker {critic}` · `Publikum {audience}`. Fehlend: `—`. Quelle: `Rotten Tomatoes über OMDb`. Lieblings-Folie darf keine der Zeilen weglassen |
| S293-5 | Film-Chat | `film.ts` `scoreLine` | Wenn `audience` da: `Kritiker … Publikum … (Rotten Tomatoes über OMDb).` Ohne Audience wie bisher. Ohne Key: `omdbKeyHint()` unverändert (RT hat keine öffentliche API) |
| S293-6 | Test | `test-watchlist.mjs` + OMDb-Fixture | Fixture mit `tomatoMeter`/`tomatoUserMeter`/`Poster` füllt beide Zahlen und URL. Fixture `N/A` / fehlendes Feld → keine Zahl. Kein Lookup ohne Key erfindet Prozent |

## Won’t

- `www.rottentomatoes.com` scrapen.
- Partner-Key, RapidAPI-RT, inoffizielle RT-Wrapper.
- Prozent aus IMDb-User-Rating als Publikum ausgeben.
- Splat-Icon, Certified Fresh.
- Poster-Download in IndexedDB als Blob (URL reicht; kaputte URL = Fläche).

## Abbruchkriterium

Eine Zahl auf der Folie, die nicht aus OMDb-JSON stammt. Oder die UI
nennt eine Rotten-Tomatoes-API.

## Manuell

OMDb-Key setzen.

```
Watchliste: Dune
Lieblingsfilm: Arrival
Öffne Watchliste
Öffne Lieblingsfilme
```

Beide Folien mit Plakat, zwei Prozent oder ehrlichem `—`. Key löschen,
neuen Lieblingstitel hinzufügen: Hinweis auf Einstellungen, **keine** 87 %.

`Wie gut ist Dune` im Chat nennt Kritiker und Publikum, sobald OMDb
beides liefert, plus „über OMDb“.
