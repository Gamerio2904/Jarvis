import { saveSettings } from './store.ts'
import { parseFaceIntent, type Face } from './face-parse.ts'
import type { ToolMeta } from './tools.ts'

export type { Face } from './face-parse.ts'
export { parseFaceIntent } from './face-parse.ts'

export function loadFace(): Face {
  return 'ultron'
}

export function setFace(face: Face) {
  try {
    saveSettings({ face: face === 'ultron' ? 'ultron' : 'ultron' })
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
  setFace('ultron')
  return {
    handled: true,
    reply: 'Ultron.',
    tool: { tool_status: 'executed', tool: 'face', action: 'switch', label: 'Ultron' },
    lastTool: 'face',
  }
}
