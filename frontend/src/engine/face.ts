import { loadSettings, saveSettings } from './store.ts'
import { parseFaceIntent, type Face } from './face-parse.ts'
import type { ToolMeta } from './tools.ts'

export type { Face } from './face-parse.ts'
export { parseFaceIntent } from './face-parse.ts'

export function loadFace(): Face {
  return loadSettings().face === 'friday' ? 'friday' : 'jarvis'
}

export function setFace(face: Face) {
  try {
    saveSettings({ face })
  } catch {
    /* tests without localStorage */
  }
}

export async function handleFace(
  _conversationId: string,
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  const face = parseFaceIntent(text)
  if (!face) return { handled: false }
  setFace(face)
  const reply =
    face === 'friday'
      ? 'Friday. Kalender, Erinnerung, SMS nach Ja — Siezen, kein Marvel.'
      : 'Jarvis. Smalltalk und Haus, Fahrmodus bleibt intern.'
  return {
    handled: true,
    reply,
    tool: { tool_status: 'executed', tool: 'face', action: 'switch', label: face === 'friday' ? 'Friday' : 'Jarvis' },
    lastTool: 'face',
  }
}
