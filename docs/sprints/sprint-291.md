# Sprint 291 — Watchliste und Lieblinge festhalten

**Version:** `18.3.0` — **CODE** Must
**Plan:** [`74-next.md`](../74-next.md)
**Voraussetzung:** keine. Ideen 283–287 und Karten 288–290 bleiben liegen.

## Ziel

Wer einen Film zum Schauen oder als Liebling nennt, hat ihn hinterher.
Zwei Listen, ein Store. Jarvis erfindet keine Titel. Overlay und Noten
kommen in 292/293.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S291-1 | Typ + Store | `store.ts` | `WatchMovie` wie [`74-next.md`](../74-next.md) §3. `lists: ('watch'\|'favorite')[]`. `genres?` leer bis 293. `listWatchMovies(list?)`, `addWatchMovie(title, list)`, `removeWatchMovie`. IndexedDB `watch_movies`, Migration wie `notes`. Merge bei gleichem `imdbId` oder Titel+Jahr |
| S291-2 | Parser | `engine/watchlist-parse.ts` **neu** | Add Watch: `watchliste[:\s](.+)`, `(.+)\s+auf (?:die )?watchliste`, `merk(?:e)?(?:\s+dir)?(?:\s+den film)?\s+(.+)\s+zum schauen`. Add Liebling: `lieblingsfilm(?:e)?[:\s](.+)`, `lieblingsliste[:\s](.+)`, `(.+)\s+zu meinen lieblingsfilmen`, `auf (?:die )?lieblingsliste\s+(.+)`. List/Show/Remove **vollständig** wie [`74-next.md`](../74-next.md) §4 inkl. `Öffne Lieblinge`, `von der Lieblingsliste`, `Lieblingsliste 1 weg`. Titel `cleanTitle` wie Film, 2–80 Zeichen |
| S291-3 | Abgrenzung | `watchlist-parse.ts` + Tests | `Spiel Dune Film`, `Wie gut ist Dune`, `IMDb Dune`, `Notiz Dune`, `Todo Dune`, `Idee: Dune`, `merk dir ich mag Dune` → **kein** Treffer |
| S291-4 | Agent | `parse-catalog.ts` | Ein Eintrag `watchlist`, `sideEffect: 'write'`, `autonomy: 'parser'`. Deutsch in der Karte: **Watchliste / Lieblinge**. Kein zweites `favorites` |
| S291-5 | Execute | `engine/watchlist.ts` **neu** | `add`: `Liegt auf der Watchliste: {title}.` bzw. `Liegt bei den Lieblingen: {title}.` Schon da auf **dieser** Liste: `War schon auf der Watchliste.` / `War schon bei den Lieblingen.` Merge ergänzt `lists`. `list`: nur die gefragte Liste, nummeriert. `persistLastList('watch-watch')` bzw. `'watch-favorite'`. Leer: `Keine Filme auf der Watchliste.` / `Keine Lieblingsfilme.` `show` in 291 nur Chat-Liste; Overlay ist 292 |
| S291-6 | Hausstand | `backup.ts` | `watch_movies` exportieren und importieren. Zähler **Watchliste** und **Lieblinge** getrennt (Film auf beiden zählt zweimal in der Summe der Zähler, einmal im Array). Alte Backups ohne Feld gültig (`arr(o.watch_movies)`) |
| S291-7 | Test | `test-watchlist.mjs` **neu** | Add Watch und Add Favorite treffen. TV/Film/Notiz/Memory treffen nicht. Merge: derselbe Titel auf beide Listen = eine Zeile, `lists` beide Werte. Remove einer Liste lässt die andere |

## Won’t

- Overlay, Poster, OMDb in diesem Sprint.
- Serien.
- Memory-Write, Teach, Todo aus einem Film.
- Zweite Datenbank.
- Sideload `18.3.0`.

## Abbruchkriterium

Ein Film ohne Parser-Treffer in `watch_movies`. Oder `Spiel Dune Film`
bzw. `Notiz Milch` landet dort.

## Manuell

```
Watchliste: Dune
Lieblingsliste: Arrival
Zeig meine Watchliste
Zeig meine Lieblingsfilme
Lieblingsliste 1 weg
```

Zwei verschiedene Listen. Nach Weg ist Arrival weg, Dune bleibt.
`Spiel Dune Film` startet weiter den Fernseher. Hausstand zeigt beide
Zähler. Overlay darf in diesem Sprint noch fehlen.
