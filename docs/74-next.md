# 74 — Watchliste und Lieblinge **PLAN** (`18.3`)

Ausgangspunkt: Code `18.1.2`. Anlass: Filme merken, die man noch sehen
will, und Filme, die man mag — plus ein Overlay mit Slides, Poster und
zwei Rotten-Tomatoes-Zahlen (Kritiker und Publikum).

Die Leitentscheidung bleibt: **Parser wählen, ein Agent pro Zug, keine
erfundenen Noten.** Rotten Tomatoes hat **keine öffentliche API**. Die
Zahlen kommen wie seit Sprint 97 über OMDb (`tomatoes=true`). Die UI
sagt das.

**Kein Code in dieser Schiene, solange sie PLAN ist.** Sideload bleibt
`18.1.2`. Kein Doc verspricht eine APK `18.3.x`.

Sprints **272–281** sind **CODE** in `18.1.0`. **282** Freeze in
[`71-audit.md`](./71-audit.md). **283–287** bleiben Ideen halten in
[`72-next.md`](./72-next.md). **288–290** bleiben Karten-Reste in
[`73-next.md`](./73-next.md). Diese Schiene beginnt bei **291**.

---

## 0. Was der Wunsch will — und was wir davon nehmen

Zwei Listen, ein Overlay:

| Wunsch | Urteil | Wohin |
|--------|--------|-------|
| Film auf die Watchliste | **Ja** | 291 |
| Film auf die Lieblingsliste | **Ja** | 291 (derselbe Store) |
| Overlay öffnen, Slides, Poster | **Ja** | 292 |
| Kritiker- und Publikumswert | **Ja, über OMDb** | 293 |
| Offizielle Rotten-Tomatoes-API | **Won’t** | Partner-only; Sprint 97 |
| Film im Overlay abspielen | **Won’t** | TV bleibt `Spiel … Film` |
| Serien in v1 | **Won’t** | OMDb `type=movie` |
| RT-Splat / Certified-Fresh-Icon | **Won’t** | Marke, nicht unser Look |
| Framer, Lottie, neue Motion-Lib | **Won’t** | CSS + `useOverlay` + 30 fps |
| Erfundene Prozent | **Won’t** | leer ehrlich |

Watchliste = *noch sehen*. Lieblinge = *mag ich*. Derselbe Titel darf
auf beiden Listen stehen. Eine Liste entfernen lässt die andere.

---

## 1. Die Vorlage (hart, nicht verhandelbar)

Vier Sprints, Kern zuerst. Overlay und Noten sind eigene Sprints, weil
ohne Store nichts zu zeigen ist und ohne OMDb-Felder die Folien lügen.

```
# Watchliste — PLAN

Sprint 1 — Kern     Store + Parser, beide Listen, Hausstand
Sprint 2 — Overlay  Slides, Animation, Poster-Platz
Sprint 3 — Noten    OMDb Kritiker + Publikum + Poster-URL
Sprint 4 — Härten   Konflikte, reduced-motion, Tests, Probe
```

Jede Karte hat dieselben Felder wie ein Jarvis-Sprint (`n`, Ziel,
Lieferumfang, Won’t, Abbruch, Manuell).

---

## 2. Was schon existiert — wiederverwenden

| Baustein | Datei | Rolle in `18.3` |
|----------|-------|-----------------|
| Film-Lookup | `film.ts`, `film-parse.ts` | Nicht umbiegen. `Wie gut ist Dune` bleibt `film` |
| OMDb | `omdb.ts` | `tomatoes=true` schon an. **Kritiker** liegt in `tomatoes` (`tomatoMeter` / Ratings). **Publikum** `tomatoUserMeter` fehlt. **Poster** ungenutzt |
| TV | `tv-parse.ts` | `Spiel … Film` bleibt TV. Watchlist-Parser trifft danach oder gar nicht |
| Overlay-FSM | `overlay-fsm.ts` | Neue Id `watchlist`. Sheets wie Kalender, nicht Schach-Modus |
| Leave | `overlay.ts` `useOverlay`, `LEAVE_MS` 320 | Enter/Leave, `is-leaving` |
| Motion | `motion.ts` | 30 fps, Pause wenn versteckt, `prefersReducedMotion` gewinnt |
| Store | `store.ts` Notiz/Todo | IndexedDB-Store, Migration wie `notes` |
| Hausstand | `backup.ts` | `watch_movies` exportieren |
| Chat-Liste | `persistLastList` | Nummern „Watchliste 1 weg“ |

