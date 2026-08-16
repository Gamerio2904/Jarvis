export function WakeBubble({
  listening,
  onTap,
}: {
  listening: boolean
  onTap: () => void
}) {
  return (
    <button
      type="button"
      className={`wake-bubble ${listening ? 'listening' : ''}`}
      onClick={onTap}
      aria-label={listening ? 'Jarvis hört. Antippen zum Sprechen.' : 'Jarvis hören'}
    >
      <span className="wake-orb" />
      <span className="wake-label">{listening ? 'Jarvis hört' : 'Jarvis'}</span>
    </button>
  )
}
