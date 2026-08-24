import { useEffect, useState } from 'react'
import {
  bestTotal,
  getKaufState,
  setKaufState,
  subscribeKauf,
  visibleProducts,
  type KaufProduct,
} from './engine/kauf-session'
import { listenOnce, requestMicPermission, stopListen } from './native/voice'

export function KaufOverlay({ onClose, onCommand }: { onClose: () => void; onCommand: (text: string) => void }) {
  const [, bump] = useState(0)
  const [hearing, setHearing] = useState(false)
  useEffect(() => subscribeKauf(() => bump((n) => n + 1)), [])
  const s = getKaufState()
  const list = visibleProducts()
  const selected = list[s.selected] || list[0]
  const quotes = selected?.quotes || []
  const cheapest = selected ? bestTotal(selected) : null

  function hear() {
    if (hearing) return
    setHearing(true)
    void (async () => {
      try {
        await stopListen()
        const ok = await requestMicPermission()
        if (!ok) return
        const res = await listenOnce()
        const text = (res.text || '').trim()
        if (text) onCommand(text)
      } finally {
        setHearing(false)
      }
    })()
  }

  return (
    <div className="kauf-mode" role="dialog" aria-label="Kaufmodus">
      <div className="kauf-sheet">
        <header className="kauf-head">
          <div>
            <h2>Kaufmodus</h2>
            <p>{s.query || 'Suche in natürlicher Sprache. Keine Einkaufsliste.'}</p>
          </div>
          <div className="kauf-head-actions">
            <button type="button" className={`kauf-mic${hearing ? ' is-hot' : ''}`} onClick={hear} disabled={hearing}>
              {hearing ? 'Höre…' : 'Mic'}
            </button>
            <button type="button" className="ghost-btn" onClick={onClose}>
              Schließen
            </button>
          </div>
        </header>
        <div className="kauf-search">
          <input
            className="kauf-q"
            defaultValue={s.query}
            placeholder="Such mir einen Fernseher unter 400 €"
            onKeyDown={(e) => {
              if (e.key === 'Enter') onCommand(`Such mir ${(e.target as HTMLInputElement).value}`)
            }}
          />
        </div>
        <div className="kauf-chips">
          {chip('Alle', () => onCommand('Alle'), s.filter === 'all')}
          {chip('Angebote', () => onCommand('Nur Angebote'), s.filter === 'offers')}
          {chip('Lokal', () => onCommand('Nur lokale Geschäfte'), s.filter === 'local')}
          {chip('Prospekte', () => onCommand('Nur Prospekte'), s.filter === 'prospects')}
          {s.maxEuro != null ? chip(`Unter ${s.maxEuro} €`, () => onCommand('Alle'), true) : null}
        </div>
        <div className="kauf-split">
          <section className="kauf-hero">
            <div className="kauf-visual" aria-hidden>
              {selected?.image ? <img src={selected.image} alt="" /> : <span>{selected ? selected.title.slice(0, 1) : '?'}</span>}
            </div>
            <h3>{selected?.title || 'Noch kein Treffer'}</h3>
            <p className="kauf-honest">{s.honest || 'Preise nur mit Quelle. Versand unbekannt, wenn er nicht in der Quelle steht.'}</p>
            {selected ? (
              <div className="kauf-hero-actions">
                <button type="button" className="retry-btn" onClick={() => onCommand(`Merke mir Nummer ${(list.indexOf(selected) || 0) + 1}`)}>
                  Merken
                </button>
                <button type="button" className="retry-btn" onClick={() => onCommand(list.length > 1 ? 'Vergleiche Nummer 1 und 2' : 'Was würdest du nehmen?')}>
                  Vergleichen
                </button>
                <button type="button" className="retry-btn" onClick={() => onCommand(`Pack Nummer ${(list.indexOf(selected) || 0) + 1} auf die Einkaufsliste`)}>
                  Auf die Liste
                </button>
              </div>
            ) : null}
          </section>
          <section className="kauf-deals">
            <h3>Händler</h3>
            {!quotes.length ? <p className="kauf-empty">Keine belegten Angebote.</p> : null}
            {quotes
              .slice()
              .sort((a, b) => (a.total ?? a.price ?? 9e9) - (b.total ?? b.price ?? 9e9))
              .map((q, i) => {
                const total = q.total ?? q.price
                const best = cheapest != null && total === cheapest
                return (
                  <article key={`${q.url}-${i}`} className={`kauf-card${best ? ' is-best' : ''}`}>
                    <header>
                      <strong>{q.merchant}</strong>
                      {best ? <span className="kauf-badge">Günstigster Gesamtpreis</span> : null}
                    </header>
                    <p>
                      {q.price != null ? `${euro(q.price)} Produkt` : 'Preis unbekannt'}
                      {' · '}
                      {q.shipping != null ? `${euro(q.shipping)} Versand` : 'Versand unbekannt'}
                    </p>
                    <p className="kauf-total">{total != null ? euro(total) : 'Gesamt unbekannt'}</p>
                    <p className="kauf-meta">
                      {q.eta || 'Lieferzeit unbekannt'} · {q.available || 'Verfügbarkeit unbekannt'} · {q.rating || 'ohne Bewertung'}
                    </p>
                    <p className="kauf-src">
                      {q.source} · {ago(q.fetchedAt)}
                    </p>
                    <a className="retry-btn" href={q.url} target="_blank" rel="noreferrer">
                      Zum Händler
                    </a>
                  </article>
                )
              })}
            {list.length > 1 ? (
              <ul className="kauf-alts">
                {list.map((p, i) => (
                  <li key={`${p.title}-${i}`}>
                    <button
                      type="button"
                      className={p === selected ? 'is-on' : ''}
                      onClick={() => setKaufState({ selected: i })}
                    >
                      {i + 1}. {p.title}
                      {priceOf(p)}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  )
}

function chip(label: string, onClick: () => void, on: boolean) {
  return (
    <button type="button" className={`kauf-chip${on ? ' on' : ''}`} onClick={onClick}>
      {label}
    </button>
  )
}

function euro(n: number): string {
  return `${n.toFixed(2).replace('.', ',')} €`
}

function priceOf(p: KaufProduct): string {
  const t = bestTotal(p)
  return t != null ? ` · ${euro(t)}` : ''
}

function ago(iso: string): string {
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return 'ohne Zeit'
  const min = Math.max(0, Math.round((Date.now() - t) / 60000))
  return min < 1 ? 'gerade' : `vor ${min} min`
}
