import { isCommNo, isCommYes } from './places-parse.ts'
import { pickRouteFromCtx } from './route-pick.ts'
import { normalizeUtterance } from './utterance.ts'

/** Offene Ja/Nein-Nachfrage gibt nach, sobald ein anderer Parser greift. */
export function pendingYields(text: string, keep: string | string[]): boolean {
  if (isCommYes(text) || isCommNo(text)) return false
  const keepSet = new Set(typeof keep === 'string' ? [keep] : keep)
  const id = pickRouteFromCtx({
    conversationId: 'pending',
    text: normalizeUtterance(text),
    lastTool: '',
    lastMedium: '',
    inDrive: false,
    weatherLast: null,
  })
  return Boolean(id && !keepSet.has(id))
}
