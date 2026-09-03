import type { ToolMeta } from '../engine/tools'

type ChipMessage = {
  role?: string
  meta?: { tool?: ToolMeta } | Record<string, unknown> | null
}

function toolFrom(meta: ChipMessage['meta']): ToolMeta | undefined {
  if (!meta || typeof meta !== 'object' || !('tool' in meta)) return undefined
  const tool = (meta as { tool?: ToolMeta }).tool
  return tool && typeof tool === 'object' ? tool : undefined
}

/** HUD-Layout ist die Lage-Fläche selbst. Gleiche Chips hintereinander sind Rauschen. */
export function hideToolChip(prev: ChipMessage | undefined, tool: ToolMeta): boolean {
  if (tool.tool === 'hud' && (tool.action === 'layout' || tool.label === 'Lage')) return true
  if (prev?.role !== 'assistant') return false
  const prior = toolFrom(prev.meta)
  if (!prior) return false
  return (
    prior.tool === tool.tool &&
    (prior.label || '') === (tool.label || '') &&
    (prior.action || '') === (tool.action || '')
  )
}
