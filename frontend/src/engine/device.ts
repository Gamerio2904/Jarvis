import { formatClockReply, parseDeviceIntent } from './device-parse'
import { listBluetooth, nudgeVolume, openDevicePage, readBattery, readNetwork, setTorch } from '../native/device'
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
        'Was anstoßen — Taschenlampe, WLAN, Bluetooth, Standort, Lautstärke oder Nicht stören? Schalter lege ich nicht selbst um, ich öffne die Android-Seite. Gekoppelte Bluetooth-Geräte nenne ich auf Zuruf.',
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

  if (intent.kind === 'volume') {
    const hit = await nudgeVolume(intent.dir)
    if (!hit.ok) {
      return {
        handled: true,
        reply: hit.message || 'Lautstärke nicht geändert. Nur auf dem Handy, Medienlautstärke.',
        tool: deviceTool('error', 'Lautstärke'),
        lastTool: 'device',
      }
    }
    return {
      handled: true,
      reply: intent.dir === 'up' ? 'Medienlautstärke hoch.' : 'Medienlautstärke runter.',
      tool: deviceTool(intent.dir, 'Lautstärke'),
      lastTool: 'device',
    }
  }

  if (intent.kind === 'bt_list') {
    const list = await listBluetooth()
    await openDevicePage('bluetooth')
    if (!list.ok) {
      return {
        handled: true,
        reply: `${list.message || 'Bluetooth-Geräte nicht lesbar.'} Bluetooth-Einstellungen sind offen. Koppeln müssen Sie selbst.`,
        tool: deviceTool('open', 'Bluetooth'),
        lastTool: 'device',
      }
    }
    const names = (list.devices || []).filter(Boolean).slice(0, 8)
    const on = list.on ? 'an' : 'aus'
    const roster = names.length ? names.join(', ') : 'keine gekoppelten Namen lesbar'
    return {
      handled: true,
      reply: `Bluetooth ist ${on}. Gekoppelt: ${roster}. Einstellungen sind offen — verbinden Sie dort. Ich koppeln nicht selbst.`,
      tool: deviceTool('list', 'Bluetooth'),
      lastTool: 'device',
    }
  }

  if (intent.kind !== 'page') return { handled: false }

  const labels: Record<typeof intent.page, string> = {
    wifi: 'WLAN',
    bluetooth: 'Bluetooth',
    dnd: 'Nicht stören',
    location: 'Standort',
    sound: 'Ton',
    display: 'Display',
    battery: 'Akku',
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
