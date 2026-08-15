import { useEffect, useRef, useState } from 'react'
import {
  listenOnce,
  requestMicPermission,
  speakText,
  stopListen,
  stopSpeak,
} from './native/voice'

type Phase = 'idle' | 'listening' | 'thinking' | 'speaking'

export function VoiceMode({
  onClose,
  onTurn,
}: {
  onClose: () => void
  onTurn: (text: string) => Promise<string>
}) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [heard, setHeard] = useState('')
  const [reply, setReply] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const live = useRef(true)
  const phaseRef = useRef<Phase>('idle')

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  useEffect(() => {
    live.current = true
    void startLoop()
    return () => {
      live.current = false
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
      let answer = ''
      try {
        answer = await onTurn(text)
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'Antwort fehlgeschlagen')
        continue
      }
      if (!live.current) return
      setReply(answer)
      setPhase('speaking')
      await speakText(answer)
    }
  }

  async function onOrb() {
    if (phaseRef.current === 'speaking') {
      await stopSpeak()
      return
    }
    if (phaseRef.current === 'listening') {
      await stopListen()
      return
    }
  }

  const label =
    phase === 'listening'
      ? 'Ich höre…'
      : phase === 'thinking'
        ? 'Einen Moment.'
        : phase === 'speaking'
          ? 'Jarvis spricht — antippen unterbricht.'
          : 'Bereit.'

  return (
    <div className="voice-mode" role="dialog" aria-label="Sprachmodus">
      <header className="voice-head">
        <div>
          <h2>Jarvis hören</h2>
          <p>Gespräch, kein Mitschnitt. Nur der Text bleibt im Chat.</p>
        </div>
        <button type="button" className="ghost-btn" onClick={onClose}>
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
  )
}
