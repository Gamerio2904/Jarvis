const GLYPH: Record<string, string> = {
  k: '♚',
  q: '♛',
  r: '♜',
  b: '♝',
  n: '♞',
  p: '♟',
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
          const inner = p ? GLYPH[p.toLowerCase()] || p : ''
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
