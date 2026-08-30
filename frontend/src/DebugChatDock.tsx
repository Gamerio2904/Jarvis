import { createPortal } from 'react-dom'
import type { Message } from './api'
import type { DebugTurn } from './engine/debug-run'

export function DebugChatDock({
  running,
  overlayOpen,
  progress,
  turns,
  messages,
  streaming,
  onStop,
  onOpen,
}: {
  running: boolean
  overlayOpen?: boolean
  progress: string
  turns: DebugTurn[]
  messages: Message[]
  streaming: string | null
  onStop: () => void
  onOpen: () => void
}) {
  if (!running && !turns.length) return null
  const recent = messages.slice(-8)
  const node = (
    <aside
      className={`debug-chat-dock${running ? ' is-running' : ''}${overlayOpen ? ' is-over-overlay' : ''}`}
      role="status"
      aria-live="polite"
      aria-label="Debug-Chat"
    >
      <header className="debug-chat-dock-bar">
        <div>
          <p className="debug-chat-dock-kicker">{running ? 'Läuft weiter' : 'Debug-Chat'}</p>
          <h3>Debug-Chat</h3>
        </div>
        <div className="debug-chat-dock-actions">
          <button type="button" className="ghost-btn" onClick={onOpen}>
            Tests
          </button>
          <button type="button" className="ghost-btn" disabled={!running} onClick={onStop}>
            Stop
          </button>
        </div>
      </header>
      {progress ? <p className="debug-chat-dock-progress">{progress}</p> : null}
      <div className="debug-chat-dock-log">
        {recent.length ? (
          recent.map((m) => (
            <p key={m.id} className={`debug-chat-line is-${m.role}`}>
              <span>{m.role === 'user' ? 'Sie' : 'Jarvis'}</span>
              {m.content}
            </p>
          ))
        ) : turns.length ? (
          turns.slice(-6).map((t, i) => (
            <p key={`${t.group}-${t.label}-${i}`} className="debug-chat-line is-assistant">
              <span>{t.verdict.toUpperCase()}</span>
              {t.prompt} → {t.reply || '—'}
            </p>
          ))
        ) : (
          <p className="debug-chat-line is-assistant">Wartet auf den ersten Turn…</p>
        )}
        {streaming ? (
          <p className="debug-chat-line is-assistant is-stream">
            <span>Jarvis</span>
            {streaming}
          </p>
        ) : null}
      </div>
    </aside>
  )
  return createPortal(node, document.body)
}
