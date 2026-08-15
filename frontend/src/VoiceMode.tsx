import { useEffect, useRef, useState } from 'react'
import { wantGeminiVoice } from './engine/tts'
import {
  createSentenceTap,
  createSpeakPipeline,
  listenOnce,
  requestMicPermission,
  stopListen,
  stopSpeak,
} from './native/voice'

type Phase = 'idle' | 'listening' | 'thinking' | 'speaking'

export function VoiceMode({
  onClose,
  onTurn,
}: {
  onClose: () => void
  onTurn: (text: string, onToken?: (piece: string, full: string) => void) => Promise<string>
}) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [heard, setHeard] = useState('')
  const [reply, setReply] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const live = useRef(true)
  const phaseRef = useRef<Phase>('idle')
  const pipelineRef = useRef<ReturnType<typeof createSpeakPipeline> | null>(null)
  const neural = wantGeminiVoice()

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  useEffect(() => {
    live.current = true
    void startLoop()
    return () => {
      live.current = false
      pipelineRef.current?.stop()
      void stopListen()
      void stopSpeak()
    }
  }, [])

  async function startLoop() {
    const ok = await requestMicPermission()
    if (!ok) {
      setErr('Mikrofon erlauben — sonst kein Sprachmodus.')
      setPhase('idle')
      return
    }
    await loop()
  }

  async function loop() {
    while (live.current) {
      setPhase('listening')
      setHeard('')
      const heardRes = await listenOnce((partial) => {
        if (live.current) setHeard(partial)
      })
      if (!live.current) return
      const text = heardRes.text.trim()
      if (!text) {
        if (heardRes.message) setErr(heardRes.message)
        continue
      }
      setHeard(text)
      setErr(null)
      setPhase('thinking')
      const tap = createSentenceTap()
      const pipe = createSpeakPipeline()
      pipelineRef.current = pipe
      let started = false
      let answer = ''
      try {
        answer = await onTurn(text, (_piece, full) => {
          if (!live.current) return
          setReply(full)
          const ready = tap.feed(full)
          if (ready.length) {
            if (!started) {
              started = true
              setPhase('speaking')
            }
            for (const s of ready) pipe.push(s)
          }
        })
      } catch (e) {
        pipe.stop()
        setErr(e instanceof Error ? e.message : 'Antwort fehlgeschlagen')
        continue
      }
      if (!live.current) return
      setReply(answer)
      for (const s of tap.flush()) {
        if (!started) {
          started = true
          setPhase('speaking')
        }
        pipe.push(s)
      }
      if (!started && answer.trim()) {
        setPhase('speaking')
        pipe.push(answer)
      }
      await pipe.flush()
    }
  }

  async function onOrb() {
    if (phaseRef.current === 'speaking' || phaseRef.current === 'thinking') {
      pipelineRef.current?.stop()
      await stopSpeak()
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
    <div className="voice-mode" role="dialog" aria-label="Sprachmodus">
      <div className="voice-sheet">
        <header className="voice-head">
          <div>
            <h2>Jarvis hören</h2>
            <p>
              {neural
                ? 'Text sofort. Ganze Sätze, natürliche Betonung.'
                : 'Text sofort. Gemini an = flüssiger und klarer.'}
            </p>
          </div>
          <button type="button" className="ghost-btn voice-close" onClick={onClose}>
            Schließen
          </button>
        </header>
        <button
          type="button"
          className={`voice-orb ${phase}`}
          onClick={() => void onOrb()}
          aria-label={label}
        >
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
