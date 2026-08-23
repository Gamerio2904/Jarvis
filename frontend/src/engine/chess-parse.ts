import { normalizeUtterance } from './utterance.ts'

export type ChessIntent =
  | { kind: 'new' }
  | { kind: 'status' }
  | { kind: 'move'; token: string }
  | { kind: 'lichess'; user: string }

const UCI = /\b([a-h][1-8])[-x]?([a-h][1-8])([qrbn])?\b/i
const SAN = /\b((?:O-O-O|O-O)|(?:[NBRQK])?[a-h]?[1-8]?x?[a-h][1-8](?:=[NBRQ])?)\b/

export function parseChessIntent(text: string): ChessIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 160) return null
  if (!/\bschach\b/i.test(t) && !/^\s*(?:[a-h][1-8][-x]?[a-h][1-8]|O-O)/i.test(t)) return null
  if (/\b(neu|reset|anfang|neues\s+spiel)\b/i.test(t)) return { kind: 'new' }
  const lich = /\blichess\b/i.exec(t)
  if (lich) {
    const user = t.replace(/.*lichess/i, '').replace(/[?.!]/g, '').trim().split(/\s+/)[0] || ''
    if (!user) return { kind: 'status' }
    return { kind: 'lichess', user }
  }
  const uci = UCI.exec(t)
  if (uci) return { kind: 'move', token: `${uci[1].toLowerCase()}${uci[2].toLowerCase()}${uci[3] ? uci[3].toLowerCase() : ''}` }
  const san = SAN.exec(t)
  if (san && /\bschach\b/i.test(t)) return { kind: 'move', token: san[1] }
  if (/\b(stellung|brett|wer\s+ist\s+am\s+zug)\b/i.test(t)) return { kind: 'status' }
  if (/^\s*schach\s*[.!?]*$/i.test(t)) return { kind: 'status' }
  return null
}
