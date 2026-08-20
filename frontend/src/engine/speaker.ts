import { listMemory, loadSettings, saveSettings } from './store'
import { parseSpeakerIntent } from './speaker-parse'
import type { ToolMeta } from './tools'

export { parseSpeakerIntent }

function speakerTool(action: string, label: string): ToolMeta {
  return { tool_status: 'executed', tool: 'speaker', action, label }
}

export async function handleSpeaker(
  _conversationId: string,
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  const intent = parseSpeakerIntent(text)
  if (!intent) return { handled: false }
  if (intent.kind === 'forget') {
    saveSettings({ last_speaker: '' })
    return {
      handled: true,
      reply: 'Sprecher für diese Runde vergessen. Ich höre nur Text, keine Stimme — sagen Sie den Namen, wenn ich merken soll, wer spricht.',
      tool: speakerTool('forget', 'Sprecher'),
      lastTool: 'speaker',
    }
  }
  if (intent.kind === 'iam') {
    const name = intent.name
    const mem = await listMemory()
    const known = mem.some(
      (m) =>
        (m.category === 'contact' || m.category === 'place' || m.key === 'name') &&
        (m.key === name.toLowerCase() || m.value.toLowerCase().includes(name.toLowerCase()) || m.key.includes(name.toLowerCase())),
    )
    saveSettings({ last_speaker: name })
    return {
      handled: true,
      reply: known
        ? `Für diese Runde: ${name}. Ich erkenne Stimmen nicht — nur den Namen, den Sie gerade gesagt haben.`
        : `Für diese Runde: ${name}. Die Person kenne ich noch nicht. Stimmen erkenne ich nicht, nur den Namen.`,
      tool: speakerTool('iam', 'Sprecher'),
      lastTool: 'speaker',
    }
  }
  const who = loadSettings().last_speaker.trim()
  if (who) {
    return {
      handled: true,
      reply: `In dieser Runde haben Sie ${who} gesagt. Ich höre nur Text, keine Stimme — unsicher, ob jemand anderes spricht.`,
      tool: speakerTool('who', 'Sprecher'),
      lastTool: 'speaker',
    }
  }
  return {
    handled: true,
    reply: 'Ich erkenne Stimmen nicht. Sagen Sie „Ich bin …“, dann merke ich den Namen für diese Runde. Sonst unsicher.',
    tool: speakerTool('who', 'Sprecher'),
    lastTool: 'speaker',
  }
}
