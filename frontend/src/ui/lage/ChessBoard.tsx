const GLYPH: Record<string, string> = {
  k: '♚',
  q: '♛',
  r: '♜',
  b: '♝',
  n: '♞',
  p: '♟',
}

export function ChessBoard({ fen }: { fen: string }) {
  const place = (fen || '').split(' ')[0] || ''
  const rows = place.split('/')
  return (
    <div className="chess-board" role="img" aria-label="Schachbrett">
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
          const white = p === p.toUpperCase() && p !== ''
          return (
            <span key={`${x}-${y}`} className={`chess-sq ${dark ? 'dark' : 'light'} ${white ? 'w' : 'b'}`}>
              {p ? GLYPH[p.toLowerCase()] || p : ''}
            </span>
          )
        })
      })}
    </div>
  )
}
