import { openDialer, openSms } from '../native/device'
import {
  displayPlaceName,
  extractPhone,
  findContactRow,
  isBarePlaceAnswer,
  isHomeName,
  isRelationName,
  looksLikeAddress,
  looksLikePhone,
  mapsDirUrl,
  parsePlaceNav,
  parsePlaceRecall,
  parsePlaceWrite,
} from './places-parse'
import { addReminder, listMemory, loadSettings, persistLastList, saveSettings, upsertMemory } from './store'
import type { ToolMeta } from './tools'

export {
  mapsDirUrl,
  parsePlaceNav,
  parsePlaceRecall,
  parsePlaceWrite,
} from './places-parse'

export type MapsRoute = { title: string; url: string; destination: string }

function mapsTool(action: string, label: string, routes: MapsRoute[], preview?: string): ToolMeta {
  const first = routes[0]
  return {
    tool_status: 'executed',
    tool: 'maps',
    action,
    label,
    preview: preview || first?.title || '',
    result: {
      url: first?.url || '',
      destination: first?.destination || '',
      routes,
    },
  }
}

async function places(): Promise<Array<{ name: string; place: string }>> {
  const rows = await listMemory('place')
  return rows
    .filter((r) => r.value.trim())
    .map((r) => ({ name: r.key, place: r.value.trim() }))
}

async function findPlace(name: string): Promise<{ name: string; place: string } | undefined> {
  const key = name.trim().toLowerCase()
  const rows = await places()
  return rows.find((r) => r.name === key || r.name.includes(key) || key.includes(r.name))
}

function routeOf(name: string, place: string, mode: 'driving' | 'walking' | 'transit' = 'driving'): MapsRoute {
  const title = displayPlaceName(name)
  return { title, destination: place, url: mapsDirUrl(place, mode) }
}

function routeReply(name: string, place: string): string {
  const who = displayPlaceName(name)
  const same = who.toLowerCase() === place.toLowerCase()
  return same
    ? `Route nach ${place}. In Google Maps öffnen.`
    : `Route zu ${who} (${place}). In Google Maps öffnen.`
}

