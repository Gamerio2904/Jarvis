import { useEffect, useState, type ReactNode } from 'react'
import {
  fetchHudSnap,
  HUD_CATALOG,
  hudSpotifyToggle,
  loadHudModules,
  organLabel,
  type HudSnap,
  type HudView,
} from './engine/hud'
import { BODY_ORGANS, type BodyOrgan } from './engine/hud-parse'
import { ChessBoard } from './ChessBoard'
import { BodySchema } from './BodySchema'
import { GlobeView, type GlobeFocus } from './GlobeView'
import { fetchBodySnap, type BodySnap } from './engine/body-snap'
import { loadGlobePins } from './engine/globe-pins'
import type { GeoFix } from './engine/globe-geo'
import { CITY_FLY_ZOOM } from './engine/globe-gibs'
import { isDocumentHidden, onVisibility, prefersReducedMotion } from './engine/motion'
import { loadSettings, saveSettings, type Message } from './engine/store'
import { advanceTour, selectTourStop, stopTour } from './engine/globe-tour'
import { decodeHtml } from './engine/html-text'

export function Lage({
  onSend,
  draft,
  setDraft,
  busy,
  recent = [],
  streaming = null,
  conversationId = null,
  onHudChange,
}: {
  onSend: (text: string) => void
  draft: string
  setDraft: (v: string) => void
  busy: boolean
  recent?: Message[]
  streaming?: string | null
  conversationId?: string | null
  onHudChange?: () => void
}) {
  const [snap, setSnap] = useState<HudSnap>({})
  const [body, setBody] = useState<BodySnap | null>(null)
  const [pins, setPins] = useState<GeoFix[]>([])
  const [pin, setPin] = useState<GeoFix | null>(null)
  const [pinCard, setPinCard] = useState<GeoFix | null>(null)
  const [globeTick, setGlobeTick] = useState(0)
  const s = loadSettings()
  const view: HudView = s.hud_view === 'body' || s.hud_view === 'globe' ? s.hud_view : 'tiles'
  const organ = (BODY_ORGANS as readonly string[]).includes(s.last_body_organ)
    ? (s.last_body_organ as BodyOrgan)
    : 'brain'
  const modules = loadHudModules()
  const face = s.face === 'friday' ? 'FRIDAY' : 'JARVIS'
  const spotifyOn = modules.includes('spotify')
  const reduced = prefersReducedMotion()
  const bat = snap.device?.battery
  const amber = s.hud_accent === 'amber'
  const tourOn = Boolean(s.globe_tour_on)

  useEffect(() => {
    let live = true
    async function tick() {
      if (isDocumentHidden()) return
      if (view === 'body') {
        const next = await fetchBodySnap({ busy, conversationId })
        if (live) setBody(next)
        return
      }
      if (view === 'globe') {
        const next = await loadGlobePins()
        if (live) setPins(next)
        return
      }
      const next = await fetchHudSnap()
      if (live) setSnap(next)
    }
    void tick()
    const id = window.setInterval(() => void tick(), view === 'globe' ? 30_000 : spotifyOn ? 8_000 : 20_000)
    const off = onVisibility(() => {
      if (!isDocumentHidden()) void tick()
    })
    return () => {
      live = false
      window.clearInterval(id)
      off()
    }
  }, [view, modules.join(','), spotifyOn, busy, conversationId, globeTick])

  useEffect(() => {
    if (view !== 'globe' || !tourOn || reduced) return
    const id = window.setInterval(() => {
      if (isDocumentHidden() || !loadSettings().globe_tour_on) return
      const stop = advanceTour()
      if (stop) {
        setPin({ name: stop.name, lat: stop.lat, lon: stop.lon, kind: 'glow', line: stop.line, hot: true })
        setGlobeTick((n) => n + 1)
        onHudChange?.()
      }
    }, 500)
    return () => window.clearInterval(id)
  }, [view, tourOn, reduced, onHudChange])

  function setView(next: HudView) {
    saveSettings({ hud_view: next, hud_force: true, hud_hidden: false })
    onHudChange?.()
  }

  function globeFocus(): GlobeFocus | null {
    try {
      const raw = s.last_globe_focus
      if (!raw) return null
      const f = JSON.parse(raw) as GlobeFocus
      if (!f.name || !Number.isFinite(Number(f.lat))) return null
      return { name: f.name, lat: Number(f.lat), lon: Number(f.lon), zoom: Number(f.zoom) || CITY_FLY_ZOOM }
    } catch {
      return null
    }
  }

  function onLook(look: { lat: number; lon: number; zoom: number; date: string }) {
    saveSettings({ last_globe_look: JSON.stringify(look) })
  }

  function selectOrgan(id: BodyOrgan) {
    saveSettings({ last_body_organ: id, hud_view: 'body' })
    onHudChange?.()
  }

  return (
    <section className={`lage ${amber ? 'is-amber' : ''}`} aria-label="Lage">
      <header className="lage-head">
        <div className="lage-head-row">
          <span className="lage-brand">{face}</span>
          <span className="lage-sep">&gt;</span>
          <span>Lage</span>
          <span className="lage-spacer" />
          <LageClock />
          {typeof bat === 'number' ? <span className="lage-bat">{bat} %</span> : null}
          <button
            type="button"
            className="lage-tab"
            onClick={() => {
              saveSettings({ hud_force: false, hud_hidden: true })
              onHudChange?.()
            }}
          >
            Lage aus
          </button>
        </div>
        <div className="lage-tabs" role="tablist" aria-label="Lage-Sicht">
          {(
            [
              ['tiles', 'Kacheln'],
              ['body', 'Körper'],
              ['globe', 'Kugel'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`lage-tab${view === id ? ' is-on' : ''}`}
              onClick={() => setView(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="lage-hint">
          {view === 'globe'
            ? 'Erde drehen. Satellit wenn nah.'
            : view === 'body'
              ? 'Organe — Antippen startet kein Gerät.'
              : 'Wetter, Musik, Gerät.'}
        </p>
      </header>
      {view === 'body' ? (
        <div className="lage-split">
          <BodySchema
            snap={
              body || {
                brain: { live: false, line: '—' },
                eye: { live: false, line: '—' },
                hand: { live: false, line: '—' },
                ear: { live: false, line: '—' },
                mouth: { live: false, line: '—' },
                memory: { live: false, line: '—' },
                pc_eye: { live: false, line: '—' },
                pc_hand: { live: false, line: '—' },
              }
            }
            selected={organ}
            onSelect={selectOrgan}
            reduced={reduced}
          />
          <TextTile title={organLabel(organ)} body={body?.[organ]?.line || '—'} live />
          {modules.includes('chat') ? <ChatTile {...{ onSend, draft, setDraft, busy, recent, streaming }} /> : null}
        </div>
      ) : view === 'globe' ? (
        <div className="lage-split">
          <GlobeView
            pins={pins}
            onPin={(next) => {
              setPin(next)
              if (next.kind === 'glow') {
                selectTourStop(next.name)
                setGlobeTick((n) => n + 1)
                onHudChange?.()
                return
              }
              saveSettings({
                last_globe_focus: JSON.stringify({
                  name: next.name,
                  lat: next.lat,
                  lon: next.lon,
                  zoom: CITY_FLY_ZOOM,
                }),
                last_globe_look: JSON.stringify({ lat: next.lat, lon: next.lon, zoom: CITY_FLY_ZOOM }),
              })
              if (next.kind === 'iss' || next.kind === 'here' || next.kind === 'warn') return
              setPinCard(next)
            }}
            onEmpty={() => {
              if (!loadSettings().globe_tour_on) return
              stopTour()
              setGlobeTick((n) => n + 1)
              onHudChange?.()
            }}
            reduced={reduced}
            focus={globeFocus()}
            onLook={onLook}
          />
          <TextTile
            title={pin?.name || globeFocus()?.name || 'Erde'}
            body={decodeHtml(
              pin?.line ||
                s.last_globe_brief ||
                'Drehen, zoomen, Satellitenfoto wenn nah genug. „Zeig mir London“ dreht in das NASA-Foto. „Was ist heute so auf der Welt passiert“ startet die Tour. Kein Live-Video.',
            )}
          />
          {modules.includes('chat') ? <ChatTile {...{ onSend, draft, setDraft, busy, recent, streaming }} /> : null}
          {pinCard ? (
            <div className="pin-bubble" role="dialog" aria-labelledby="pin-bubble-title">
              <h3 id="pin-bubble-title">{pinCard.name}</h3>
              <p className="lage-body">
                {decodeHtml(pinCard.line || s.last_globe_brief || 'Keine Kurzlage zu diesem Ort.')}
              </p>
              <p className="pin-bubble-swipe">Keine Bilder — nur Lage-Text.</p>
              <div className="pin-bubble-actions">
                <button type="button" className="lage-btn" onClick={() => setPinCard(null)}>
                  Schließen
                </button>
                <button
                  type="button"
                  className="lage-btn"
                  onClick={() => {
                    onSend(`Zeig ${pinCard.name}`)
                    setPinCard(null)
                  }}
                >
                  Im Chat
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
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
              return cell(<ChatTile {...{ onSend, draft, setDraft, busy, recent, streaming }} />)
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
            if (id === 'world') return cell(<TextTile title="Welt" body={snap.world?.line || '—'} />)
            const label = HUD_CATALOG.find((c) => c.id === id)?.label || id
            return cell(<TextTile title={label} body="" />)
          })}
        </div>
      )}
    </section>
  )
}

function LageClock() {
  const [clock, setClock] = useState(() =>
    new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  )
  useEffect(() => {
    const tick = () => {
      if (isDocumentHidden()) return
      setClock(new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    }
    const id = window.setInterval(tick, 1000)
    const off = onVisibility(tick)
    return () => {
      window.clearInterval(id)
      off()
    }
  }, [])
  return <span>{clock}</span>
}

function ChatTile({
  onSend,
  draft,
  setDraft,
  busy,
  recent,
  streaming,
}: {
  onSend: (text: string) => void
  draft: string
  setDraft: (v: string) => void
  busy: boolean
  recent: Message[]
  streaming: string | null
}) {
  const last = recent.slice(-2)
  return (
    <article className={`lage-tile lage-chat${streaming ? ' is-follow' : ''}`}>
      <h3>Chat</h3>
      <div className="lage-chat-log">
        {last.map((m) => (
          <p key={m.id} className={m.role === 'assistant' ? 'is-bot' : ''}>
            {m.content.slice(0, 160)}
          </p>
        ))}
        {streaming ? <p className="is-bot">{streaming.slice(0, 160)}</p> : null}
      </div>
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
          lang="de"
          spellCheck
          autoCorrect="on"
        />
      </form>
    </article>
  )
}

function TextTile({ title, body, live }: { title: string; body: string; live?: boolean }) {
  return (
    <article className={`lage-tile${live ? ' is-follow' : ''}`}>
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
      {days.some((d) => d.rain > 40) ? (
        <p className="lage-body">Regenpunkt {days.filter((d) => d.rain > 40).map((d) => d.d).slice(0, 3).join(', ')}</p>
      ) : null}
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
