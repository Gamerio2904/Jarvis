import { parseAmazonMusicIntent } from './amazon-parse.ts'
import { openAmazonMusic } from '../native/device.ts'
import type { ToolMeta } from './tools.ts'

export { parseAmazonMusicIntent }

export async function handleAmazonMusic(
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  if (!parseAmazonMusicIntent(text)) return { handled: false }
  const res = await openAmazonMusic()
  if (res.ok) {
    return {
      handled: true,
      reply: 'Amazon Music geöffnet. Pause und Lautstärke dort — in Jarvis bleibt Spotify.',
      tool: { tool_status: 'executed', tool: 'amazon', action: 'open', label: 'Amazon Music' },
      lastTool: 'amazon',
    }
  }
  return {
    handled: true,
    reply: res.message || 'Amazon-Music-App fehlt. Spotify bleibt der Weg in Jarvis.',
    tool: { tool_status: 'executed', tool: 'amazon', action: 'missing', label: 'Amazon Music' },
    lastTool: 'amazon',
  }
}
