import { loadSettings, saveSettings } from './store.ts'

export type WorkLine = { key: string; line: string }

const MAX = 8

function dumpLike(t: string): boolean {
  if (/^\s*gefunden:/i.test(t)) return true
  const colons = (t.match(/:\s/g) || []).length
  return colons >= 4 && t.length > 100
}

export function loadWorkingMemory(): WorkLine[] {
  try {
    const raw = loadSettings().working_memory_json
    if (!raw) return []
    const arr = JSON.parse(raw) as WorkLine[]
    return Array.isArray(arr) ? arr.slice(0, MAX) : []
  } catch {
    return []
  }
}

export function saveWorkingMemory(rows: WorkLine[]): void {
  saveSettings({ working_memory_json: JSON.stringify(rows.slice(0, MAX)) })
}

export function upsertWorking(key: string, line: string): void {
  const clean = line.replace(/\s+/g, ' ').trim().slice(0, 160)
  if (!clean) return
  const rows = loadWorkingMemory().filter((r) => r.key !== key)
  rows.unshift({ key, line: clean })
  saveWorkingMemory(rows)
}

export function workingBlock(): string {
  const rows = loadWorkingMemory()
  if (!rows.length) return ''
  return `Arbeitsgedächtnis (überschreiben, max ${MAX}):\n${rows.map((r) => `- ${r.line}`).join('\n')}`
}

export function noteTurn(role: string, text: string, tool?: string): void {
  const t = text.replace(/\s+/g, ' ').trim()
  if (!t || t.length < 4) return
  if (dumpLike(t)) return
  if (/^(hallo|hi|hey|danke|ok|okay|ja|nein)\b/i.test(t) && t.length < 24) return
  const key = tool || (role === 'user' ? 'user' : 'jarvis')
  upsertWorking(key === 'user' ? `u:${t.slice(0, 24)}` : key, t.slice(0, 120))
}
