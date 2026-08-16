import {
  displayPlaceName,
  isBarePlaceAnswer,
  isHomeName,
  isRelationName,
  looksLikeAddress,
  mapsDirUrl,
  parsePlaceNav,
  parsePlaceRecall,
  parsePlaceWrite,
} from './places-parse'
import { listMemory, loadSettings, upsertMemory } from './store'
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

function routeOf(name: string, place: string): MapsRoute {
  const title = displayPlaceName(name)
  return { title, destination: place, url: mapsDirUrl(place) }
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
    return {
      handled: true,
      reply: `${who}: ${written.place} — liegt.`,
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

  if (nav.kind === 'list') {
    const rows = await places()
    if (!rows.length) {
      return {
        handled: true,
        reply: 'Noch niemand mit Ort. Sage z. B. „Freundin wohnt in Heilbronn“.',
      }
    }
    const routes = rows.map((r) => routeOf(r.name, r.place))
    const lines = routes.map((r, i) => `${i + 1}. ${r.title} — ${r.destination}`).join('\n')
    return {
      handled: true,
      reply: `Orte:\n${lines}\nUnten in Google Maps öffnen.`,
      tool: mapsTool('list', 'Routen', routes),
      lastTool: 'maps',
    }
  }

  const q = nav.query
  const hit = await findPlace(q)
  if (hit) {
    const route = routeOf(hit.name, hit.place)
    return {
      handled: true,
      reply: routeReply(hit.name, hit.place),
      tool: mapsTool('route', 'Route', [route], hit.name),
      lastTool: 'maps',
    }
  }

  if ((nav.via === 'nach' && !isRelationName(q) && !isHomeName(q)) || looksLikeAddress(q)) {
    const dest = q.replace(/^\w/, (c) => c.toUpperCase())
    const route = routeOf(dest, dest)
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
