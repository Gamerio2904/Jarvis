import { useEffect, useState } from 'react'
import { isDocumentHidden, onVisibility, prefersReducedMotion } from '../engine/motion.ts'
import { type WatchListKind, type WatchMovie } from '../engine/store.ts'
import { enrichWatchlist } from '../engine/watchlist.ts'
import { watchScoreParts } from '../engine/omdb.ts'
import { useSlidingThumb } from './SlidingThumb.tsx'

export function WatchlistOverlay({
  onClose,
  leaving = false,
  focus,
  onFocus,
}: {
  onClose: () => void
  leaving?: boolean
  focus: WatchListKind
  onFocus: (list: WatchListKind) => void
}) {
  const [rows, setRows] = useState<WatchMovie[]>([])
  const [hidden, setHidden] = useState(() => isDocumentHidden())
  const reduced = prefersReducedMotion()
  const tabThumb = useSlidingThumb(focus)

  useEffect(() => {
    let live = true
    void enrichWatchlist(focus).then((next) => {
      if (live) setRows(next)
    })
    return () => {
      live = false
    }
  }, [focus])

  useEffect(() => {
    return onVisibility(() => setHidden(isDocumentHidden()))
  }, [])

  const title = focus === 'watch' ? 'Watchliste' : 'Lieblinge'
  const empty = focus === 'watch' ? 'Noch nichts auf der Watchliste.' : 'Noch keine Lieblingsfilme.'

  return (
    <div className={`watch-overlay fx-in${leaving ? ' is-leaving' : ''}`}>
      <header className="watch-head">
        <div>
          <h2>{title}</h2>
          <p>Wischen = Folie · Fertig schließt</p>
        </div>
        <div className="watch-head-actions">
          <button type="button" className="ghost-btn cal-toolbar-btn" onClick={onClose}>
            Fertig
          </button>
        </div>
      </header>
      <div ref={tabThumb.hostRef} className="watch-tabs pill-tabs" role="tablist">
        <span ref={tabThumb.thumbRef} className="pill-tabs-thumb" aria-hidden />
        <button
          type="button"
          role="tab"
          data-nav="watch"
          aria-selected={focus === 'watch'}
          className={`watch-tab${focus === 'watch' ? ' is-on' : ''}`}
          onClick={() => onFocus('watch')}
        >
          Watchliste
        </button>
        <button
          type="button"
          role="tab"
          data-nav="favorite"
          aria-selected={focus === 'favorite'}
          className={`watch-tab${focus === 'favorite' ? ' is-on' : ''}`}
          onClick={() => onFocus('favorite')}
        >
          Lieblinge
        </button>
      </div>
      {rows.length ? (
        <div className="watch-track">
          {rows.map((m) => (
            <article key={m.id} className="watch-card">
              <div className="watch-poster-wrap">
                {m.poster ? (
                  <img
                    className={`watch-poster${hidden || reduced ? ' is-paused' : ''}`}
                    src={m.poster}
                    alt=""
                  />
                ) : (
                  <div className="watch-poster-empty" aria-hidden />
                )}
              </div>
              <h3>
                {m.title}
                {m.year ? ` (${m.year})` : ''}
              </h3>
              {(() => {
                const { critic, audience, imdb, source } = watchScoreParts(m)
                return (
                  <>
                    <p className="watch-scores">
                      <span className="watch-score">Kritiker {critic}</span>
                      <span className="watch-score">Publikum {audience}</span>
                      {imdb ? <span className="watch-score is-imdb">IMDb {imdb}</span> : null}
                    </p>
                    <p className="watch-source">{source}</p>
                  </>
                )
              })()}
            </article>
          ))}
        </div>
      ) : (
        <p className="watch-empty">{empty}</p>
      )}
    </div>
  )
}
