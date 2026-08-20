import { formatClockReply, parseDeviceIntent } from './device-parse'
import { openDevicePage, readBattery, readCompass, readNetwork, readPressure, readSteps, setTorch } from '../native/device'
import type { ToolMeta } from './tools'

export { formatClockReply, parseDeviceIntent } from './device-parse'
export type { DeviceIntent } from './device-parse'

type DeviceHit = {
  handled: boolean
  reply?: string
  tool?: ToolMeta
  lastTool?: string
}

function deviceTool(action: string, label: string): ToolMeta {
  return { tool_status: 'executed', tool: 'device', action, label }
}

export async function handleDevice(_conversationId: string, text: string): Promise<DeviceHit> {
  const intent = parseDeviceIntent(text)
  if (!intent) return { handled: false }

  if (intent.kind === 'ask') {
    return {
      handled: true,
      reply:
        'Was anstoßen — Taschenlampe, WLAN, Bluetooth oder Nicht stören? Schalter lege ich nicht selbst um, ich öffne die Android-Seite.',
      tool: deviceTool('ask', 'System'),
      lastTool: 'device',
    }
  }

  if (intent.kind === 'clock') {
    return {
      handled: true,
      reply: formatClockReply(),
      tool: deviceTool('status', 'Uhrzeit'),
      lastTool: 'device',
    }
  }

  if (intent.kind === 'battery') {
    const b = await readBattery()
    if (!b.ok || b.percent == null) {
      return {
        handled: true,
        reply: b.message || 'Akku-Stand nicht lesbar. Ich rate nicht.',
        tool: deviceTool('ask', 'Akku'),
        lastTool: 'device',
      }
    }
    const charge = b.charging ? 'Lädt.' : 'Lädt nicht.'
    return {
      handled: true,
      reply: `Akku ${b.percent} Prozent. ${charge}`,
      tool: deviceTool('status', 'Akku'),
      lastTool: 'device',
    }
  }

  if (intent.kind === 'network') {
    const n = await readNetwork()
    if (!n.ok) {
      return {
        handled: true,
        reply: n.message || 'Verbindung nicht lesbar. Ich rate nicht.',
        tool: deviceTool('ask', 'Netz'),
        lastTool: 'device',
      }
    }
    let line = 'Offline.'
    if (n.wifi) line = 'WLAN.'
    else if (n.cellular) line = 'Mobilfunk.'
    else if (n.online) line = 'Online, Träger unklar.'
    return {
      handled: true,
      reply: `${line} Kein 5G-Raten.`,
      tool: deviceTool('status', 'Netz'),
      lastTool: 'device',
    }
  }

  if (intent.kind === 'steps') {
    const s = await readSteps()
    if (!s.ok || s.count == null) {
      return {
        handled: true,
        reply: s.message || 'Schrittzähler nicht lesbar. Recht fehlt oder kein Sensor. Keine Diagnose.',
        tool: deviceTool('ask', 'Schritte'),
        lastTool: 'device',
      }
    }
    const note = s.sinceBoot ? ' Zähler seit Gerätestart, nicht nur heute.' : ''
    return {
      handled: true,
      reply: `${s.count} Schritte.${note}`,
      tool: deviceTool('status', 'Schritte'),
      lastTool: 'device',
    }
  }

  if (intent.kind === 'pressure') {
    const p = await readPressure()
    if (!p.ok || p.hpa == null) {
      return {
        handled: true,
        reply: p.message || 'Luftdruck nicht lesbar. Kein Barometer oder kein Zugriff.',
        tool: deviceTool('ask', 'Luftdruck'),
        lastTool: 'device',
      }
    }
    return {
      handled: true,
      reply: `Luftdruck ${p.hpa} hPa.`,
      tool: deviceTool('status', 'Luftdruck'),
      lastTool: 'device',
    }
  }

  if (intent.kind === 'compass') {
    const c = await readCompass()
    if (!c.ok || c.heading == null) {
      return {
        handled: true,
        reply: c.message || 'Kompass nicht lesbar. Kein Magnetometer oder Störung.',
        tool: deviceTool('ask', 'Kompass'),
        lastTool: 'device',
      }
    }
    return {
      handled: true,
      reply: `${c.label || 'Richtung'} (${Math.round(c.heading)}°).`,
      tool: deviceTool('status', 'Kompass'),
      lastTool: 'device',
    }
  }

  if (intent.kind === 'torch') {
    const hit = await setTorch(intent.on)
    if (!hit.ok) {
      return {
        handled: true,
        reply: hit.message || 'Taschenlampe nicht geschaltet.',
        tool: deviceTool('error', 'Taschenlampe'),
        lastTool: 'device',
      }
    }
    return {
      handled: true,
      reply: intent.on ? 'Taschenlampe an.' : 'Taschenlampe aus.',
      tool: deviceTool(intent.on ? 'on' : 'off', 'Taschenlampe'),
      lastTool: 'device',
    }
  }

  if (intent.kind !== 'page') return { handled: false }

  const labels: Record<typeof intent.page, string> = {
    wifi: 'WLAN',
    bluetooth: 'Bluetooth',
    dnd: 'Nicht stören',
  }
  const opened = await openDevicePage(intent.page)
  if (!opened.ok) {
    return {
      handled: true,
      reply: opened.message || `${labels[intent.page]}-Seite nicht geöffnet.`,
      tool: deviceTool('error', labels[intent.page]),
      lastTool: 'device',
    }
  }
  return {
    handled: true,
    reply: `${labels[intent.page]}-Einstellungen sind offen. Den Schalter lege ich nicht selbst um.`,
    tool: deviceTool('open', labels[intent.page]),
    lastTool: 'device',
  }
}
