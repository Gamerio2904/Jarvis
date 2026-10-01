import type { KeyboardEvent } from 'react'
import type { Message } from '../api.ts'

export function MiniChat({
  open,
  onToggle,
  onExpand,
  messages,
  streaming,
  busy,
  draft,
  setDraft,
  onSend,
  face,
}: {
  open: boolean
  onToggle: () => void
  onExpand: () => void
  messages: Message[]
  streaming: string | null
  busy: boolean
  draft: string
  setDraft: (v: string) => void
  onSend: () => void
  face: 'jarvis' | 'friday'
}) {
  const recent = messages.slice(-6)
  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!busy) onSend()
    }
  }
  return (
    <div className={`mini-chat${open ? ' is-open' : ''}`}>
      {open ? (
        <div className="mini-chat-panel" role="dialog" aria-label="Kleiner Chat">
          <header className="mini-chat-bar">
            <p>Ultron</p>
            <div className="mini-chat-actions">
              <button type="button" className="ghost-btn" onClick={onExpand}>
                Groß
              </button>
              <button type="button" className="ghost-btn" onClick={onToggle} aria-label="Chat zuklappen">
                Zu
              </button>
            </div>
          </header>
          <div className="mini-chat-log">
            {recent.length ? (
              recent.map((m) => (
                <p key={m.id} className={`mini-chat-line is-${m.role}`}>
                  <span>{m.role === 'user' ? 'Sie' : face === 'friday' ? 'F' : 'J'}</span>
                  {m.content}
                </p>
              ))
            ) : (
              <p className="mini-chat-line is-assistant">Kleiner Chat — oder Groß für die volle Fläche.</p>
            )}
            {streaming !== null ? (
              <p className="mini-chat-line is-assistant is-stream">
                <span>{face === 'friday' ? 'F' : 'J'}</span>
                {streaming || '…'}
              </p>
            ) : null}
          </div>
          <div className="mini-chat-compose">
            <textarea
              rows={2}
              value={draft}
              placeholder="Schreiben…"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKey}
              disabled={busy}
            />
            <button type="button" className="retry-btn" disabled={busy || !draft.trim()} onClick={onSend}>
              Senden
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="mini-chat-fab" onClick={onToggle} aria-label="Kleinen Chat öffnen">
          Chat
        </button>
      )}
    </div>
  )
}
