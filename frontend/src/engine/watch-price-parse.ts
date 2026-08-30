import { normalizeUtterance } from './utterance.ts'

export type WatchPriceIntent =
  | { kind: 'on'; query: string }
  | { kind: 'off'; query?: string }
  | { kind: 'list' }

export function parseWatchPriceIntent(text: string): WatchPriceIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 180) return null
  if (/^\s*preiswache\s+(aus|weg|stop|stopp)\s*[.!?]*$/i.test(t)) return { kind: 'off' }
  if (/^\s*(?:preiswachen|welche\s+preiswachen)\s*[.!?]*$/i.test(t)) return { kind: 'list' }
  const offNamed =
    /^\s*preiswache\s+(?:für\s+)?(.+?)\s+(aus|weg)\s*[.!?]*$/i.exec(t) ||
    /^\s*(?:stopp(?:e)?|lösch(?:e)?)\s+(?:die\s+)?preiswache\s+(?:für\s+)?(.+?)\s*$/i.exec(t)
  if (offNamed) return { kind: 'off', query: offNamed[1].trim() }
  const on =
    /^\s*(?:sag\s+bescheid(?:\s+wenn)?|preiswache|wach(?:e)?)\s+(?:wenn\s+)?(.+?)(?:\s+im\s+angebot(?:\s+sind|\s+ist)?|\s+günstig(?:er)?(?:\s+wird)?)\s*$/i.exec(
      t,
    )
  if (on) return { kind: 'on', query: on[1].replace(/^wenn\s+/i, '').trim() }
  const noodles = /^\s*(?:instanudeln|nudeln\s+im\s+angebot)\s*$/i.exec(t)
  if (noodles) return { kind: 'on', query: 'Instanudeln' }
  return null
}
