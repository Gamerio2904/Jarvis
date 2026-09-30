import { useState } from 'react'
import type { ChatBlock } from '../engine/chat-blocks.ts'
import { safeImageSrc } from '../engine/image-parse.ts'
import { filesForDownload } from '../engine/xfer.ts'
import { ChessBoard } from './lage/ChessBoard.tsx'

export function ChatBlocks({
  blocks,
  onChessClick,
}: {
  blocks: ChatBlock[]
  onChessClick?: () => void
}) {
  if (!blocks.length) return null
  return (
    <div className="chat-blocks">
      {blocks.map((b, i) => {
        if (b.kind === 'table') return <SportTableBlock key={i} block={b} />
        if (b.kind === 'xfer') return <XferBlock key={i} block={b} />
        if (b.kind === 'chess') {
          if (onChessClick) {
            return (
              <button key={i} type="button" className="chat-chess" onClick={onChessClick} aria-label="Schachmodus öffnen">
                <ChessBoard fen={b.fen} />
              </button>
            )
          }
          return (
            <div key={i} className="chat-chess">
              <ChessBoard fen={b.fen} />
            </div>
          )
        }
        const src = safeImageSrc(b.src)
        if (!src) return null
        return (
          <figure key={i} className="chat-image">
            <img src={src} alt={b.alt} referrerPolicy="no-referrer" />
            {b.source ? <figcaption>{b.source}</figcaption> : null}
          </figure>
        )
      })}
    </div>
  )
}

function XferBlock({
  block,
}: {
  block: Extract<ChatBlock, { kind: 'xfer' }>
}) {
  const [note, setNote] = useState('')
  const [copied, setCopied] = useState('')
  async function load() {
    const files = await filesForDownload(block.id)
    if (!files.length) {
      setNote('Die Dateien sind weg. Der Satz hält 30 Minuten.')
      return
    }
    for (const f of files) {
      const bin = atob(f.b64)
      const bytes = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
      const url = URL.createObjectURL(new Blob([bytes], { type: f.mime || 'application/octet-stream' }))
      const a = document.createElement('a')
      a.href = url
      a.download = f.name || 'datei'
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1500)
    }
  }
  async function copy(line: string) {
    try {
      await navigator.clipboard.writeText(line)
      setCopied(line)
    } catch {
      setCopied('')
    }
  }
  return (
    <div className="xfer-card">
      {block.files.length ? (
        <button type="button" className="xfer-load" onClick={() => void load()}>
          Dateien laden
        </button>
      ) : null}
      {note ? <p className="xfer-note">{note}</p> : null}
      {block.copies.map((line) => (
        <button key={line} type="button" className="xfer-copy" onClick={() => void copy(line)}>
          <span>{line}</span>
          <span>{copied === line ? 'Kopiert' : 'Kopieren'}</span>
        </button>
      ))}
    </div>
  )
}

function SportTableBlock({
  block,
}: {
  block: Extract<ChatBlock, { kind: 'table' }>
}) {
  const n = block.rows.length
  return (
    <div className="kicker-table-wrap">
      {block.caption ? <p className="kicker-caption">{block.caption}</p> : null}
      <table className="kicker-table">
        <thead>
          <tr>
            {block.columns.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, i) => {
            const rank = i + 1
            const zone = rank <= 4 ? 'cl' : rank >= n - 2 && n >= 16 ? 'releg' : ''
            return (
              <tr key={row.join('-') + i} className={zone ? `is-${zone}` : undefined}>
                {row.map((cell, j) => (
                  <td key={j} className={j === 0 || j === row.length - 1 ? 'num' : j === 1 ? 'club' : 'num'}>
                    {cell}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
      {block.source ? <p className="kicker-source">{block.source}</p> : null}
    </div>
  )
}