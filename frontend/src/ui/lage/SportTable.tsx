import { parseChatBlocks } from '../../engine/chat-blocks.ts'

export function SportTable({ json, fallback }: { json?: string; fallback: string }) {
  const block = parseChatBlocks(safeParse(json)).find((b) => b.kind === 'table')
  if (!block || block.kind !== 'table' || !block.rows.length) {
    return (
      <article className="lage-tile">
        <h3>Sport</h3>
        <p>{fallback}</p>
      </article>
    )
  }
  return (
    <article className="lage-tile lage-sport">
      <h3>{block.caption || 'Sport'}</h3>
      <table className="kicker-table kicker-table--compact">
        <thead>
          <tr>
            {block.columns.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, i) => (
            <tr key={row.join('-') + i}>
              {row.map((cell, j) => (
                <td key={j} className={j === 1 ? 'club' : 'num'}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  )
}

function safeParse(raw?: string): unknown {
  if (!raw) return null
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}
