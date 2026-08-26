import { useEffect, useState, type ReactNode } from 'react'
import {
  fetchHudSnap,
  HUD_CATALOG,
  hudSpotifyToggle,
  loadHudModules,
  type HudSnap,
} from './engine/hud'
import { ChessBoard } from './ChessBoard'
import { loadSettings } from './engine/store'

export function Lage({
  onSend,
  draft,
  setDraft,
  busy,
}: {
  onSend: (text: string) => void
  draft: string
  setDraft: (v: string) => void
  busy: boolean
}) {
  const [snap, setSnap] = useState<HudSnap>({})
  const modules = loadHudModules()

  useEffect(() => {
    let live = true
    async function tick() {
      const next = await fetchHudSnap()
      if (live) setSnap(next)
    }
    void tick()
    const id = window.setInterval(() => void tick(), 20_000)
    return () => {
      live = false
      window.clearInterval(id)
    }
  }, [modules.join(',')])

  const clock = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  const bat = snap.device?.battery
  const amber = loadSettings().hud_accent === 'amber'

  return (
    <section className={`lage ${amber ? 'is-amber' : ''}`} aria-label="Lage">
      <header className="lage-head">
        <span className="lage-brand">JARVIS</span>
        <span className="lage-sep">&gt;</span>
        <span>Lage</span>
        <span className="lage-spacer" />
        <span>{clock}</span>
        {typeof bat === 'number' ? <span className="lage-bat">{bat} %</span> : null}
      </header>
      <div className="lage-grid">
        {modules.map((id, i) => {
          const cell = (node: ReactNode) => (
            <div key={id} className="lage-cell" style={{ ['--i' as string]: i }}>
              {node}
            </div>
          )
          if (id === 'weather') return cell(<WeatherTile data={snap.weather} />)
          if (id === 'spotify') return cell(<SpotifyTile data={snap.spotify} />)
          if (id === 'device') return cell(<DeviceTile data={snap.device} />)
          if (id === 'brief') return cell(<TextTile title="Tageslage" body={snap.brief?.line || '—'} />)
          if (id === 'chat') {
            return cell(
              <article className="lage-tile lage-chat">
                <h3>Chat</h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    const t = draft.trim()
                    if (!t || busy) return
                    onSend(t)
                    setDraft('')
                  }}
                >
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Nachricht…"
                    disabled={busy}
                  />
                </form>
              </article>,
            )
          }
          if (id === 'plugs') {
            const names = snap.plugs?.names || []
            return cell(<TextTile title="Steckdosen" body={names.length ? names.join(', ') : 'Keine gepaart.'} />)
          }
          if (id === 'tv') {
            return cell(
              <TextTile
                title="Fernseher"
                body={snap.tv?.on ? `${snap.tv.name} gekoppelt.` : 'TV aus oder ungepaart.'}
              />,
            )
          }
          if (id === 'news') return cell(<TextTile title="Nachrichten" body={snap.news?.line || '—'} />)
          if (id === 'drive') {
            const d = snap.drive
            return cell(
              <TextTile
                title="Restweg"
                body={d ? `${d.dest}: ${d.minutes} min, ${Math.round(d.meters / 100) / 10} km.` : 'Kein Fahrmodus.'}
              />,
            )
          }
          if (id === 'warn') return cell(<TextTile title="Unwetter" body={snap.warn?.line || '—'} />)
          if (id === 'fx') return cell(<TextTile title="Kurs" body={snap.fx?.line || '—'} />)
          if (id === 'sport') return cell(<TextTile title="Sport" body={snap.sport?.line || '—'} />)
          if (id === 'chess') {
            return cell(
              <article className="lage-tile">
                <h3>Schach</h3>
                <ChessBoard fen={snap.chess?.fen || ''} />
              </article>,
            )
          }
          if (id === 'trace') {
            const hops = snap.trace?.hops || []
            return cell(
              <TextTile
                title={snap.trace?.host ? `Route ${snap.trace.host}` : 'Route'}
                body={hops.length ? hops.slice(0, 8).join('\n') : 'Noch kein Traceroute.'}
              />,
            )
          }
          const label = HUD_CATALOG.find((c) => c.id === id)?.label || id
          return cell(<TextTile title={label} body="" />)
        })}
      </div>
    </section>
  )
}

function TextTile({ title, body }: { title: string; body: string }) {
  return (
    <article className="lage-tile">
      <h3>{title}</h3>
      <p className="lage-body">{body}</p>
    </article>
  )
}

function DeviceTile({ data }: { data: HudSnap['device'] }) {
  const pct = data?.battery
  return (
    <article className="lage-tile lage-gauge">
      <h3>Gerät</h3>
      <div className="lage-circle" style={{ ['--p' as string]: typeof pct === 'number' ? pct : 0 }}>
        <strong>{typeof pct === 'number' ? `${pct}` : '—'}</strong>
        <span>{typeof pct === 'number' ? '%' : 'Akku'}</span>
      </div>
      <p className="lage-body">
        {data?.clock || '—'}
        {data?.charging ? ' · lädt' : ''}
      </p>
    </article>
  )
}

function WeatherTile({ data }: { data: HudSnap['weather'] }) {
  const days = data?.days || []
  const max = Math.max(1, ...days.map((d) => d.max || 0))
  return (
    <article className="lage-tile lage-weather">
      <h3>Wetterstatistik</h3>
      <p className="lage-big">
        {Number.isFinite(data?.temp) ? `${Math.round(data!.temp)}°` : '—'}
        <small>{data?.label || ''}</small>
      </p>
      <div className="lage-bars">
        {days.map((d) => (
          <span key={d.d} className="lage-bar" title={`${d.d} ${d.max}°`}>
            <i style={{ height: `${Math.max(8, ((d.max || 0) / max) * 100)}%` }} />
            <em>{d.d.slice(3)}</em>
          </span>
        ))}
      </div>
      {data?.warn ? <p className="lage-body">{data.warn}</p> : null}
    </article>
  )
}

function SpotifyTile({ data }: { data: HudSnap['spotify'] }) {
  return (
    <article className="lage-tile">
      <h3>Spotify</h3>
      {!data?.loggedIn ? (
        <p className="lage-body">Nicht angemeldet.</p>
      ) : (
        <>
          <p className="lage-body">
            {data.title || 'Stille.'}
            {data.artist ? ` · ${data.artist}` : ''}
          </p>
          <button type="button" className="lage-btn" onClick={() => void hudSpotifyToggle(Boolean(data.playing))}>
            {data.playing ? 'Pause' : 'Weiter'}
          </button>
        </>
      )}
    </article>
  )
}
