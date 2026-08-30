import { parseEuroPrices, compareShopSources, hostOf } from './research-parse.ts'
import { getText } from './http-json.ts'
import { parseWatchPriceIntent } from './watch-price-parse.ts'
import {
  addPriceWatch,
  deletePriceWatch,
  listPriceWatches,
  loadSettings,
  putPriceWatch,
  saveSettings,
} from './store.ts'
import { notifyIdFromKey, scheduleNotify } from '../native/notify.ts'
import type { ToolMeta } from './tools.ts'

export { parseWatchPriceIntent }

const UA = { Accept: 'text/html', 'User-Agent': 'Jarvis/6.91.0 (local.jarvis.app)' }

async function peekPrice(query: string): Promise<{ price: string; source: string; url: string }> {
  const shops = compareShopSources(query)
  const first = shops[0]
  if (!first) return { price: '', source: '', url: '' }
  try {
    const { status, text } = await getText(first.url, UA)
    if (status < 200 || status >= 300) return { price: '', source: first.title, url: first.url }
    const euros = parseEuroPrices(text.slice(0, 8000))
    return { price: euros[0] || '', source: hostOf(first.url) || first.title, url: first.url }
  } catch {
    return { price: '', source: first.title, url: first.url }
  }
}

export async function handleWatchPrice(
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  const intent = parseWatchPriceIntent(text)
  if (!intent) return { handled: false }
  const s = loadSettings()
  if (intent.kind === 'list') {
    const rows = await listPriceWatches()
    if (!rows.length) {
      return { handled: true, reply: 'Keine Preiswache. Opt-in unter Netz, dann z. B. Instanudeln.', lastTool: 'watch-price' }
    }
    return {
      handled: true,
      reply: rows.map((r) => `${r.query}${r.last_price ? ` · ${r.last_price}` : ''}`).join('\n'),
      lastTool: 'watch-price',
    }
  }
  if (intent.kind === 'off') {
    const rows = await listPriceWatches()
    if (intent.query) {
      const q = intent.query.toLowerCase()
      const hit = rows.find((r) => r.query.toLowerCase().includes(q))
      if (hit) await deletePriceWatch(hit.id)
      if (!rows.filter((r) => r.id !== hit?.id).length) saveSettings({ price_watch_on: false })
      return { handled: true, reply: hit ? `Preiswache für ${hit.query} aus.` : 'Diese Wache lag nicht.', lastTool: 'watch-price' }
    }
    for (const r of rows) await deletePriceWatch(r.id)
    saveSettings({ price_watch_on: false })
    return { handled: true, reply: 'Preiswache aus. Kein stilles Pollen mehr.', lastTool: 'watch-price' }
  }
  if (!s.research_opt_in) {
    return {
      handled: true,
      reply: 'Preiswache braucht Netz-Suche an. Unter Einstellungen Internet-Research, sonst erfinde ich keine Preise.',
      lastTool: 'watch-price',
    }
  }
  const row = await addPriceWatch(intent.query)
  saveSettings({ price_watch_on: true })
  const peek = await peekPrice(intent.query)
  if (peek.price) {
    await putPriceWatch({ ...row, last_price: peek.price, last_source: peek.source, last_url: peek.url })
  }
  return {
    handled: true,
    reply: peek.price
      ? `Wache für ${intent.query} an. Jetzt ${peek.price} bei ${peek.source}. Bescheid nur bei Treffer mit Quelle.`
      : `Wache für ${intent.query} an. Noch kein Euro im Snippet — ich erfinde keinen Preis.`,
    tool: { tool_status: 'executed', tool: 'watch-price', action: 'on', label: 'Preiswache' },
    lastTool: 'watch-price',
  }
}

export async function tickPriceWatch(): Promise<void> {
  const s = loadSettings()
  if (!s.price_watch_on || !s.research_opt_in) return
  const at = Date.parse(s.last_price_watch_at || '')
  if (Number.isFinite(at) && Date.now() - at < 30 * 60 * 1000) return
  saveSettings({ last_price_watch_at: new Date().toISOString() })
  const rows = await listPriceWatches()
  for (const row of rows) {
    const peek = await peekPrice(row.query)
    if (!peek.price) continue
    const changed = row.last_price && peek.price !== row.last_price
    await putPriceWatch({ ...row, last_price: peek.price, last_source: peek.source, last_url: peek.url })
    if (changed) {
      await scheduleNotify({
        id: notifyIdFromKey(`price-${row.id}`),
        title: row.query,
        body: `${peek.price} · ${peek.source}`,
        at: new Date(),
      })
    }
  }
}
