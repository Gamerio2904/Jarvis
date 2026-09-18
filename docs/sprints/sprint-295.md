# Sprint 295 — Gesehen intern (Wissenszentrum)

**Version:** `18.3.4` — **PLAN** Must
**Plan:** [`74-next.md`](../74-next.md)
**Voraussetzung:** Sprint **291**. Overlay 292 ist keine Voraussetzung.

## Ziel

Wer einen Watchliste-Film geschaut hat, ist er intern gesehen. Alle
Agenten finden das im Wissenszentrum. Kein drittes Overlay.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S295-1 | Store | `store.ts` | `WatchedMovie` wie [`74-next.md`](../74-next.md) §3. IndexedDB `watched_movies`. `listWatchedMovies`, `addWatchedMovie`. Duplikat über `movieKey` |
| S295-2 | Parser | `film-taste-parse.ts` | `kind:'seen'` ist CODE. `Ich habe Dune geschaut`, `Dune habe ich gesehen`, `Watchliste 1 gesehen`. `Spiel Dune Film` / `Wie gut ist Dune` / `Watchliste: Dune` bleiben fremd |
| S295-3 | Execute | `watchlist.ts` | Nur Treffer **auf der Watchliste** (Titel oder Last-List-Nummer `watch-watch`). `watch` aus `lists` nehmen, Favorite behalten. Zeile nach `watched_movies`. Reply: `Dune liegt bei Gesehen, weg von der Watchliste.` Nicht auf der Liste: `Der steht nicht auf der Watchliste.` |
| S295-4 | Pack | `knowledge-store.ts` via `buildWatchedPack` | Nach jedem Write Pack `filme-gesehen`, Titel **Gesehene Filme**, `origin:'user'`. Claims die neuesten 24. Summary mit Anzahl. `retrievePacks` / `knowledgeBlock` / Körper-Baum sehen es. Kein Overlay |
| S295-5 | Hausstand | `backup.ts` | `watched_movies` export/import, Zähler **Gesehen**. Alte Backups ohne Feld gültig |
| S295-6 | Test | `test-film-taste.mjs` + Watchlist-Test | `applyWatched` ohne Watchliste → missing. Mit Watchliste → seen. Pack-Topic `filme-gesehen` |

## Won’t

- Overlay, Folien, „Zeig meine gesehenen Filme“.
- Gesehen aus Memory/Teach (`merk dir ich mag Dune`).
- Filme sehen, die nie auf der Watchliste standen.
- Sideload `18.3.4`.

## Abbruchkriterium

Gesehen ohne Watchliste-Treffer. Oder Pack `filme-gesehen` fehlt nach
einem gültigen „geschaut“.

## Manuell

```
Watchliste: Dune
Ich habe Dune geschaut
Zeig meine Watchliste
```

Watchliste ohne Dune. Fachwissen / Körper: Pack Gesehene Filme enthält
Dune. Keine neue Fläche.
