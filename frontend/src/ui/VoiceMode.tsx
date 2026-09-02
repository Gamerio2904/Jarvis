import { useEffect, useRef, useState } from 'react'
import { wantNeuralMouth } from '../engine/tts'
import { setChatSpeaking } from '../engine/speak-lock'
import { dispatchVoiceAmp, prefersReducedMotion } from '../engine/motion'
import {
  beginVoiceSession,
  createSentenceTap,
  createSpeakPipeline,
  endVoiceSession,
  isNativeVoice,
  listenOnce,
  requestMicPermission,
  setKeepScreenOn,
  stopListen,
  stopSpeak,
  watchBargeIn,
} from '../native/voice'

type Phase = 'idle' | 'listening' | 'thinking' | 'speaking'

export function VoiceMode({
  onClose,
  onTurn,
  onTruncate,
  initialUtterance = '',
  leaving = false,
}: {
  onClose: () => void
  onTurn: (
    text: string,
    onToken?: (piece: string, full: string) => void,
    opts?: { preempt?: boolean },
  ) => Promise<string>
  onTruncate?: (spoken: string) => void
  initialUtterance?: string
  leaving?: boolean
}) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [heard, setHeard] = useState('')
  const [reply, setReply] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [level, setLevel] = useState(0)
  const live = useRef(true)
  const phaseRef = useRef<Phase>('idle')
  const pipelineRef = useRef<ReturnType<typeof createSpeakPipeline> | null>(null)
  const turnGen = useRef(0)
  const abortTurn = useRef<(() => void) | null>(null)
  const preemptNext = useRef(false)
  const onTurnRef = useRef(onTurn)
  onTurnRef.current = onTurn
  const onTruncateRef = useRef(onTruncate)
  onTruncateRef.current = onTruncate
  const neural = wantNeuralMouth()
  const reduced = prefersReducedMotion()

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  useEffect(() => {
    if (reduced || (phase !== 'listening' && phase !== 'speaking')) {
      setLevel(0)
      dispatchVoiceAmp(0)
      return
    }
    if (phase === 'speaking') {
      let t = 0
      const id = window.setInterval(() => {
        t += 1
        const n = 0.25 + 0.2 * Math.abs(Math.sin(t / 3))
        setLevel(n)
        dispatchVoiceAmp(n)
      }, 80)
      return () => {
        window.clearInterval(id)
        dispatchVoiceAmp(0)
      }
    }
    let stream: MediaStream | null = null
    let ctx: AudioContext | null = null
    let raf = 0
    let dead = false
    if (isNativeVoice()) return
    void (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        if (dead) {
          stream.getTracks().forEach((tr) => tr.stop())
          return
        }
        ctx = new AudioContext()
        const src = ctx.createMediaStreamSource(stream)
        const an = ctx.createAnalyser()
        an.fftSize = 512
        src.connect(an)
        const data = new Uint8Array(an.fftSize)
        const loop = () => {
          an.getByteTimeDomainData(data)
          let s = 0
          for (const v of data) {
            const n = (v - 128) / 128
            s += n * n
          }
          const rms = Math.min(1, Math.sqrt(s / data.length) * 3)
          setLevel(rms)
          dispatchVoiceAmp(rms)
          raf = requestAnimationFrame(loop)
        }
        raf = requestAnimationFrame(loop)
      } catch {
        /* Native-STT hält das Mic — CSS-Pulse bleibt. */
      }
    })()
    return () => {
      dead = true
      cancelAnimationFrame(raf)
      stream?.getTracks().forEach((tr) => tr.stop())
      void ctx?.close()
      dispatchVoiceAmp(0)
    }
  }, [phase, reduced])

  useEffect(() => {
    live.current = true
    void beginVoiceSession()
    void setKeepScreenOn(true)
    void startLoop()
    return () => {
      live.current = false
      turnGen.current += 1
      abortTurn.current?.()
      pipelineRef.current?.stop()
      setChatSpeaking(false)
      void stopListen()
      void stopSpeak()
      void endVoiceSession()
      void setKeepScreenOn(false)
    }
  }, [])

  async function startLoop() {
    const ok = await requestMicPermission()
    if (!ok) {
      setErr('Mikrofon erlauben — sonst kein Sprachmodus.')
      setPhase('idle')
      return
    }
    const seed = initialUtterance.trim()
    if (seed) {
      await runTurn(seed)
      if (!live.current) return
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
        if (heardRes.message) {
          setErr(heardRes.message)
          await new Promise((r) => setTimeout(r, 600))
        }
        continue
      }
      await runTurn(text)
    }
  }

  function cutIn(pipe: ReturnType<typeof createSpeakPipeline>) {
    preemptNext.current = true
    onTruncateRef.current?.(pipe.spoken())
    turnGen.current += 1
    abortTurn.current?.()
    pipe.stop()
    setChatSpeaking(false)
    void stopSpeak()
  }

  async function runTurn(text: string) {
    const gen = ++turnGen.current
    const preempt = preemptNext.current
    preemptNext.current = false
    setHeard(text)
    setErr(null)
    setPhase('thinking')
    const tap = createSentenceTap(true)
    const pipe = createSpeakPipeline()
    pipelineRef.current = pipe
    let started = false
    let answer = ''
    let barged = false
    const stopBarge = watchBargeIn(() => {
      barged = true
      cutIn(pipe)
    })
    try {
      answer = await Promise.race([
        onTurnRef.current(
          text,
          (_piece, full) => {
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
          },
          { preempt },
        ),
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
      stopBarge()
      if (abortTurn.current) abortTurn.current = null
    }
    if (!live.current || turnGen.current !== gen || barged) {
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
    const stopBargePlay = watchBargeIn(() => {
      barged = true
      cutIn(pipe)
    })
    try {
      await pipe.flush()
    } finally {
      stopBargePlay()
    }
    setChatSpeaking(false)
  }

  async function onOrb() {
    if (phaseRef.current === 'speaking' || phaseRef.current === 'thinking') {
      const pipe = pipelineRef.current
      if (pipe) cutIn(pipe)
      else {
        turnGen.current += 1
        abortTurn.current?.()
        setChatSpeaking(false)
        await stopSpeak()
      }
      setPhase('listening')
      return
    }
    if (phaseRef.current === 'listening') {
      await stopListen()
    }
  }

  const label =
    phase === 'listening'
      ? 'Ich höre…'
      : phase === 'thinking'
        ? 'Antwort kommt…'
        : phase === 'speaking'
          ? 'Jarvis spricht — einfach dazwischenreden.'
          : 'Bereit.'

  return (
    <div
      className={`voice-mode${leaving ? ' is-leaving' : ''}`}
      role="dialog"
      aria-label="Sprachmodus"
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest('.voice-close')) return
        if (phaseRef.current === 'speaking' || phaseRef.current === 'thinking') void onOrb()
      }}
    >
      <div className="voice-sheet">
        <header className="voice-head">
          <div>
            <h2>Jarvis hören</h2>
            <p>
              {neural
                ? 'Dazwischenreden unterbricht. Erste Silbe Edge Neural oder Algieba, eine Stimme pro Antwort.'
                : 'Dazwischenreden unterbricht. Stimme auf System = Geräte-TTS, sonst Edge Neural.'}
            </p>
          </div>
          <button type="button" className="ghost-btn voice-close" onClick={onClose}>
            Beenden
          </button>
        </header>
        <button
          type="button"
          className={`voice-orb ${phase}`}
          style={{ transform: reduced ? undefined : `scale(${(1 + level * 0.55).toFixed(3)})` }}
          onClick={() => void onOrb()}
          aria-label={label}
        >
          <i className="orb-ring r1" />
          <i className="orb-ring r2" />
          <i className="orb-ring r3" />
          <span />
        </button>
        <p className="voice-status">{label}</p>
        {heard ? <p className="voice-line you">{heard}</p> : null}
        {reply && phase !== 'listening' ? <p className="voice-line jarvis">{reply}</p> : null}
        {err ? <p className="voice-err">{err}</p> : null}
      </div>
    </div>
  )
}
