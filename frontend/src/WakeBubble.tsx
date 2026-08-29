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
      aria-label={listening ? 'Auf den Namen. Antippen zum Sprechen.' : 'Jarvis hören'}
    >
      <span className="wake-orb" />
      <span className="wake-label">{listening ? 'Auf den Namen' : 'Jarvis'}</span>
    </button>
  )
}
