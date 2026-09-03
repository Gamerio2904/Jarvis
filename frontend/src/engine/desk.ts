import type { ToolMeta } from './tools.ts'
import { loadSettings, saveSettings } from './store.ts'
import { parseDeskIntent } from './desk-parse.ts'

export { parseDeskIntent } from './desk-parse.ts'

export function markEyeFrame(): void {
  try {
    saveSettings({ last_eye_frame: true })
  } catch {
    /* */
  }
}

export function markPcFrame(): void {
  try {
    saveSettings({ last_pc_frame: true })
  } catch {
    /* */
  }
}

export function deskFrameState(s = loadSettingsSafe()): { eye: boolean; pc: boolean } {
  return { eye: Boolean(s.last_eye_frame), pc: Boolean(s.last_pc_frame) }
}

export async function handleDesk(_conversationId: string, text: string): Promise<{
  handled: boolean
  reply?: string
  tool?: ToolMeta
  lastTool?: string
}> {
  const intent = parseDeskIntent(text)
  if (!intent) return { handled: false }
  if (!intent.on) {
    try {
      saveSettings({ last_desk_on: false })
    } catch {
      /* */
    }
    return {
      handled: true,
      reply: 'Tisch aus. Kein Frame mehr im Prompt. Always-on Kamera gibt es nicht.',
      tool: { tool_status: 'executed', tool: 'desk', action: 'off', label: 'Tisch' },
      lastTool: 'desk',
    }
  }
  const frames = deskFrameState()
  if (!frames.eye && !frames.pc) {
    return {
      handled: true,
      reply: 'Kein Frame. Foto aufnehmen oder PC live — ich erfinde keinen Schreibtisch.',
      tool: { tool_status: 'executed', tool: 'desk', action: 'ask', label: 'Tisch' },
      lastTool: 'desk',
    }
  }
  try {
    saveSettings({ last_desk_on: true })
  } catch {
    /* */
  }
  const src = frames.eye && frames.pc ? 'letztes Auge-Foto und letzter PC-JPEG' : frames.eye ? 'letztes Auge-Foto' : 'letzter PC-JPEG'
  return {
    handled: true,
    reply: `Tisch an. Ich nutze ${src}. Always-on Webcam bleibt aus.`,
    tool: { tool_status: 'executed', tool: 'desk', action: 'on', label: 'Tisch' },
    lastTool: 'desk',
  }
}

function loadSettingsSafe(): { last_eye_frame?: boolean; last_pc_frame?: boolean } {
  try {
    return loadSettings()
  } catch {
    return {}
  }
}
