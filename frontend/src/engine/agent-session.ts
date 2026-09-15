/** Welche Agenten in dieser Sitzung wirklich gelaufen sind — nicht der ganze Katalog. */

const KEY = 'jarvis_used_agents'
const TORCH_KEY = 'jarvis_torch_on'
const EYE_KEY = 'jarvis_last_eye_image'

function readList(key: string): string[] {
  try {
    const raw = sessionStorage.getItem(key)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string' && x.trim()) : []
  } catch {
    return []
  }
}

export function markUsedAgent(id: string): void {
  const next = id.trim()
  if (!next) return
  const set = new Set(readList(KEY))
  set.add(next)
  try {
    sessionStorage.setItem(KEY, JSON.stringify([...set]))
  } catch {
    /* quota */
  }
}

export function usedAgentIds(): Set<string> {
  return new Set(readList(KEY))
}

export function usedAgentsKey(): string {
  return [...usedAgentIds()].sort().join(',')
}

export function readTorchOn(): boolean {
  try {
    return sessionStorage.getItem(TORCH_KEY) === '1'
  } catch {
    return false
  }
}

export function saveTorchOn(on: boolean): void {
  try {
    sessionStorage.setItem(TORCH_KEY, on ? '1' : '0')
  } catch {
    /* quota */
  }
}

export function readLastEyeImage(): string {
  try {
    return sessionStorage.getItem(EYE_KEY) || ''
  } catch {
    return ''
  }
}

export function saveLastEyeImage(dataUrl: string): void {
  if (!dataUrl.startsWith('data:image/')) return
  try {
    sessionStorage.setItem(EYE_KEY, dataUrl)
  } catch {
    try {
      sessionStorage.removeItem(EYE_KEY)
    } catch {
      /* quota */
    }
  }
}
