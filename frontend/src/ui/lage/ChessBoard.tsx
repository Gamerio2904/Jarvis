/** Eigene, grobe Staunton-Silhouetten. Keine fremden SVG-Pfade. */
function Piece({ code }: { code: string }) {
  const white = code === code.toUpperCase()
  const fill = white ? '#f7f4ee' : '#14110e'
  const kind = code.toLowerCase()
  return (
    <svg className="chess-glyph" viewBox="0 0 80 80" aria-hidden>
      <g fill={fill}>
        {kind === 'p' ? (
          <>
            <circle cx="40" cy="18" r="12" />
            <path d="M31 30c1 10 0 18-6 26h30c-6-8-7-16-6-26z" />
            <path d="M18 62h44l-3 8H21z" />
          </>
        ) : null}
        {kind === 'r' ? (
          <path d="M14 14h12v10h8V14h12v10h8V14h12v16H14zm6 16h40l-3 28H23zm-4 30h44v8H16z" />
        ) : null}
        {kind === 'n' ? (
          <>
            <path d="M22 70l6-20c2-14 8-22 6-32 4-6 14-8 18-2l8-10-2 14c10 2 16 12 12 22-4 2-8 0-10-4 6 8 2 16-4 20l-2 12H22z" />
            <circle cx="48" cy="28" r="3" fill={white ? '#14110e' : '#f7f4ee'} />
            <path d="M16 68h48v8H16z" />
          </>
        ) : null}
        {kind === 'b' ? (
          <>
            <circle cx="40" cy="10" r="5" />
            <path fillRule="evenodd" d="M40 16c14 12 18 22 18 30a18 18 0 0 1-36 0c0-8 4-18 18-30zm-3 16h6v16h-6z" />
            <path d="M24 64h32l-3 8H27z" />
          </>
        ) : null}
        {kind === 'q' ? (
          <>
            <circle cx="14" cy="20" r="5" />
            <circle cx="28" cy="12" r="5" />
            <circle cx="40" cy="8" r="5" />
            <circle cx="52" cy="12" r="5" />
            <circle cx="66" cy="20" r="5" />
            <path d="M12 24l8 16h40l8-16-12 8-8-12-8 14-8-14-8 12z" />
            <path d="M24 42h32l-4 22H28z" />
            <path d="M16 66h48v8H16z" />
          </>
        ) : null}
        {kind === 'k' ? (
          <>
            <path d="M34 4h12v10h10v12H46v10H34V26H24V14h10z" />
            <path d="M22 40h36l-4 24H26z" />
            <path d="M16 66h48v8H16z" />
          </>
        ) : null}
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