Katalog-Id `watchlist`, UI deutsch. Ein Agent, zwei Listen im Feld
`lists`. Kein zweiter Organizer, kein Memory-Write beim Hinzufügen.

---

## 3. Daten

```
WatchMovie {
  id: string
  title: string
  year?: string
  imdbId?: string
  lists: ('watch' | 'favorite')[]   // mindestens eins
  poster?: string | null            // OMDb Poster; null = kein Bild
  critic?: string | null            // tomatoMeter, z. B. "87%"
  audience?: string | null          // tomatoUserMeter
  scoresAt?: string | null          // ISO, letzter OMDb-Zug
  source_conversation_id?: string | null
  created_at: string
  updated_at: string
}
```

IndexedDB-Store `watch_movies`. Duplikat = gleicher `imdbId`, sonst
gleicher Titel+Jahr case-insensitive. Zweites Hinzufügen **merged**
`lists`, legt keine zweite Zeile an.

Hausstand-Feld `watch_movies`. Alte Backups ohne Feld bleiben gültig
(`arr(o.watch_movies)`).

Scores und Poster schreibt **293**, nicht 291. In 291 bleiben die Felder
`null`. Overlay 292 zeigt dann Platzhalter, keine erfundenen Zahlen.

---

## 4. Parser (deutsch)

Agent `watchlist`, `sideEffect: 'write'`, `autonomy: 'parser'`.

| Intent | Beispiele | `kind` / `list` |
|--------|-----------|-----------------|
| Auf Watchliste | `Watchliste: Dune`, `Dune auf die Watchliste`, `merk Dune zum Schauen` | `add` / `watch` |
| Auf Lieblinge | `Lieblingsfilm: Dune`, `Dune zu meinen Lieblingsfilmen`, `auf die Lieblingsliste Dune` | `add` / `favorite` |
| Liste | `Zeig meine Watchliste`, `meine Lieblingsfilme` | `list` / jeweilige Liste |
| Overlay | `Öffne Watchliste`, `Öffne Lieblingsfilme` | `show` / Fokus-Liste |
| Weg | `von der Watchliste Dune`, `Watchliste 1 weg`, `Lieblingsfilm Dune weg` | `remove` |

Kein Treffer (bleiben andere Agenten):

- `Spiel Dune Film` → TV
- `Wie gut ist Dune`, `IMDb Dune`, `Rotten Tomatoes Dune` → `film`
- `Notiz Dune`, `Todo Dune`, `Idee: Dune`
- `merk dir ich mag Dune` / `lern das` → Gedächtnis/Teach, **kein** Liebling
- `Was steht an` → Agenda, keine Filme

`Spiel …` und `film`/`serie` in einem Satz: Watchlist-Parser **nein**.

---

## 5. Overlay und Animation (292)

Eine Fläche oben, Overlay-Id `watchlist`. Fokus-Liste aus dem Satz
(Watchliste oder Lieblinge); Umschalter zwischen beiden.

**Slides:** horizontales `scroll-snap`, eine Karte pro Viewport, Nachbarn
leicht sichtbar. Wischen oder Tasten. Leere Liste: ein Satz, kein Fake-Poster.

**Animation (CSS, Budget 30 fps):**

| Moment | Bewegung | Reduced-motion |
|--------|----------|----------------|
| Öffnen | `translateY` + Opacity, 320 ms, gleiche Kurve wie Settings | sofort da |
| Schließen | `is-leaving` / `LEAVE_MS` | 1 ms unmount |
| Slide | scroll-snap, optional `scroll-behavior: smooth` | `auto` |
| Aktives Poster | sehr leichter Ken-Burns (`scale` 1 → 1.03, ~8 s, pausiert wenn versteckt) | aus |
| Listenwechsel | kurzer Crossfade | sofort |

Keine neue Bibliothek. Kein RT-Splat. Zahlen als Text. Poster nur aus
OMDb-URL oder neutrale Fläche.

292 darf das Overlay mit Titeln aus 291 zeigen. Poster/Noten kommen in
293 nach; bis dahin Platzhalter, nicht Stock-Fotos.

---

## 6. Noten (293)

Quelle **nur** `lookupOmdb` mit `tomatoes=true`. Erweiterung `OmdbHit`:

