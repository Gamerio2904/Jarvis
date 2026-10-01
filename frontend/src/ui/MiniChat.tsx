import type { ClipboardEvent, KeyboardEvent } from 'react'
import type { Message } from '../api.ts'
import { parseChatBlocks } from '../engine/chat-blocks.ts'
import { safeImageSrc } from '../engine/image-parse.ts'

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
  onPasteImage,
  pasteImage,
  onClearPaste,
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
  onPasteImage: (e: ClipboardEvent<HTMLTextAreaElement>) => void
  pasteImage: { src: string; alt: string } | null
  onClearPaste: () => void
  face: 'ultron'
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
            <p data-voice={face}>Ultron</p>
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
                  <span>{m.role === 'user' ? 'Sie' : 'U'}</span>
                  {m.content}
                  {parseChatBlocks(m.meta?.blocks).map((block, i) => {
                    if (block.kind !== 'image') return null
                    const src = safeImageSrc(block.src)
                    if (!src) return null
                    return <img key={i} className="mini-chat-shot" src={src} alt={block.alt} />
                  })}
                </p>
              ))
            ) : (
              <p className="mini-chat-line is-assistant">Kleiner Chat — oder Groß für die volle Fläche.</p>
            )}
            {streaming !== null ? (
              <p className="mini-chat-line is-assistant is-stream">
                <span>U</span>
                {streaming || '…'}
              </p>
            ) : null}
          </div>
          <div className="mini-chat-compose">
            {pasteImage ? (
              <div className="paste-preview">
                <img src={pasteImage.src} alt={pasteImage.alt} />
                <button type="button" onClick={onClearPaste} aria-label="Bild von der Nachricht nehmen">
                  Weg
                </button>
              </div>
            ) : null}
            <textarea
              rows={2}
              value={draft}
              placeholder="Schreiben…"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKey}
              onPaste={onPasteImage}
              disabled={busy}
            />
            <button type="button" className="retry-btn" disabled={busy || (!draft.trim() && !pasteImage)} onClick={onSend}>
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
