import { useEffect, useRef, useState } from 'react'
import { wantGeminiVoice } from './engine/tts'
import { setChatSpeaking } from './engine/speak-lock'
import {
  closeTablet,
  getTabletCard,
  isNameOnly,
  subscribeTablet,
  type TabletCard,
} from './engine/tablet'
import { loadSettings } from './engine/store'
import { prefersReducedMotion } from './fx'
import {
  createSentenceTap,
  createSpeakPipeline,
  listenOnce,
  requestMicPermission,
  setKeepScreenOn,
  startWakeWord,
  stopListen,
  stopSpeak,
} from './native/voice'

type Phase = 'idle' | 'listening' | 'thinking' | 'speaking'

function clockParts(now: Date) {
  return {
    time: now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
    date: now.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' }),
  }
}

export function TabletMode({
  onClose,
  onTurn,
}: {
  onClose: () => void
  onTurn: (text: string, onToken?: (piece: string, full: string) => void) => Promise<string>
}) {
  const [phase, setPhase] = useState<Phase>('listening')
  const [heard, setHeard] = useState('')
  const [reply, setReply] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [card, setCard] = useState<TabletCard>(getTabletCard)
  const [clock, setClock] = useState(() => clockParts(new Date()))
  const [entering, setEntering] = useState(() => !prefersReducedMotion())
  const live = useRef(true)
  const phaseRef = useRef<Phase>('listening')
  const pipelineRef = useRef<ReturnType<typeof createSpeakPipeline> | null>(null)
  const turnGen = useRef(0)
  const abortTurn = useRef<(() => void) | null>(null)
  const neural = wantGeminiVoice()

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  useEffect(() => {
    return subscribeTablet(() => setCard(getTabletCard()))
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => setClock(clockParts(new Date())), 1_000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (!entering) return
    const id = window.setTimeout(() => setEntering(false), 1_250)
    return () => window.clearTimeout(id)
  }, [entering])

  useEffect(() => {
    live.current = true
    void setKeepScreenOn(true)
    void startWakeWord().catch(() => {
      /* Browser ohne Wake-Word */
    })
    void startLoop()
    return () => {
      live.current = false
      turnGen.current += 1
      abortTurn.current?.()
      pipelineRef.current?.stop()
      setChatSpeaking(false)
      void stopListen()
      void stopSpeak()
      void setKeepScreenOn(false)
    }
  }, [])

  async function startLoop() {
    const ok = await requestMicPermission()
    if (!ok) {
      setErr('Mikrofon erlauben — sonst höre ich im Vollbild nichts.')
      setPhase('idle')
      return
    }
    await loop()
  }

  async function loop() {
    while (live.current) {
      setPhase('listening')
      setHeard('')
      setChatSpeaking(false)
      const heardRes = await listenOnce((partial) => {
        if (live.current) setHeard(partial)
      })
      if (!live.current) return
      const text = heardRes.text.trim()
      if (!text) {
        if (heardRes.message) setErr(heardRes.message)
        await new Promise((r) => setTimeout(r, 220))
        continue
      }
      if (isNameOnly(text)) {
        setHeard(text)
        setReply('Ja?')
        setErr(null)
        setPhase('speaking')
        setChatSpeaking(true)
        const pipe = createSpeakPipeline()
        pipelineRef.current = pipe
        pipe.push('Ja?')
        await pipe.flush()
        setChatSpeaking(false)
        continue
      }
      await runTurn(text)
    }
  }

  async function runTurn(text: string) {
    const gen = ++turnGen.current
    setHeard(text)
    setErr(null)
    setPhase('thinking')
    const tap = createSentenceTap(true)
    const pipe = createSpeakPipeline()
    pipelineRef.current = pipe
    let started = false
    let answer = ''
    try {
      answer = await Promise.race([
        onTurn(text, (_piece, full) => {
          if (!live.current || turnGen.current !== gen) return
          setReply(full)
          const ready = tap.feed(full)
          if (ready.length) {
            if (!started) {
              started = true
              setPhase('speaking')
              setChatSpeaking(true)
            }
            for (const s of ready) pipe.push(s)
          }
        }),
        new Promise<string>((_, reject) => {
          abortTurn.current = () => reject(new Error('__barge_in__'))
        }),
      ])
    } catch (e) {
      pipe.stop()
      setChatSpeaking(false)
      if (e instanceof Error && e.message === '__barge_in__') return
      setErr(e instanceof Error ? e.message : 'Antwort fehlgeschlagen')
      return
    } finally {
      if (abortTurn.current) abortTurn.current = null
    }
    if (!live.current || turnGen.current !== gen) {
      pipe.stop()
      setChatSpeaking(false)
      return
    }
    setReply(answer)
    for (const s of tap.flush()) {
      if (!started) {
        started = true
        setPhase('speaking')
        setChatSpeaking(true)
      }
      pipe.push(s)
    }
    if (!started && answer.trim()) {
      setPhase('speaking')
      setChatSpeaking(true)
      pipe.push(answer)
    }
    await pipe.flush()
    setChatSpeaking(false)
    if (!loadSettings().tablet_mode) {
      live.current = false
      onClose()
    }
  }

  const label =
    phase === 'listening'
      ? 'Jarvis hört…'
      : phase === 'thinking'
        ? 'Einen Moment.'
        : phase === 'speaking'
          ? 'Jarvis spricht — antippen unterbricht.'
          : 'Bereit.'

  const weatherLine =
    card.kind === 'weather'
      ? card.line
      : loadSettings().last_weather_line || ''
  const place =
    card.kind === 'weather'
      ? card.place
      : loadSettings().last_weather_place || loadSettings().last_place

  return (
    <div
      className={`tablet-mode ${entering ? 'entering' : 'ready'} ${phase}`}
      role="dialog"
      aria-label="Tablet-Modus"
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest('.tablet-close')) return
        if (phaseRef.current === 'speaking' || phaseRef.current === 'thinking') {
          turnGen.current += 1
          abortTurn.current?.()
          pipelineRef.current?.stop()
          setChatSpeaking(false)
          void stopSpeak()
          setPhase('listening')
        }
      }}
    >
      <div className="tablet-burst" aria-hidden>
        <i className="tablet-ring r1" />
        <i className="tablet-ring r2" />
        <i className="tablet-ring r3" />
        <i className="tablet-ring r4" />
        <span className="tablet-core" />
      </div>
      <header className="tablet-bar">
        <div>
          <p className="settings-kicker">Tablet</p>
          <h2>{clock.time}</h2>
          <p className="tablet-date">{clock.date}</p>
        </div>
        <button
          type="button"
          className="settings-close tablet-close"
          onClick={() => {
            closeTablet()
            onClose()
          }}
        >
          Fertig
        </button>
      </header>
      <div className="tablet-stage">
        <button type="button" className={`tablet-orb ${phase}`} aria-label={label}>
          <i className="orb-ring r1" />
          <i className="orb-ring r2" />
          <span />
        </button>
        <p className="tablet-status">{label}</p>
        {heard ? <p className="tablet-line you">{heard}</p> : null}
        {reply && phase !== 'listening' ? <p className="tablet-line jarvis">{reply}</p> : null}
        {err ? <p className="tablet-err">{err}</p> : null}
      </div>
      <section className="tablet-cards" aria-live="polite">
        {card.kind === 'image' && card.dataUrl ? (
          <figure className="tablet-card tablet-photo">
            <img src={card.dataUrl} alt={card.caption || 'Letztes Bild'} />
            {card.caption ? <figcaption>{card.caption}</figcaption> : <figcaption>Letztes Bild</figcaption>}
          </figure>
        ) : null}
        {weatherLine ? (
          <article className={`tablet-card tablet-weather ${card.kind === 'weather' ? 'is-on' : ''}`}>
            <p className="settings-kicker">Wetter</p>
            <strong>{weatherLine}</strong>
            {place ? <span>{place}</span> : null}
          </article>
        ) : null}
        {card.kind === 'status' ? (
          <article className="tablet-card is-on">
            <p className="settings-kicker">{card.title}</p>
            <strong>{card.body}</strong>
          </article>
        ) : null}
        {card.kind === 'reply' && card.reply && phase === 'listening' ? (
          <article className="tablet-card">
            <p className="settings-kicker">Zuletzt</p>
            <strong>{card.reply}</strong>
          </article>
        ) : null}
        {card.kind === 'squad' ? (
          <div className={`tablet-squad ${card.focus ? 'has-focus' : ''}`}>
            {card.picks.map((p) => (
              <article
                key={p.name}
                className={`fifa-card ${p.kind} ${card.focus === p.name ? 'is-focus' : card.focus ? 'is-away' : ''}`}
              >
                <p className="settings-kicker">{p.kind === 'veteran' ? 'Erfahren' : p.kind === 'youth' ? 'Talent' : 'Mitte'}</p>
                <strong>{p.est}</strong>
                <span>{p.name}</span>
                <span>
                  {p.pos} · {p.age} · Pot. {p.pot}
                </span>
              </article>
            ))}
          </div>
        ) : null}
      </section>
      <p className="tablet-hint">
        {neural ? 'Name oder Befehl. Charon wenn er schnell da ist.' : '„Jarvis“ oder ein Befehl. Gemini an = natürliche Stimme.'}
      </p>
    </div>
  )
}
