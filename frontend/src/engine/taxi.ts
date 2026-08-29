import { listMemory, loadSettings, saveSettings } from './store.ts'
import type { ToolMeta } from './tools.ts'
import { findContactRow, isCommNo, isCommYes } from './places-parse.ts'
import { parseTaxiIntent, type TaxiApp } from './taxi-parse.ts'
import { openExternal, placeCall } from '../native/device.ts'
import { hasChain, popChain } from './chain.ts'

export { parseTaxiIntent } from './taxi-parse.ts'

const FORBIDDEN = /zugestellt|taxi ist unterwegs|habe bestellt|ist bestellt/i

type PendingTaxi = {
  destLat?: number
  destLon?: number
  destLabel?: string
}

type TaxiHit = {
  handled: boolean
  reply?: string
  tool?: ToolMeta
  lastTool?: string
}

export async function handleTaxi(conversationId: string, text: string): Promise<TaxiHit> {
  const pending = readTaxi()
  if (pending) {
    if (isCommNo(text)) {
      writeTaxi(null)
      if (hasChain()) {
        saveSettings({ last_step_tool: 'chain_ask' })
        return packAsk('Taxi nicht. Den Rest der Kette trotzdem?')
      }
      return packAsk('Taxi abgebrochen. Bestellt habe ich nicht.')
    }
    if (isCommYes(text, 'call')) return finishTaxi(conversationId, pending)
    return packAsk('Taxi: Ja öffnet Anruf oder App. Bestellt und bezahlt habe ich nicht.')
  }

  const intent = parseTaxiIntent(text)
  if (!intent) return { handled: false }

  const dest = destFromPoi(intent.dest)
  writeTaxi(dest)
  const app = (loadSettings().taxi_app || 'call') as TaxiApp
  if (app === 'ask') {
    return packAsk(
      dest.destLabel
        ? `Taxi nach ${dest.destLabel}. Anruf Kontakt Taxi, Uber oder FreeNow? Bestellt habe ich nichts.`
        : 'Taxi: Anruf Kontakt Taxi, Uber oder FreeNow? Bestellt habe ich nichts.',
    )
  }
  return packAsk(confirmLine(app, dest))
}

async function finishTaxi(conversationId: string, pending: PendingTaxi): Promise<TaxiHit> {
  writeTaxi(null)
  const app = (loadSettings().taxi_app || 'call') as TaxiApp
  let reply = ''
  if (app === 'uber' || app === 'freenow') {
    const url = rideUrl(app, pending)
    const opened = await openExternal(url)
    reply = opened.ok
      ? `${app === 'uber' ? 'Uber' : 'FreeNow'} ist auf. Ziel können Sie in der App prüfen. Bestellt und bezahlt habe ich nicht.`
      : `Die App geht hier nicht auf. ${await callTaxiFallback()}`
  } else {
    reply = await callTaxiFallback()
  }
  if (FORBIDDEN.test(reply)) reply = 'Ich öffne nur Anruf oder App. Bestellt habe ich nicht.'
  const extra = await runNextInChain(conversationId)
  if (extra) reply = `${reply}\n\n${extra}`
  return {
    handled: true,
    reply,
    tool: { tool_status: 'executed', tool: 'taxi', action: 'open', label: 'Taxi' },
    lastTool: 'taxi',
  }
}

async function callTaxiFallback(): Promise<string> {
  const rows = await listMemory()
  const hit = findContactRow(rows, 'taxi') || findContactRow(rows, 'Taxi')
  if (!hit) {
    return 'Kein Kontakt „Taxi“ und keine App. Wen soll ich anrufen, oder welche App? Bestellt habe ich nicht.'
  }
  const res = await placeCall(hit.value)
  if (res.ok) return 'Ich rufe an (Kontakt Taxi). Bestellt und bezahlt habe ich nicht.'
  return res.message || 'Anruf nicht gestartet. Bestellt habe ich nicht.'
}

async function runNextInChain(conversationId: string): Promise<string | null> {
  const next = popChain()
  if (!next) return null
  const { routeRegistry } = await import('./registry.ts')
  const hit = await routeRegistry(conversationId, next)
  return hit?.reply || null
}

function confirmLine(app: TaxiApp, dest: PendingTaxi): string {
  const where = dest.destLabel ? ` Ziel: ${dest.destLabel}.` : ''
  if (app === 'uber') return `Uber öffnen?${where} Bestellt und bezahlt habe ich nicht. Ja oder nein.`
  if (app === 'freenow') return `FreeNow öffnen?${where} Bestellt und bezahlt habe ich nicht. Ja oder nein.`
  return `Ich rufe den Kontakt Taxi an.${where} Bestellt habe ich nicht. Ja oder nein.`
}

function destFromPoi(pref?: 'poi' | 'here'): PendingTaxi {
  try {
    const raw = loadSettings().last_poi_json
    if (pref !== 'here' && raw) {
      const parsed = JSON.parse(raw) as { hits?: Array<{ name?: string; lat?: number; lon?: number }> }
      const hit = parsed.hits?.[0]
      if (hit?.lat && hit?.lon) {
        return { destLat: hit.lat, destLon: hit.lon, destLabel: hit.name || 'letzter Ort' }
      }
    }
  } catch {
    /* ignore */
  }
  const lat = Number(loadSettings().last_lat)
  const lon = Number(loadSettings().last_lon)
  if (Number.isFinite(lat) && Number.isFinite(lon)) return { destLat: lat, destLon: lon, destLabel: 'hier' }
  return {}
}

function rideUrl(app: TaxiApp, dest: PendingTaxi): string {
  if (app === 'uber') {
    const q = new URLSearchParams({ action: 'setPickup', pickup: 'my_location' })
    if (dest.destLat != null && dest.destLon != null) {
      q.set('dropoff[latitude]', String(dest.destLat))
      q.set('dropoff[longitude]', String(dest.destLon))
    }
    return `https://m.uber.com/ul/?${q}`
  }
  return 'https://m.free-now.com/'
}

function readTaxi(): PendingTaxi | null {
  try {
    const raw = loadSettings().last_taxi_json
    if (!raw) return null
    return JSON.parse(raw) as PendingTaxi
  } catch {
    return null
  }
}

function writeTaxi(p: PendingTaxi | null) {
  saveSettings({
    last_taxi_json: p ? JSON.stringify(p) : '',
    last_step_tool: p ? 'taxi' : loadSettings().last_step_tool,
  })
}

function packAsk(reply: string): TaxiHit {
  return {
    handled: true,
    reply,
    tool: { tool_status: 'executed', tool: 'taxi', action: 'ask', label: 'Taxi' },
    lastTool: 'taxi',
  }
}
