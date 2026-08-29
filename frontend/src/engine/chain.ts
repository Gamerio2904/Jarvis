import { loadSettings, saveSettings } from './store.ts'
import { pickRouteFromCtx } from './route-pick.ts'

export function readChain(): string[] {
  try {
    const raw = loadSettings().chain_json
    if (!raw) return []
    const parsed = JSON.parse(raw) as string[]
    return Array.isArray(parsed) ? parsed.filter((p) => typeof p === 'string' && p.trim()) : []
  } catch {
    return []
  }
}

export function writeChain(parts: string[]): void {
  const clean = parts.map((p) => p.trim()).filter(Boolean)
  saveSettings({ chain_json: clean.length ? JSON.stringify(clean) : '' })
}

export function hasChain(): boolean {
  return readChain().length > 0
}

export function popChain(): string | null {
  const cur = readChain()
  if (!cur.length) return null
  const [next, ...rest] = cur
  writeChain(rest)
  return next
}

export function clearChain(): void {
  saveSettings({ chain_json: '', last_step_tool: loadSettings().last_step_tool === 'chain_ask' ? '' : loadSettings().last_step_tool })
}

const READ_FIRST = new Set(['poi', 'fuel', 'news', 'outlook', 'here', 'weather', 'warn', 'fx'])
const RUN_NOW = new Set([
  ...READ_FIRST,
  'hud',
  'drive',
  'identity',
  'help',
  'wont',
  'sky',
  'face',
])

export function partitionChain(parts: string[]): { reads: string[]; writes: string[] } {
  const reads: string[] = []
  const writes: string[] = []
  for (const part of parts) {
    const id = pickRouteFromCtx({
      conversationId: 'chain',
      text: part,
      lastTool: '',
      lastMedium: '',
      inDrive: false,
    })
    if (!id || RUN_NOW.has(id)) reads.push(part)
    else writes.push(part)
  }
  return { reads, writes }
}