export async function handlePlaces(
  conversationId: string,
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  const s = loadSettings()

  if (s.last_step_tool === 'sms_ask' && s.last_step_title) {
    const who = s.last_step_title
    const body = s.last_step_when || ''
    const num = extractPhone(text)
    if (num) {
      await upsertMemory(who, num, 'contact', conversationId)
      const opened = await openSms(num, body)
      return {
        handled: true,
        reply: opened.ok
          ? `SMS an ${displayPlaceName(who)} vorbereitet. Senden Sie selbst.`
          : `Nummer liegt. SMS-App nicht geöffnet. Ich habe nichts versendet.`,
        tool: {
          tool_status: 'executed',
          tool: 'maps',
          action: 'sms',
          label: 'SMS',
          preview: who,
          result: { sms: `sms:${num}`, name: who, body },
        },
        lastTool: 'maps',
      }
    }
  }

  if (s.last_step_tool === 'phone_ask' && s.last_step_title) {
    const who = s.last_step_title
    const num = extractPhone(text)
    if (num) {
      await upsertMemory(who, num, 'contact', conversationId)
      const opened = await openDialer(num)
      return {
        handled: true,
        reply: opened.ok
          ? `Wählhilfe für ${displayPlaceName(who)} — ${num}. Verbunden erst, wenn Sie abheben.`
          : `Nummer ${displayPlaceName(who)} — ${num}. Wählhilfe nicht geöffnet.`,
        tool: {
          tool_status: 'executed',
          tool: 'maps',
          action: 'call',
          label: 'Anrufen',
          preview: who,
          result: { tel: `tel:${num}`, name: who },
        },
        lastTool: 'maps',
      }
    }
    const aliasName = text.trim().replace(/[.!?]+$/g, '')
    if (/^[A-ZÄÖÜa-zäöüß][\wÄÖÜäöüß-]{1,24}$/.test(aliasName) && !looksLikePhone(aliasName)) {
      const alias = aliasName.toLowerCase()
      if (alias !== who) {
        await upsertMemory(`alias:${who}`, alias, 'fact', conversationId)
        await upsertMemory(`alias:${alias}`, who, 'fact', conversationId)
        return {
          handled: true,
          reply: `Also ${displayPlaceName(alias)}. Welche Nummer? Sage z. B. „${displayPlaceName(alias)}, Tel …“.`,
          tool: { tool_status: 'executed', tool: 'maps', action: 'ask', label: 'Nummer fehlt', preview: alias },
          lastTool: 'phone_ask',
        }
      }
    }
  }

  if (s.last_step_tool === 'maps_ask' && s.last_step_title && isBarePlaceAnswer(text)) {
    const place = text.trim().replace(/^[iI]n\s+/, '').replace(/[.!?]+$/, '')
    const name = s.last_step_title
    await upsertMemory(name, place, 'place', conversationId)
    const route = routeOf(name, place)
    return {
      handled: true,
      reply: `Ort liegt. ${routeReply(name, place)}`,
      tool: mapsTool('route', 'Route', [route], name),
      lastTool: 'maps',
    }
  }

  const written = parsePlaceWrite(text)
  if (written) {
    await upsertMemory(written.name, written.place, 'place', conversationId)
    const who = displayPlaceName(written.name)
    let extra = ''
    const pending = loadSettings()
    if (written.name === 'zuhause' && pending.last_step_tool === 'home_ask' && pending.last_step_title) {
      await addReminder({
        title: pending.last_step_title,
        due_at: new Date(Date.now() + 365 * 86_400_000).toISOString(),
        conversationId,
        kind: 'home',
      })
      extra = ` Wenn Sie zuhause sind: ${pending.last_step_title}. Handy muss an sein.`
      saveSettings({ last_step_tool: 'home', last_step_title: pending.last_step_title })
    }
    return {
      handled: true,
      reply: `${who}: ${written.place} — liegt.${extra}`,
      tool: {
        tool_status: 'executed',
        tool: 'maps',
        action: 'save',
        label: 'Ort liegt',
        preview: written.name,
      },
      lastTool: 'maps',
    }
  }

  const recall = parsePlaceRecall(text)
  if (recall) {
    const hit = await findPlace(recall.name)
    if (!hit) {
      return {
        handled: true,
        reply: `Kein Ort für ${displayPlaceName(recall.name)}. Sage z. B. „${displayPlaceName(recall.name)} wohnt in …“.`,
        tool: { tool_status: 'executed', tool: 'maps', action: 'ask', label: 'Ort fehlt', preview: recall.name },
        lastTool: 'maps_ask',
      }
    }
    return { handled: true, reply: `${displayPlaceName(hit.name)}: ${hit.place}.` }
  }

  const nav = parsePlaceNav(text)
  if (!nav) return { handled: false }

  if (nav.kind === 'alias') {
    await upsertMemory(`alias:${nav.name}`, nav.alias, 'fact', conversationId)
    await upsertMemory(`alias:${nav.alias}`, nav.name, 'fact', conversationId)
    const rows = await listMemory()
    const hit = findContactRow(rows, nav.alias) || findContactRow(rows, nav.name)
    if (hit) {
      const opened = await openDialer(hit.value)
      return {
        handled: true,
        reply: opened.ok
          ? `${displayPlaceName(nav.name)} ist ${displayPlaceName(nav.alias)}. Wählhilfe ${displayPlaceName(hit.key)} — ${hit.value}. Verbunden erst, wenn Sie abheben.`
          : `${displayPlaceName(nav.name)} ist ${displayPlaceName(nav.alias)}. Nummer ${hit.value}.`,
        tool: {
          tool_status: 'executed',
          tool: 'maps',
          action: 'call',
          label: 'Anrufen',
          preview: hit.key,
          result: { tel: `tel:${hit.value}`, name: hit.key },
        },
        lastTool: 'maps',
      }
    }
    return {
      handled: true,
      reply: `${displayPlaceName(nav.name)} ist ${displayPlaceName(nav.alias)}. Welche Nummer? Sage z. B. „${displayPlaceName(nav.alias)}, Tel …“.`,
      tool: { tool_status: 'executed', tool: 'maps', action: 'ask', label: 'Nummer fehlt', preview: nav.alias },
      lastTool: 'phone_ask',
    }
  }

  if (nav.kind === 'phone') {
    await upsertMemory(nav.name, nav.number, 'contact', conversationId)
    return {
      handled: true,
      reply: `${displayPlaceName(nav.name)}: ${nav.number} — liegt.`,
      tool: {
        tool_status: 'executed',
        tool: 'maps',
        action: 'phone',
        label: 'Nummer',
        preview: nav.name,
        result: { tel: `tel:${nav.number}`, name: nav.name },
      },
      lastTool: 'maps',
    }
  }

  if (nav.kind === 'sms') {
    const rows = await listMemory()
    const hit = findContactRow(rows, nav.query)
    if (!hit) {
      const who = displayPlaceName(nav.query)
      saveSettings({ last_step_tool: 'sms_ask', last_step_title: nav.query, last_step_when: nav.body })
      return {
        handled: true,
        reply: `Keine Nummer für ${who}. Sage z. B. „${who}, Tel …“. Dann öffne ich die SMS — senden Sie selbst.`,
        tool: { tool_status: 'executed', tool: 'maps', action: 'ask', label: 'Nummer fehlt', preview: nav.query },
        lastTool: 'sms_ask',
      }
    }
    const opened = await openSms(hit.value, nav.body)
    return {
      handled: true,
      reply: opened.ok
        ? `SMS an ${displayPlaceName(hit.key)} vorbereitet. Senden Sie selbst.`
        : `SMS nicht geöffnet. Nummer ${hit.value}. Ich habe nichts versendet.`,
      tool: {
        tool_status: 'executed',
        tool: 'maps',
        action: 'sms',
        label: 'SMS',
        preview: hit.key,
        result: { sms: `sms:${hit.value}`, name: hit.key, body: nav.body },
      },
      lastTool: 'maps',
    }
  }

  if (nav.kind === 'call') {
    const rows = await listMemory()
    const hit = findContactRow(rows, nav.query)
    if (!hit) {
      const who = displayPlaceName(nav.query)
      return {
        handled: true,
        reply: `Keine Nummer für ${who}. Sage z. B. „${who}, Tel …“.`,
        tool: { tool_status: 'executed', tool: 'maps', action: 'ask', label: 'Nummer fehlt', preview: nav.query },
        lastTool: 'phone_ask',
      }
    }
    const opened = await openDialer(hit.value)
    return {
      handled: true,
      reply: opened.ok
        ? `Wählhilfe für ${displayPlaceName(hit.key)} — ${hit.value}. Verbunden erst, wenn Sie abheben.`
        : `Nummer ${displayPlaceName(hit.key)} — ${hit.value}. Wählhilfe nicht geöffnet.`,
      tool: {
        tool_status: 'executed',
        tool: 'maps',
        action: 'call',
        label: 'Anrufen',
        preview: hit.key,
        result: { tel: `tel:${hit.value}`, name: hit.key },
      },
      lastTool: 'maps',
    }
  }

  if (nav.kind === 'list') {
    const rows = await places()
    if (!rows.length) {
      return {
        handled: true,
        reply: 'Noch niemand mit Ort. Sage z. B. „Freundin wohnt in Heilbronn“.',
      }
    }
    const routes = rows.map((r) => routeOf(r.name, r.place))
    persistLastList('maps', routes.map((r) => r.title))
    const lines = routes.map((r, i) => `${i + 1}. ${r.title} — ${r.destination}`).join('\n')
    return {
      handled: true,
      reply: `Orte:\n${lines}\nUnten in Google Maps öffnen.`,
      tool: mapsTool('list', 'Routen', routes),
      lastTool: 'maps',
    }
  }

  const q = nav.query
  const mode = nav.mode || 'driving'
  const hit = await findPlace(q)
  if (hit) {
    const route = routeOf(hit.name, hit.place, mode)
    return {
      handled: true,
      reply: routeReply(hit.name, hit.place),
      tool: mapsTool('route', 'Route', [route], hit.name),
      lastTool: 'maps',
    }
  }

  if ((nav.via === 'nach' && !isRelationName(q) && !isHomeName(q)) || looksLikeAddress(q)) {
    const dest = q.replace(/^\w/, (c) => c.toUpperCase())
    const route = routeOf(dest, dest, mode)
    return {
      handled: true,
      reply: routeReply(dest, dest),
      tool: mapsTool('route', 'Route', [route], dest),
      lastTool: 'maps',
    }
  }

  const who = displayPlaceName(q)
  return {
    handled: true,
    reply: `Wo ist ${who}? Dann öffne ich die Route in Google Maps.`,
    tool: { tool_status: 'executed', tool: 'maps', action: 'ask', label: 'Ort fehlt', preview: q },
    lastTool: 'maps_ask',
  }
}
