import { ThinkingOrb } from 'thinking-orbs'
import { loadSettings } from '../engine/store.ts'
import { prefersReducedMotion } from '../engine/motion.ts'
import { resolveUiTheme } from '../fx/theme-transition.ts'

export type ReplyOrbState = 'composing' | 'searching' | 'solving'

const LABELS: Record<ReplyOrbState, string> = {
  composing: 'Jarvis antwortet',
  searching: 'Jarvis sucht',
  solving: 'Jarvis arbeitet',
}

export function ReplyOrb({
  state = 'composing',
  size = 64,
}: {
  state?: ReplyOrbState
  size?: 64 | 20
}) {
  const theme = resolveUiTheme(loadSettings().ui_theme)
  const paused = prefersReducedMotion() || (typeof document !== 'undefined' && document.hidden)
  return (
    <span className="reply-orb">
      <ThinkingOrb state={state} size={size} theme={theme} paused={paused} aria-label={LABELS[state]} />
    </span>
  )
}
