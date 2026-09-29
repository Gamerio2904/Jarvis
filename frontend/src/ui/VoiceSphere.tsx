import type { CSSProperties } from 'react'

export type VoiceSpherePhase = 'idle' | 'listening' | 'thinking' | 'speaking'

export function VoiceSphere({
  phase = 'idle',
  level = 0,
  size = 72,
  onClick,
  label,
  reduced = false,
}: {
  phase?: VoiceSpherePhase
  level?: number
  size?: number
  onClick?: () => void
  label: string
  reduced?: boolean
}) {
  const talk = !reduced && (phase === 'speaking' || phase === 'listening')
  const scale = talk ? 1 + Math.min(0.28, level * 0.55) : 1
  const style = {
    width: size,
    height: size,
    ['--sphere-scale' as string]: String(scale),
  } as CSSProperties
  return (
    <button
      type="button"
      className={`voice-sphere is-${phase}${reduced ? ' is-static' : ''}`}
      style={style}
      onClick={onClick}
      aria-label={label}
    >
      <i className="voice-sphere-ring r1" aria-hidden />
      <i className="voice-sphere-ring r2" aria-hidden />
      <span className="voice-sphere-ball" aria-hidden>
        <i className="voice-sphere-shine" />
        <i className="voice-sphere-core" />
      </span>
    </button>
  )
}
