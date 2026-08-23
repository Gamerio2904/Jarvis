import { notifyIdFromKey, requestNotifyPermission, scheduleNotify } from '../native/notify'
import { DEFAULT_OFFER_TERMS, parseOfferIntent } from './offer-parse'
import { parseEuroPrices } from './research-parse'
import { loadSettings, saveSettings } from './store'
import type { ToolMeta } from './tools'
import { fillResearchLinks } from './web-search'

export { parseOfferIntent } from './offer-parse'
export type { OfferIntent } from './offer-parse'

type OfferHit = {
  handled: boolean
  reply?: string
  tool?: ToolMeta
  lastTool?: string
}

function offerTool(action: string, label: string): ToolMeta {
  return { tool_status: 'executed', tool: 'offer', action, label }
}

function readWatch(): string[] {
  try {
    const raw = loadSettings().offer_watch_json
    if (!raw) return []
    const arr = JSON.parse(raw) as unknown
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string' && x.trim().length > 0) : []
  } catch {
    return []
  }
}

function writeWatch(terms: string[]) {
  const uniq = [...new Set(terms.map((t) => t.trim().toLowerCase()).filter(Boolean))]
  saveSettings({ offer_watch_json: JSON.stringify(uniq) })
}

export async function handleOffer(_conversationId: string, text: string): Promise<OfferHit> {
  const intent = parseOfferIntent(text)
  if (!intent) return { handled: false }

  if (intent.kind === 'unwatch') {
    writeWatch([])
    return {
      handled: true,
      reply: 'Watchlist aus. Ich benachrichtige nicht mehr zu Instanudeln.',
      tool: offerTool('off', 'Watchlist aus'),
      lastTool: 'offer',
    }
  }

  if (intent.kind === 'watch') {
    const extra = (intent.query || 'Instanudeln').trim()
    writeWatch([...DEFAULT_OFFER_TERMS, extra])
    const ping = await armDailyCheck()
    return {
      handled: true,
      reply: `Bescheid bei Instanudeln im Angebot. ${ping} Keine Lidl- oder Rewe-App — nur die vorhandene Suche. Ohne Treffer erfinde ich kein Angebot.`,
      tool: offerTool('watch', 'Watchlist'),
      lastTool: 'offer',
    }
  }

  if (intent.kind === 'status') {
    const watch = readWatch()
    const last = loadSettings().last_offer_hit.trim()
    if (!watch.length) {
      return {
        handled: true,
        reply: 'Keine Watchlist. Sagen Sie „Sag Bescheid wenn Instanudeln im Angebot sind“.',
        tool: offerTool('status', 'Watchlist leer'),
        lastTool: 'offer',
      }
    }
    return {
      handled: true,
      reply: last
        ? `Watchlist: ${watch.join(', ')}. Letzter Treffer: ${last}`
        : `Watchlist: ${watch.join(', ')}. Noch kein belegter Treffer.`,
      tool: offerTool('status', 'Watchlist'),
      lastTool: 'offer',
    }
  }

  return checkNow(intent.query || 'Instanudeln')
}

export async function checkOfferWatch(force = false): Promise<string | null> {
  const watch = readWatch()
  if (!watch.length) return null
  const lastAt = Date.parse(loadSettings().last_offer_at || '')
  if (!force && Number.isFinite(lastAt) && Date.now() - lastAt < 6 * 60 * 60_000) return null
  const hit = await searchOffer(watch[0] || 'Instanudeln')
  saveSettings({ last_offer_at: new Date().toISOString() })
  if (!hit) return null
  saveSettings({ last_offer_hit: hit.slice(0, 180) })
  await requestNotifyPermission()
  await scheduleNotify({
    id: notifyIdFromKey('offer-noodles'),
    title: 'Angebot',
    body: hit,
    at: new Date(Date.now() + 2_000),
    alarm: false,
  })
  return hit
}

async function checkNow(query: string): Promise<OfferHit> {
  if (!loadSettings().research_opt_in) {
    return {
      handled: true,
      reply:
        'Ohne Internet-Research kein Angebotscheck. Unter Einstellungen → Netz einschalten. Ich erfinde keinen Preis.',
      tool: offerTool('ask', 'Research aus'),
      lastTool: 'offer',
    }
  }
  const hit = await searchOffer(query)
  saveSettings({ last_offer_at: new Date().toISOString(), last_offer_hit: hit || '' })
  if (!hit) {
    return {
      handled: true,
      reply: `Kein belegtes Angebot für ${query}. Ich sage nicht „ist im Angebot“, wenn die Suche nichts hergibt.`,
      tool: offerTool('empty', 'Kein Treffer'),
      lastTool: 'offer',
    }
  }
  return {
    handled: true,
    reply: hit,
    tool: offerTool('hit', 'Angebot'),
    lastTool: 'offer',
  }
}

async function searchOffer(query: string): Promise<string | null> {
  const web = await fillResearchLinks(`${query} Angebot Deutschland mydealz`, '', {
    query: `${query} Angebot`,
    used: false,
    status: 'empty',
    sources: [],
  })
  const sources = web.sources || []
  if (!sources.length) return null
  const blob = sources.map((s) => `${s.title} ${s.snippet}`).join(' ')
  if (!/\b(angebot|rabatt|promo|%\s*günstiger|im\s+sale)\b/i.test(blob)) return null
  const prices = parseEuroPrices(blob)
  const src = sources[0]
  const price = prices[0] || ''
  return `${query} taucht als Angebot auf: ${src.title}${price ? `, ${price}` : ''}. ${src.url}`
}

async function armDailyCheck(): Promise<string> {
  const perm = await requestNotifyPermission()
  const next = new Date()
  next.setHours(8, 0, 0, 0)
  if (next.getTime() <= Date.now()) next.setDate(next.getDate() + 1)
  const scheduled = await scheduleNotify({
    id: notifyIdFromKey('offer-noodles-daily'),
    title: 'Angebot prüfen',
    body: 'Jarvis prüft Instanudeln über die vorhandene Suche.',
    at: next,
    alarm: false,
    recur: 'daily',
  })
  return perm && scheduled.ok
    ? 'Täglich gegen 8 Uhr ein Blick, plus sofort wenn ein Treffer da ist.'
    : 'Gespeichert. Benachrichtigung unter Android erlauben, sonst kein Ping.'
}
