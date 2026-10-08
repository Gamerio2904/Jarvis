import type { ChatBlock } from './chat-blocks.ts'
import type { ToolMeta } from './tools.ts'
import { loadSettings } from './store.ts'
import { qrImageDataUrl } from './xfer-codec.ts'
import { hausServerState, hausServerStop } from '../native/haus.ts'
import { clearPairing, resolveSyncConflict, startTabletServer, takePendingConflict } from './tablet-sync.ts'
import {
  parseConflictChoice,
  parseTabletMode,
  parseTabletPair,
  parseTabletServer,
  TABLET_OFF_REPLY,
  TABLET_ON_REPLY,
} from './tablet-mode.ts'

export type TabletHit = { reply: string; tool: ToolMeta; blocks?: ChatBlock[] }

/** Chat-Befehle fürs Tablet. Der Umschalter selbst läuft in der Oberfläche über `tool`. */
export async function handleTabletText(text: string): Promise<TabletHit | null> {
  const choice = parseConflictChoice(text)
  if (choice) {
    const tool = { tool_status: 'executed', tool: 'tablet', action: `conflict_${choice}`, label: 'Sync-Konflikt' }
    const ticket = takePendingConflict()
    if (!ticket) return { reply: 'Es liegt kein aktueller Konflikt vor. Bitte zuerst neu abgleichen.', tool }
    const out = await resolveSyncConflict(choice, ticket)
    if (out.kind === 'pulled') window.dispatchEvent(new Event('jarvis-sync-pulled'))
    return { reply: out.line || 'Nichts geändert.', tool }
  }
  const server = parseTabletServer(text)
  if (server) {
    const tool = { tool_status: 'executed', tool: 'tablet', action: `server_${server}`, label: 'Hausstand-Server' }
    if (!loadSettings().tablet_mode) {
      return { reply: 'Bitte zuerst den Tabletmodus einschalten. Der Server startet nicht auf dem Handy.', tool }
    }
    if (server === 'start') {
      const made = await startTabletServer(false)
      return {
        reply: made.ok ? `Hausstand-Server läuft sicher unter ${made.url}.` : made.message || 'Der Serverstart ist fehlgeschlagen.',
        tool,
      }
    }
    if (server === 'stop') {
      const stopped = await hausServerStop()
      return { reply: stopped ? 'Hausstand-Server ist gestoppt.' : 'Der Hausstand-Server ließ sich nicht sicher stoppen.', tool }
    }
    const state = await hausServerState()
    return {
      reply: !state.ok ? 'Der Serverstatus ist nicht verfügbar.' : state.running ? 'Hausstand-Server läuft.' : 'Hausstand-Server ist aus.',
      tool,
    }
  }

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
    const state = loadSettings().tablet_mode ? await hausServerState() : null
    if (state?.running) {
      const made = await startTabletServer(true)
      return {
        reply: made.ok
          ? 'Kopplung zurückgesetzt. Alte Handys sind abgemeldet. „Handy koppeln“ zeigt den neuen Code.'
          : made.message || 'Zurücksetzen ging nicht.',
        tool,
      }
    }
    await clearPairing()
    return { reply: 'Kopplung auf diesem Gerät gelöscht.', tool }
  }
  if (!loadSettings().tablet_mode) {
    return { reply: 'Das geht nur auf dem Tablet. Erst „Tabletmodus an“.', tool }
  }
  const state = await hausServerState()
  if (!state.ok || !state.running) {
    return { reply: 'Der Server ist aus. Sag zuerst „Starte den Server“, dann „Handy koppeln“.', tool }
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
