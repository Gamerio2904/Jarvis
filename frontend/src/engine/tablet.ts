import { loadSettings, saveSettings } from './store'
import type { ToolMeta } from './tools'
import { parseTabletIntent } from './tablet-parse'

export { isNameOnly, parseTabletIntent } from './tablet-parse'
export type { TabletIntent } from './tablet-parse'

export type TabletCard =
  | { kind: 'idle' }
  | { kind: 'weather'; line: string; place?: string }
  | { kind: 'image'; dataUrl: string; caption?: string }
  | { kind: 'status'; title: string; body: string }
  | { kind: 'reply'; heard: string; reply: string }
  | {
      kind: 'squad'
      picks: Array<{
        name: string
        pos: string
        age: number
        ovr: number
        pot: number
        club: string
        kind: string
        est: number
      }>
      focus?: string
    }

export type LastEyeItem = { dataUrl: string; at: string; caption?: string }

let card: TabletCard = { kind: 'idle' }
const listeners = new Set<() => void>()

function emit() {
  for (const cb of listeners) cb()
}

export function subscribeTablet(cb: () => void): () => void {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

export function isTabletOpen(): boolean {
  return Boolean(loadSettings().tablet_mode)
}

export function getTabletCard(): TabletCard {
  return card
}

export function showTabletCard(next: TabletCard) {
  card = next
  emit()
}

export function openTablet() {
  saveSettings({ tablet_mode: true })
  if (card.kind === 'idle') {
    const weather = loadSettings().last_weather_line
    if (weather) {
      card = { kind: 'weather', line: weather, place: loadSettings().last_weather_place || loadSettings().last_place }
    }
  }
  emit()
}

export function closeTablet() {
  saveSettings({ tablet_mode: false })
  card = { kind: 'idle' }
  emit()
}

export function readLastEyes(): LastEyeItem[] {
  try {
    const raw = loadSettings().last_eye_json
    if (!raw) return []
    const parsed = JSON.parse(raw) as { items?: LastEyeItem[] }
    if (!Array.isArray(parsed.items)) return []
    return parsed.items.filter((x) => typeof x?.dataUrl === 'string' && x.dataUrl.startsWith('data:image/'))
  } catch {
    return []
  }
}

export function saveLastEye(dataUrl: string, caption = ''): LastEyeItem | null {
  if (!dataUrl.startsWith('data:image/')) return null
  const item: LastEyeItem = { dataUrl, at: new Date().toISOString(), caption: caption.slice(0, 80) }
  const prev = readLastEyes().filter((x) => x.dataUrl !== dataUrl)
  const items = [item, ...prev].slice(0, 3)
  saveSettings({ last_eye_json: JSON.stringify({ items }) })
  if (loadSettings().tablet_mode) showTabletCard({ kind: 'image', dataUrl, caption })
  return item
}

export function latestEye(): LastEyeItem | null {
  return readLastEyes()[0] || null
}

function tabletTool(action: string, label: string, extra?: Record<string, unknown>): ToolMeta {
  return {
    tool_status: 'executed',
    tool: 'tablet',
    action,
    label,
    result: extra,
  }
}

function statusBody(): { title: string; body: string } {
  const s = loadSettings()
  const bits = [
    s.last_weather_line && `Wetter: ${s.last_weather_line}`,
    s.last_place && `Ort: ${s.last_place}`,
    s.last_step_tool && `Zuletzt: ${s.last_step_tool}${s.last_step_title ? ` · ${s.last_step_title}` : ''}`,
    s.last_medium && `Medium: ${s.last_medium}`,
  ].filter(Boolean)
  return {
    title: 'Status',
    body: bits.length ? bits.join(' · ') : 'Noch nichts auf dem Tisch. Wetter, Foto oder ein Befehl genügt.',
  }
}

export function publishTabletFromHit(heard: string, reply: string, tool?: ToolMeta | null) {
  if (!loadSettings().tablet_mode) return
  if (tool?.tool === 'weather' && reply) {
    showTabletCard({
      kind: 'weather',
      line: reply,
      place: loadSettings().last_weather_place || loadSettings().last_place,
    })
    return
  }
  const img = typeof tool?.result?.image === 'string' ? String(tool.result.image) : ''
  if (img.startsWith('data:image/')) {
    showTabletCard({ kind: 'image', dataUrl: img, caption: reply })
    return
  }
  if (tool?.tool === 'eye') {
    const shot = latestEye()
    if (shot) {
      showTabletCard({ kind: 'image', dataUrl: shot.dataUrl, caption: reply })
      return
    }
  }
  if (reply.trim()) showTabletCard({ kind: 'reply', heard, reply })
}

export async function handleTablet(
  _conversationId: string,
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  const s = loadSettings()
  const intent = parseTabletIntent(text, Boolean(s.tablet_mode))
  if (!intent) return { handled: false }

  if (intent.kind === 'off') {
    closeTablet()
    return {
      handled: true,
      reply: 'Vollbild aus.',
      tool: tabletTool('close', 'Tablet aus'),
      lastTool: 'tablet',
    }
  }

  if (intent.kind === 'on') {
    openTablet()
    return {
      handled: true,
      reply: 'Tablet-Modus. Vollbild — ich höre auf Jarvis und führe die Befehle aus.',
      tool: tabletTool('open', 'Tablet'),
      lastTool: 'tablet',
    }
  }

  if (intent.kind === 'show_image') {
    const shot = latestEye()
    if (!shot) {
      return {
        handled: true,
        reply: 'Kein Bild da. Foto-Knopf unten — dann zeige ich es im Vollbild.',
        tool: tabletTool('ask', 'Bild fehlt'),
        lastTool: 'tablet',
      }
    }
    if (s.tablet_mode) showTabletCard({ kind: 'image', dataUrl: shot.dataUrl, caption: shot.caption })
    else openTablet()
    showTabletCard({ kind: 'image', dataUrl: shot.dataUrl, caption: shot.caption })
    return {
      handled: true,
      reply: shot.caption || 'Das letzte Bild.',
      tool: tabletTool('image', 'Bild', { image: shot.dataUrl }),
      lastTool: 'tablet',
    }
  }

  if (intent.kind === 'show_weather') {
    const line = s.last_weather_line.trim()
    if (!line) return { handled: false }
    if (!s.tablet_mode) openTablet()
    showTabletCard({
      kind: 'weather',
      line,
      place: s.last_weather_place || s.last_place,
    })
    return {
      handled: true,
      reply: line,
      tool: tabletTool('weather', 'Wetter'),
      lastTool: 'tablet',
    }
  }

  if (intent.kind === 'show_status') {
    const row = statusBody()
    if (!s.tablet_mode) openTablet()
    showTabletCard({ kind: 'status', title: row.title, body: row.body })
    return {
      handled: true,
      reply: row.body,
      tool: tabletTool('status', 'Status'),
      lastTool: 'tablet',
    }
  }

  return { handled: false }
}
