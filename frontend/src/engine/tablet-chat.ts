import type { ChatBlock } from './chat-blocks.ts'
import type { ToolMeta } from './tools.ts'
import { loadSettings, saveSettings } from './store.ts'
import { qrImageDataUrl } from './xfer-codec.ts'
import { startTabletServer } from './tablet-sync.ts'
import {
  parseTabletMode,
  parseTabletPair,
  TABLET_OFF_REPLY,
  TABLET_ON_REPLY,
} from './tablet-mode.ts'

export type TabletHit = { reply: string; tool: ToolMeta; blocks?: ChatBlock[] }

/** Chat-Befehle fürs Tablet. Der Umschalter selbst läuft in der Oberfläche über `tool`. */
export async function handleTabletText(text: string): Promise<TabletHit | null> {
  const mode = parseTabletMode(text)
  if (mode) {
    return {
      reply: mode === 'on' ? TABLET_ON_REPLY : TABLET_OFF_REPLY,
      tool: { tool_status: 'executed', tool: 'tablet', action: mode, label: 'Tabletmodus' },
    }
  }
  const pair = parseTabletPair(text)
  if (!pair) return null
  const tool = { tool_status: 'executed', tool: 'tablet', action: pair, label: 'Kopplung' }
  if (pair === 'reset') {
    saveSettings({ sync_url: '', sync_token: '' })
    if (loadSettings().tablet_mode) {
      const made = await startTabletServer(true)
      return {
        reply: made.ok
          ? 'Kopplung zurückgesetzt. Alte Handys sind abgemeldet. „Handy koppeln“ zeigt den neuen Code.'
          : made.message || 'Zurücksetzen ging nicht.',
        tool,
      }
    }
    return { reply: 'Kopplung auf diesem Gerät gelöscht.', tool }
  }
  if (!loadSettings().tablet_mode) {
    return { reply: 'Das geht nur auf dem Tablet. Erst „Tabletmodus an“.', tool }
  }
  const made = await startTabletServer(false)
  if (!made.ok || !made.code) return { reply: made.message || 'Der Hausstand-Server läuft nicht.', tool }
  const src = qrImageDataUrl(made.code)
  if (!src) return { reply: 'Der Code fehlt.', tool }
  return {
    reply: 'Koppel-Code. Auf dem Handy: „Scanne QR Code“. Gilt einmalig, danach verbindet sich das Handy von selbst.',
    tool,
    blocks: [{ kind: 'image', src, alt: 'Koppel-Code', source: 'Tablet' }],
  }
}
