/** Eigene Silhouetten. Die Systemschrift auf dem Tablet hat die Schachzeichen oft nicht, dann bleibt nur das Karo. */
function Piece({ code }: { code: string }) {
  const white = code === code.toUpperCase()
  const fill = white ? '#f4f1ea' : '#12160f'
  const stroke = white ? '#12160f' : '#f4f1ea'
  const kind = code.toLowerCase()
  return (
    <svg className="chess-glyph" viewBox="0 0 40 40" aria-hidden>
      <g fill={fill} stroke={stroke} strokeWidth="1.4" strokeLinejoin="round">
        {kind === 'p' ? <circle cx="20" cy="16" r="6" /> : null}
        {kind === 'r' ? <path d="M10 12h4v4h3v-4h6v4h3v-4h4v16H10z" /> : null}
        {kind === 'n' ? <path d="M12 28c2-10 4-14 10-16 2 4 1 6-1 8 4 0 8 2 8 6H14c0-2 2-4 4-4-3 1-5 3-6 6z" /> : null}
        {kind === 'b' ? <path d="M20 8c5 6 7 10 7 14a7 7 0 0 1-14 0c0-4 2-8 7-14z" /> : null}
        {kind === 'q' ? <path d="M8 28l3-14 5 8 4-12 4 12 5-8 3 14z" /> : null}
        {kind === 'k' ? (
          <path d="M18 8h4v4h4v4h-4v4h-4v-4h-4v-4h4zM12 24h16l-2 6H14z" />
        ) : null}
        <path d="M11 32h18v3H11z" />
      </g>
    </svg>
  )
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1']

export function ChessBoard({
  fen,
  selected = null,
  targets = [],
  onSquare,
  showCoords = true,
}: {
  fen: string
  selected?: string | null
  targets?: string[]
  onSquare?: (sq: string) => void
  showCoords?: boolean
}) {
  const place = (fen || '').split(' ')[0] || ''
  const rows = place.split('/')
  const hit = new Set(targets)
  const board = (
    <div className="chess-board" role={onSquare ? 'grid' : 'img'} aria-label="Schachbrett">
      {rows.map((row, y) => {
        const cells: string[] = []
        for (const ch of row) {
          if (/\d/.test(ch)) {
            for (let i = 0; i < Number(ch); i++) cells.push('')
          } else cells.push(ch)
        }
        while (cells.length < 8) cells.push('')
        return cells.slice(0, 8).map((p, x) => {
          const dark = (x + y) % 2 === 1
          const white = p !== '' && p === p.toUpperCase()
          const sq = `${FILES[x]}${RANKS[y]}`
          const cls = [
            'chess-sq',
            dark ? 'dark' : 'light',
            p ? (white ? 'w' : 'b') : '',
            selected === sq ? 'is-sel' : '',
            hit.has(sq) ? 'is-tgt' : '',
            onSquare ? 'can-click' : '',
          ]
            .filter(Boolean)
            .join(' ')
          const inner = p ? <Piece code={p} /> : null
          if (onSquare) {
            return (
              <button
                key={sq}
                type="button"
                className={cls}
                aria-label={sq}
                onClick={() => onSquare(sq)}
              >
                {inner}
              </button>
            )
          }
          return (
            <span key={sq} className={cls}>
              {inner}
            </span>
          )
        })
      })}
    </div>
  )
  if (!showCoords) return board
  return (
    <div className="chess-wrap">
      <div className="chess-ranks" aria-hidden>
        {RANKS.map((r) => (
          <span key={r}>{r}</span>
        ))}
      </div>
      {board}
      <span className="chess-corner" aria-hidden />
      <div className="chess-files" aria-hidden>
        {FILES.map((f) => (
          <span key={f}>{f}</span>
        ))}
      </div>
    </div>
  )
}
