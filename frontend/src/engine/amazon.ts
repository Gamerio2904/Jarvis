import { parseAmazonIntent } from './amazon-parse'
import { openExternalUrl } from '../native/device'
import type { ToolMeta } from './tools'

export { namesAmazon, parseAmazonIntent } from './amazon-parse'
export type { AmazonIntent } from './amazon-parse'

type AmazonHit = {
  handled: boolean
  reply?: string
  tool?: ToolMeta
  lastTool?: string
}

function amazonTool(action: string, label: string): ToolMeta {
  return { tool_status: 'executed', tool: 'amazon', action, label }
}

export async function handleAmazon(_conversationId: string, text: string): Promise<AmazonHit> {
  const intent = parseAmazonIntent(text)
  if (!intent) return { handled: false }
  const query = intent.kind === 'play' ? intent.query : ''
  const url = query
    ? `https://music.amazon.de/search/${encodeURIComponent(query)}`
    : 'https://music.amazon.de/'
  const opened = await openExternalUrl(url)
  if (intent.kind === 'pause') {
    return {
      handled: true,
      reply: opened.ok
        ? 'Amazon Musik ist geöffnet. Pause liegt in der App — intern spiele ich dort nicht.'
        : 'Amazon Musik nicht geöffnet. Interner Player braucht den geschlossenen Amazon-Zugang. Spotify bleibt der Default.',
      tool: amazonTool('open', 'Amazon Musik'),
      lastTool: 'amazon',
    }
  }
  const title = query ? `„${query}“` : 'Amazon Musik'
  return {
    handled: true,
    reply: opened.ok
      ? `${title} in der Amazon-Musik-App. Ich behaupte kein Abspielen in Jarvis — die offizielle API ist closed Beta.`
      : `Die Amazon-Musik-App ist hier nicht aufgegangen. ${title} intern spiele ich nicht. Spotify bleibt der Default.`,
    tool: amazonTool(query ? 'play' : 'open', 'Amazon Musik'),
    lastTool: 'amazon',
  }
}