| Feld | OMDb | UI |
|------|------|-----|
| `tomatoes` (schon da) | `tomatoMeter` / Ratings „Rotten Tomatoes“ | **Kritiker** |
| `audience` **neu** | `tomatoUserMeter` | **Publikum** |
| `poster` **neu** | `Poster`, nicht `N/A` | Bild |

Kein Key, Netz weg, Feld `N/A` oder Titel unbekannt: **kein** Prozent,
kein geratenes Poster. Overlay-Zeile „—“. Chat wie Film-Agent: Hinweis
auf OMDb-Key, Satz „Rotten Tomatoes hat keine eigene öffentliche API“.

Nach erstem Treffer Felder auf `WatchMovie` legen (`scoresAt`). Overlay
liest den Store; Nachladen nur wenn `scoresAt` fehlt oder älter als ein
Tag — ein Request pro Film, nicht pro Slide-Frame.

Film-Chat (`Wie gut ist Dune`) darf Publikum mitnutzen, sobald das Feld
da ist. Satz: `Kritiker 87 %. Publikum 65 %. (Rotten Tomatoes über OMDb).`

---

## 7. Schnitt — Sprints 291–294

| Version | Sprint | Thema | Priorität |
|---------|--------|-------|-----------|
| `18.3.0` | [291](./sprints/sprint-291.md) | Kern: Store, Parser add/list/remove, beide Listen, Hausstand | Must |
| `18.3.1` | [292](./sprints/sprint-292.md) | Overlay, Slides, Animation | Must |
| `18.3.2` | [293](./sprints/sprint-293.md) | OMDb Kritiker + Publikum + Poster | Must |
| `18.3.3` | [294](./sprints/sprint-294.md) | Konflikte, reduced-motion, Tests, Probe | Must |

Kette: **291 → 292 → 293**. 294 braucht 291 (Parser) und 292 (Motion);
293 vor der Probe der Zahlen.

Pull nach **18.2** (283–287). Zahlen 288–290 nicht anfassen. 282 Freeze.

---

## 8. Gegen die PO-Prioritäten

| Sprint | Qualität | Funktion | Latenz | Free |
|--------|----------|----------|--------|------|
| 291 | Liste lügt nicht | Hinzufügen | Parser | lokal |
| 292 | Motion im Budget | Ansehen | 0 Tokens | lokal |
| 293 | ehrliche Noten | Poster + zwei Zahlen | **ein** OMDb je Film | OMDb-Free-Key |
| 294 | keine fremden Agenten | Härte | Parser | lokal |

291/292 ohne Kontingent. 293 nur OMDb, nicht Groq/Gemini.

---

## 9. Won’t (hart)

- Rotten-Tomatoes scrapen oder Partner-API.
- Erfundene Prozent, erfundene Poster, Stock-Bilder als Filmplakat.
- Film oder Trailer im Overlay abspielen.
- Serien, Staffeln, „weiterschauen“ in v1.
- RT-Splat, Certified-Fresh-Icon, Framer, Lottie, GSAP.
- Zweiter Katalog-Agent `favorites` / `movies`.
- Memory- oder Teach-Write beim Hinzufügen.
- `Spiel … Film` auf die Watchliste umbiegen.
- Sideload-Text `18.3.x`, solange `releases/Jarvis.apk` `18.1.2` ist.

---

## 10. Abbruchkriterien

- Ein Prozent steht da, das nicht aus OMDb kam.
- Die UI behauptet eine Rotten-Tomatoes-API.
- `Spiel Dune Film` landet in `watch_movies` oder startet kein TV.
- `merk dir ich mag Dune` wird ein Lieblingsfilm.
- „Notiz Milch“ oder eine Idee landet in `watch_movies`.
- Overlay ohne `prefersReducedMotion`-Pfad (Daueranimation trotz Reduce).
- Hausstand ohne `watch_movies`, nachdem 291 CODE ist.
- Sideload-Link nennt `18.3`, die APK ist es nicht.
- Eine zweite Motion-Bibliothek im Bundle.

Index: [`sprints/README.md`](./sprints/README.md) · Versionen:
[`09-versioning.md`](./09-versioning.md) · Vorher:
[`73-next.md`](./73-next.md) · Film-Noten:
[`sprints/sprint-97.md`](./sprints/sprint-97.md)
