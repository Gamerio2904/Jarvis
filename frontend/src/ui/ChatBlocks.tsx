import type { ChatBlock } from '../engine/chat-blocks.ts'
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
        return (
          <figure key={i} className="chat-image">
            <img src={b.src} alt={b.alt} />
            {b.source ? <figcaption>{b.source}</figcaption> : null}
          </figure>
        )
      })}
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