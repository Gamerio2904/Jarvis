import { useEffect, useState } from 'react'
import {
  legalMovesFrom,
  loadFen,
  pieceAt,
  playEngineIfBlack,
  sideToMoveWhite,
  subscribeChess,
  turnLabel,
} from '../engine/chess.ts'
import { ChessBoard } from './lage/ChessBoard.tsx'

export function ChessMode({
  onClose,
  onCommand,
}: {
  onClose: () => void
  onCommand: (text: string) => void | Promise<string | void>
}) {
  const [fen, setFen] = useState(loadFen)
  const [selected, setSelected] = useState<string | null>(null)
  const [targets, setTargets] = useState<string[]>([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    playEngineIfBlack()
    setFen(loadFen())
    return subscribeChess(() => {
      setFen(loadFen())
      setSelected(null)
      setTargets([])
    })
  }, [])

  function pick(sq: string) {
    if (busy) return
    if (selected && targets.includes(sq)) {
      const move = `${selected}${sq}`
      setBusy(true)
      void Promise.resolve(onCommand(`${selected} ${sq}`)).finally(() => {
        setBusy(false)
        setFen(loadFen())
        setSelected(null)
        setTargets([])
      })
      void move
      return
    }
    const piece = pieceAt(fen, sq)
    if (!piece || !piece.white || !sideToMoveWhite(fen)) {
      setSelected(null)
      setTargets([])
      return
    }
    setSelected(sq)
    setTargets(legalMovesFrom(fen, sq))
  }

  function sendTyped() {
    const t = draft.trim()
    if (!t || busy) return
    setDraft('')
    setBusy(true)
    void Promise.resolve(onCommand(t)).finally(() => {
      setBusy(false)
      setFen(loadFen())
      setSelected(null)
      setTargets([])
    })
  }

  return (
    <div className="chess-mode" role="dialog" aria-labelledby="chess-title">
      <header className="chess-mode-bar">
        <div>
          <h2 id="chess-title">Schach</h2>
          <p>{turnLabel(fen)} Du Weiß, Jarvis Schwarz.</p>
        </div>
        <div className="drive-bar-actions">
          <button type="button" className="settings-close" onClick={onClose}>
            Fertig
          </button>
        </div>
      </header>
      <div className="chess-mode-board">
        <ChessBoard fen={fen} selected={selected} targets={targets} onSquare={pick} />
      </div>
      <p className="chess-mode-hint">
        Weiße Figur antippen — erlaubte Felder leuchten. Jarvis zieht Schwarz danach (ohne Engine).
      </p>
      <form
        className="chess-mode-form"
        onSubmit={(e) => {
          e.preventDefault()
          sendTyped()
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Zug, z. B. e2 e4"
          aria-label="Schachzug"
          disabled={busy}
        />
        <button type="submit" disabled={busy || !draft.trim()}>
          Ziehen
        </button>
      </form>
    </div>
  )
}
