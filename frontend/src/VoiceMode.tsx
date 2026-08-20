import { useEffect, useRef, useState } from 'react'
import { wantGeminiVoice } from './engine/tts'
import { setChatSpeaking } from './engine/speak-lock'
import {
  createSentenceTap,
  createSpeakPipeline,
  listenOnce,
  requestMicPermission,
  setKeepScreenOn,
  setVoiceUi,
  stopListen,
  stopSpeak,
} from './native/voice'

type Phase = 'idle' | 'listening' | 'thinking' | 'speaking'

export function VoiceMode({
  onClose,
  onTurn,
  initialUtterance = '',
}: {
  onClose: () => void
  onTurn: (text: string, onToken?: (piece: string, full: string) => void) => Promise<string>
  initialUtterance?: string
}) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [heard, setHeard] = useState('')
  const [reply, setReply] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const live = useRef(true)
  const phaseRef = useRef<Phase>('idle')
  const pipelineRef = useRef<ReturnType<typeof createSpeakPipeline> | null>(null)
  const turnGen = useRef(0)
  const abortTurn = useRef<(() => void) | null>(null)
  const neural = wantGeminiVoice()

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  useEffect(() => {
    live.current = true
    void setVoiceUi(true)
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
      void setKeepScreenOn(false)
      void setVoiceUi(false)
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
        if (heardRes.message) setErr(heardRes.message)
        else setErr('Nichts gehört. Nochmal?')
        await new Promise((r) => setTimeout(r, 280))
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
  }

  async function onOrb() {
    if (phaseRef.current === 'speaking' || phaseRef.current === 'thinking') {
      turnGen.current += 1
      abortTurn.current?.()
      pipelineRef.current?.stop()
      setChatSpeaking(false)
      await stopSpeak()
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
          ? 'Jarvis spricht — antippen unterbricht.'
          : 'Bereit.'

  return (
    <div
      className="voice-mode"
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
                ? 'Antwort sofort. Charon nur wenn er schnell da ist, sonst Android.'
                : 'Text sofort. Gemini an = natürliche Stimme.'}
            </p>
          </div>
          <button type="button" className="ghost-btn voice-close" onClick={onClose}>
            Beenden
          </button>
        </header>
        <button
          type="button"
          className={`voice-orb ${phase}`}
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
