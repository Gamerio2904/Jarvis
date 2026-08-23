import { formatClockReply, parseDeviceIntent } from './device-parse'
import { openDevicePage, readBattery, readNetwork, readSensors, setTorch } from '../native/device'
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

  if (intent.kind === 'steps' || intent.kind === 'pressure' || intent.kind === 'compass') {
    const s = await readSensors(intent.kind)
    if (!s.ok) {
      return {
        handled: true,
        reply: s.message || 'Sensor nicht lesbar. Ohne Freigabe rate ich keine Zahl.',
        tool: deviceTool('ask', 'Sensor'),
        lastTool: 'device',
      }
    }
    if (intent.kind === 'steps') {
      const n = s.steps
      const since = s.stepsSince || 'seit Mitternacht, wenn der Zähler durchlief'
      return {
        handled: true,
        reply:
          n == null
            ? 'Schrittzähler nicht da oder keine Freigabe. Ich schätze die Schritte nicht.'
            : `${n} Schritte ${since}. Keine Gesundheitsdiagnose.`,
        tool: deviceTool('status', 'Schritte'),
        lastTool: 'device',
      }
    }
    if (intent.kind === 'pressure') {
      return {
        handled: true,
        reply:
          s.hpa == null
            ? 'Kein Barometer in diesem Gerät. Ich rate den Luftdruck nicht.'
            : `Luftdruck ${s.hpa.toFixed(0)} hPa. Lokal gemessen, kein Wetteramt.`,
        tool: deviceTool('status', 'Luftdruck'),
        lastTool: 'device',
      }
    }
    return {
      handled: true,
      reply:
        s.heading == null
          ? 'Kompass nicht lesbar. Ich rate die Richtung nicht.'
          : `Richtung ${s.heading.toFixed(0)} Grad, ${s.cardinal || 'unbekannt'}. Magnetisch, nicht navigiert.`,
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
