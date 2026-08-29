import { normalizeUtterance } from './utterance.ts'
import type { ToolMeta } from './tools.ts'

export type SensorsIntent = { kind: 'steps' | 'baro' | 'compass' }

export function parseSensorsIntent(text: string): SensorsIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 140) return null
  if (/\b(schritte(?:zahl)?|wie\s+viele\s+schritte)\b/i.test(t)) return { kind: 'steps' }
  if (/\b(luftdruck|barometer)\b/i.test(t)) return { kind: 'baro' }
  if (/\b(kompass|himmelsrichtung|wo\s+ist\s+norden)\b/i.test(t)) return { kind: 'compass' }
  return null
}

export async function handleSensors(
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  const intent = parseSensorsIntent(text)
  if (!intent) return { handled: false }
  if (intent.kind === 'steps') {
    return {
      handled: true,
      reply: 'Schritte lese ich auf diesem Gerät nicht. Eine Fitness-Zahl erfinde ich nicht.',
      tool: { tool_status: 'executed', tool: 'sensors', action: 'steps', label: 'Schritte' },
      lastTool: 'sensors',
    }
  }
  if (intent.kind === 'baro') {
    return {
      handled: true,
      reply: 'Luftdruck kommt hier nicht an. Ohne Sensor rate ich nicht.',
      tool: { tool_status: 'executed', tool: 'sensors', action: 'baro', label: 'Luftdruck' },
      lastTool: 'sensors',
    }
  }
  const heading = await readHeading()
  if (heading == null) {
    return {
      handled: true,
      reply: 'Kompass nicht lesbar. Im Browser oft ohne Sensor, auf dem Handy die Lagefreigabe prüfen.',
      tool: { tool_status: 'executed', tool: 'sensors', action: 'compass', label: 'Kompass' },
      lastTool: 'sensors',
    }
  }
  return {
    handled: true,
    reply: `Richtung ${Math.round(heading)} Grad, ${cardinal(heading)}. Keine Navigation.`,
    tool: { tool_status: 'executed', tool: 'sensors', action: 'compass', label: 'Kompass' },
    lastTool: 'sensors',
  }
}

function readHeading(): Promise<number | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) {
      resolve(null)
      return
    }
    const timer = globalThis.setTimeout(() => {
      window.removeEventListener('deviceorientation', onOri)
      resolve(null)
    }, 1200)
    const onOri = (ev: DeviceOrientationEvent) => {
      const webkit = ev as DeviceOrientationEvent & { webkitCompassHeading?: number }
      const abs = typeof ev.absolute === 'boolean' ? ev.absolute : false
      let h: number | null = null
      if (typeof webkit.webkitCompassHeading === 'number') h = webkit.webkitCompassHeading
      else if (abs && typeof ev.alpha === 'number') h = (360 - ev.alpha) % 360
      if (h == null || !Number.isFinite(h)) return
      globalThis.clearTimeout(timer)
      window.removeEventListener('deviceorientation', onOri)
      resolve(h)
    }
    window.addEventListener('deviceorientation', onOri)
  })
}

function cardinal(deg: number): string {
  const d = ((deg % 360) + 360) % 360
  const names = ['Nord', 'Nordost', 'Ost', 'Südost', 'Süd', 'Südwest', 'West', 'Nordwest']
  return names[Math.round(d / 45) % 8]
}
