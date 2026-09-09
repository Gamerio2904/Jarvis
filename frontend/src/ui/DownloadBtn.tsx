import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '../engine/motion.ts'

type Phase = 'idle' | 'work' | 'done'

type Props = {
  idle: string
  work: string
  done: string
  disabled?: boolean
  className?: string
  onRun: () => Promise<void>
  onError?: (message: string) => void
}

const FILL_MS = 1600
const DONE_MS = 2200

export function DownloadBtn(p: Props) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [pct, setPct] = useState(0)
  const lock = useRef(false)
  const resetTimer = useRef(0)

  useEffect(() => () => window.clearTimeout(resetTimer.current), [])

  async function run() {
    if (lock.current || p.disabled) return
    lock.current = true
    setPhase('work')
    setPct(0)
    const reduce = prefersReducedMotion()
    const started = performance.now()
    let finished = false
    let failed = ''
    const job = p
      .onRun()
      .then(() => {
        finished = true
      })
      .catch((err: unknown) => {
        failed = err instanceof Error ? err.message : 'Speichern fehlgeschlagen'
      })

    await new Promise<void>((resolve) => {
      if (reduce) {
        void job.finally(() => {
          setPct(failed ? 0 : 1)
          resolve()
        })
        return
      }
      const tick = (now: number) => {
        if (failed) {
          setPct(0)
          resolve()
          return
        }
        const t = Math.min(1, (now - started) / FILL_MS)
        if (!finished) {
          setPct(Math.min(0.92, t))
          window.requestAnimationFrame(tick)
          return
        }
        setPct(t)
        if (t >= 1) {
          setPct(1)
          resolve()
          return
        }
        window.requestAnimationFrame(tick)
      }
      window.requestAnimationFrame(tick)
    })
    await job.catch(() => {})
    if (failed) {
      lock.current = false
      setPhase('idle')
      setPct(0)
      p.onError?.(failed)
      return
    }
    setPhase('done')
    setPct(1)
    resetTimer.current = window.setTimeout(() => {
      setPhase('idle')
      setPct(0)
      lock.current = false
    }, DONE_MS)
  }

  const label = phase === 'work' ? p.work : phase === 'done' ? p.done : p.idle
  return (
    <button
      type="button"
      className={`dl-btn${p.className ? ` ${p.className}` : ''}${phase !== 'idle' ? ` is-${phase}` : ''}`}
      style={{ ['--p' as string]: String(pct) }}
      disabled={p.disabled}
      aria-busy={phase === 'work'}
      onClick={() => void run()}
    >
      <span className="dl-stream" aria-hidden />
      <span className="dl-liquid" aria-hidden>
        <span className="dl-wave" />
      </span>
      <span className="dl-face">
        <span className="dl-ico" aria-hidden>
          <svg className="dl-arrow" viewBox="0 0 24 24" width="18" height="18">
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v12M7 12l5 5 5-5"
            />
          </svg>
          <svg className="dl-check" viewBox="0 0 24 24" width="18" height="18">
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 12.5 10 17.5 19 7"
            />
          </svg>
        </span>
        <span className="dl-lab">{label}</span>
      </span>
    </button>
  )
}
