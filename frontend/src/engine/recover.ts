import { agentById } from './agents/catalog.ts'
import type { AgentResult } from './agents/types.ts'
import type { RouteCtx } from './route-types.ts'
import { fetchDwHome, fetchTagesschauHome } from './news.ts'
import { dropLayerCache, fetchLayer, parseGlobeLayerPhrase, replyFor } from './globe-layers.ts'
import { lookupOmdb, watchScoreLine } from './omdb.ts'
import { handleWeather } from './weather.ts'

/** Höchstens zwei Alternativen nach dem ersten Fail — drei Versuche insgesamt. */
export const RECOVER_CAP = 2

export type RecoverHit = { reply: string; source: string }

export type RecoverStep = {
  id: string
  label: string
  run: () => Promise<RecoverHit | null>
}

export function announceSwitch(from: string, next: string): string {
  const a = (from || 'Die Quelle').replace(/\s+/g, ' ').trim()
  const b = (next || 'eine andere Methode').replace(/\s+/g, ' ').trim()
  return `${a} geht nicht. Ich versuche ${b}.`
}

export function announceRetry(from: string): string {
  const a = (from || 'Die Quelle').replace(/\s+/g, ' ').trim()
  return `${a} geht nicht. Ich lade neu.`
}

export function announceBlocked(): string {
  return 'Der Dienst blockt. Ich lade neu.'
}

export function announceNoKey(): string {
  return 'Ohne diesen Schlüssel gehe ich den anderen Weg.'
}

export function announceQuotaWait(): string {
  return 'Ich warte kurz und versuche neu.'
}

export function announceGiveUp(tried: string[]): string {
  const names = tried.map((t) => t.replace(/\s+/g, ' ').trim()).filter(Boolean)
  if (names.length >= 2) return `Geht nicht. ${names[0]} und ${names[1]} schweigen. Kein Raten.`
  if (names.length === 1) return `Geht nicht. ${names[0]} schweigt. Kein Raten.`
  return 'Geht nicht. Kein Raten.'
}

export function writeHasNoRecover(id: string): boolean {
  const agent = agentById(id)
  return !agent || agent.sideEffect !== 'read'
}

export function needsRecover(id: string, result: AgentResult): boolean {
  if (result.aborted) return false
  if (writeHasNoRecover(id)) return false
  if (result.failed) return true
  if (result.tool?.tool_status === 'error') return true
  if (!result.handled) return true
  return false
}

function sourceLabel(id: string): string {
  if (id === 'news') return 'Tagesschau'
  if (id === 'hud') return 'Die Schicht'
  if (id === 'watchlist') return 'OMDb'
  if (id === 'weather') return 'Open-Meteo'
  if (id === 'flights') return 'OpenSky'
  return agentById(id)?.label || id
}

export function stepsFor(id: string, ctx: RouteCtx): RecoverStep[] {
  if (writeHasNoRecover(id)) return []
  if (id === 'news') {
    return [
      {
        id: 'news-bust',
        label: 'Tagesschau neu',
        run: async () => {
          const got = await fetchTagesschauHome(true)
          if (!got.hits.length) return null
          return { reply: `Die Lage laut Tagesschau: ${got.hits.join(' ')}`, source: 'Tagesschau' }
        },
      },
      {
        id: 'news-dw',
        label: 'DW',
        run: async () => {
          const got = await fetchDwHome()
          if (!got.hits.length) return null
          return { reply: `Laut DW: ${got.hits.join(' ')}`, source: 'DW' }
        },
      },
    ]
  }
  if (id === 'hud') {
    const phrase = parseGlobeLayerPhrase(ctx.text)
    if (phrase?.kind !== 'layer') return []
    const layer = phrase.layer
    return [
      {
        id: 'layer-bust',
        label: 'lade neu',
        run: async () => {
          dropLayerCache(layer)
          const got = await fetchLayer(layer)
          if (got.error && !got.pins.length) return null
          return { reply: replyFor(got), source: got.source }
        },
      },
    ]
  }
  if (id === 'watchlist') {
    const title = ctx.text.replace(/^\s*watchliste\s*[:\s]\s*/i, '').trim()
    if (!title || title.length > 80) return []
    return [
      {
        id: 'omdb-bust',
        label: 'OMDb neu',
        run: async () => {
          const got = await lookupOmdb(title)
          if (got.ok) {
            const line = watchScoreLine({
              critic: got.hit.tomatoes,
              audience: got.hit.audience,
              imdbScore: got.hit.imdb,
            })
            return { reply: `${got.hit.title}: ${line.scores}.`, source: 'OMDb' }
          }
          if (got.needKey) return { reply: `${title}: Publikum —. ${announceNoKey()}`, source: 'OMDb' }
          return null
        },
      },
    ]
  }
  if (id === 'weather') {
    return [
      {
        id: 'weather-bust',
        label: 'Open-Meteo neu',
        run: async () => {
          const got = await handleWeather(ctx.text)
          if (!got.handled || !got.reply) return null
          if (got.tool?.tool_status === 'error') return null
          return { reply: got.reply, source: 'Open-Meteo' }
        },
      },
    ]
  }
  return []
}

export async function runRecover(
  id: string,
  ctx: RouteCtx,
): Promise<{ reply: string; switched: boolean } | null> {
  const steps = stepsFor(id, ctx).slice(0, RECOVER_CAP)
  if (!steps.length) return null
  const parts: string[] = []
  const tried = [sourceLabel(id)]
  let prev = sourceLabel(id)
  let switched = false
  for (const step of steps) {
    const retry = /bust|neu|lade/i.test(step.id) || /neu|lade/i.test(step.label)
    parts.push(retry && prev === sourceLabel(id) ? announceRetry(prev) : announceSwitch(prev, step.label))
    switched = true
    tried.push(step.label)
    const hit = await step.run()
    if (hit?.reply.trim()) {
      parts.push(hit.reply.trim())
      return { reply: parts.join(' '), switched }
    }
    prev = step.label
  }
  parts.push(announceGiveUp(tried))
  return { reply: parts.join(' '), switched }
}
