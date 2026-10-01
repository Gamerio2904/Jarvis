/** Sätze für den Entwurf. Der Executor bleibt die Tischplatte. */

import { loadSettings } from './store.ts'
import { loadScan } from './room-scan.ts'
import { artFromName, type Art } from './entwurf-muster.ts'

export type EntwurfIntent =
  | { kind: 'entwurf'; work: string | null }
  | { kind: 'inspiration'; art: Art | null }
  | { kind: 'draft_pick'; index: 0 | 1 | 2 }
  | { kind: 'draft_close' }

const BLOCK = new Set(['schreibt', 'warten', 'überarbeitet', 'läuft'])

export function ablaufBlocksDraft(status = loadSettings().ablauf_status): boolean {
  if (BLOCK.has(status)) return true
  return loadSettings().plan_phase === 'live'
}

export function scanBlocksDraft(): boolean {
  const phase = loadScan().phase
  return phase === 'live' || phase === 'model'
}

/** Rahmen liegen, solange die Zeile gezeigt wird und Ablauf und Scan sie nicht zudecken. */
export function draftFramesOpen(): boolean {
  const s = loadSettings()
  if (!s.entwurf_id) return false
  if (s.entwurf_status !== 'offen' && s.entwurf_status !== 'gewählt') return false
  if (scanBlocksDraft() || ablaufBlocksDraft()) return false
  return true
}

const APP = /^\s*entwirf(?:e)?\s+eine\s+app\s*:\s*([\s\S]*)$/i
const COLON = /^\s*entwirf(?:e)?\s*:\s*([\s\S]*)$/i
const DAS = /^\s*entwirf(?:e)?\s+das\s*[.!?]?$/i
const CLOSE = /^\s*entwurf\s+zu\s*[.!?]?$/i
const PICK = /^\s*die\s+(erste|zweite|dritte)\s*[.!?]?$/i
const INSPIRATION =
  /^\s*(?:zeig(?:e)?(?:\s+mir)?\s+)?(?:hast\s+du\s+)?(?:inspiration|animationen)\s+(?:zum|zur|zu|für|fuer)\s+(?:einen?\s+|eine\s+|dem\s+|der\s+|das\s+|den\s+)?(.+?)\s*[.!?]?$/i

const PICK_INDEX: Record<string, 0 | 1 | 2> = { erste: 0, zweite: 1, dritte: 2 }

export function parseEntwurfIntent(text: string): EntwurfIntent | null {
  const t = text.trim()
  if (!t) return null
  if (CLOSE.test(t)) return { kind: 'draft_close' }
  if (DAS.test(t)) return { kind: 'entwurf', work: null }
  const app = APP.exec(t)
  if (app) return { kind: 'entwurf', work: (app[1] || '').trim().slice(0, 2000) }
  const colon = COLON.exec(t)
  if (colon) return { kind: 'entwurf', work: (colon[1] || '').trim().slice(0, 2000) }
  const inspiration = INSPIRATION.exec(t)
  if (inspiration) return { kind: 'inspiration', art: artFromName(inspiration[1] || '') }
  const pick = PICK.exec(t)
  if (pick && draftFramesOpen()) {
    return { kind: 'draft_pick', index: PICK_INDEX[(pick[1] || '').toLowerCase()] }
  }
  return null
}
