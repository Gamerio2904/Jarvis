import { saveSettings } from './store.ts'
import { parseAppIntent } from './app-parse.ts'
import { TOPIC_FACE } from './settings-ia.ts'
import type { ToolMeta } from './tools.ts'

export type { AppIntent } from './app-parse.ts'
export { parseAppIntent } from './app-parse.ts'

function pack(reply: string, action: string, label: string, extra?: Record<string, unknown>) {
  return {
    handled: true as const,
    reply,
    lastTool: 'app',
    tool: {
      tool_status: 'executed' as const,
      tool: 'app',
      action,
      label,
      result: extra,
    } satisfies ToolMeta,
  }
}

/** Flächen in der App — Handler setzt Settings/HUD, UI öffnet über tool.action. */
export async function handleApp(
  _conversationId: string,
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  const intent = parseAppIntent(text)
  if (!intent) return { handled: false }
  if (intent.kind === 'voice') {
    return pack('Sprachmodus ist offen.', 'voice', 'Stimme')
  }
  if (intent.kind === 'theme') {
    saveSettings({ hud_accent: intent.accent })
    return pack(
      intent.accent === 'amber' ? 'Lage-Akzent orange.' : 'Lage-Akzent wieder Grün.',
      'theme',
      intent.accent === 'amber' ? 'Orange' : 'Grün',
      { accent: intent.accent },
    )
  }
  const topic = intent.topic
  const face = TOPIC_FACE[topic]
  const action = topic === 'debug' ? 'debug' : topic === 'gedaechtnis' ? 'memory' : 'settings'
  return pack(`${face.label} ist offen.`, action, face.label, { topic })
}
