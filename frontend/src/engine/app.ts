import { saveSettings } from './store.ts'
import { parseAppIntent } from './app-parse.ts'
import { resolveTopic, TOPIC_FACE } from './settings-ia.ts'
import { packVerified } from './action-fsm.ts'
import type { ToolMeta } from './tools.ts'

export type { AppIntent } from './app-parse.ts'
export { parseAppIntent } from './app-parse.ts'

/** Flächen in der App — Handler setzt Settings/HUD, UI öffnet über tool.action. */
export async function handleApp(
  _conversationId: string,
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  const intent = parseAppIntent(text)
  if (!intent) return { handled: false }
  if (intent.kind === 'voice') {
    const packed = packVerified({
      domain: 'app',
      intent: 'voice',
      plan: 'voice',
      label: 'Stimme',
      observation: { action: 'voice' },
      verify: (obs) => obs.action === 'voice',
      successReply: 'Sprachmodus ist offen.',
      failReply: 'Sprachmodus nicht geöffnet.',
    })
    return { handled: true, reply: packed.reply, tool: packed.tool, lastTool: 'app' }
  }
  if (intent.kind === 'theme') {
    saveSettings({ hud_accent: intent.accent })
    const packed = packVerified({
      domain: 'app',
      intent: `theme:${intent.accent}`,
      plan: 'theme',
      label: intent.accent === 'amber' ? 'Orange' : 'Grün',
      observation: { accent: intent.accent },
      verify: (obs) => obs.accent === intent.accent,
      successReply: intent.accent === 'amber' ? 'Lage-Akzent orange.' : 'Lage-Akzent wieder Grün.',
      failReply: 'Akzent nicht gesetzt.',
      extra: { accent: intent.accent },
    })
    return { handled: true, reply: packed.reply, tool: packed.tool, lastTool: 'app' }
  }
  const topic = intent.topic
  const tab = resolveTopic(topic)
  const face = TOPIC_FACE[tab]
  const action = topic === 'debug' || topic === 'tests' || topic === 'probe' ? 'debug' : topic === 'gedaechtnis' ? 'memory' : 'settings'
  const packed = packVerified({
    domain: 'app',
    intent: `open:${topic}`,
    plan: action,
    label: face.label,
    observation: { action, topic },
    verify: (obs) => obs.action === action && obs.topic === topic,
    successReply: `${face.label} ist offen.`,
    failReply: `${face.label} nicht geöffnet.`,
    extra: { topic },
  })
  return { handled: true, reply: packed.reply, tool: packed.tool, lastTool: 'app' }
}
