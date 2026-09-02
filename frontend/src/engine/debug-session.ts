import { TEST_COPY_GROUPS, type TestCopyItem } from './test-copy'
import {
  buildReport,
  judgeTurn,
  reportToText,
  selectedItems,
  stampFilename,
  type DebugTurn,
} from './debug-run'
import { loadSettings, saveSettings } from './store'
import { setKeepScreenOn } from '../native/voice'
import type { ToolMeta } from './tools'

export type DebugPhase = 'idle' | 'starting' | 'running' | 'stopping'
export type OverlayPhase = 'closed' | 'opening' | 'open' | 'closing'

export type DebugSendResult = { reply: string; tool?: { tool_status?: string; tool?: string; action?: string; label?: string } | null; error?: string }

export type DebugSnapshot = {
  phase: DebugPhase
  overlay: OverlayPhase
  running: boolean
  stopped: boolean
  progress: string
  turns: DebugTurn[]
  picked: string[]
  conversationId: string | null
  error: string | null
  warned: boolean
  live: boolean
}

const OFF_BY_DEFAULT = new Set(['Fernseher & Film', 'PC Foto Notiz'])
const TURN_TIMEOUT_MS = 90_000
const PERSIST_KEY_TURNS = 80

type Persist = {
  phase: DebugPhase
  picked: string[]
  turns: DebugTurn[]
  conversationId: string | null
  stopped: boolean
  progress: string
  at: string
}

let phase: DebugPhase = 'idle'
let overlay: OverlayPhase = 'closed'
let warned = false
let stopped = false
let progress = ''
let turns: DebugTurn[] = []
let picked: string[] = TEST_COPY_GROUPS.filter((g) => !OFF_BY_DEFAULT.has(g.title)).map((g) => g.title)
let conversationId: string | null = null
let error: string | null = null
let stopFlag = false
let runToken = 0
let live = false
const listeners = new Set<() => void>()

restore()

function emit() {
  for (const fn of listeners) fn()
  persist()
}

function persist() {
  if (phase === 'idle' && !turns.length) return
  const payload: Persist = {
    phase: phase === 'starting' || phase === 'running' || phase === 'stopping' ? phase : 'idle',
    picked,
    turns: turns.slice(-PERSIST_KEY_TURNS),
    conversationId,
    stopped,
    progress,
    at: new Date().toString(),
  }
  try {
    saveSettings({ last_debug_json: JSON.stringify(payload) })
  } catch {
    /* quota */
  }
}

function restore() {
  try {
    const raw = loadSettings().last_debug_json
    if (!raw) return
    const p = JSON.parse(raw) as Persist
    if (!p || !Array.isArray(p.turns)) return
    picked = Array.isArray(p.picked) && p.picked.length ? p.picked : picked
    turns = p.turns
    conversationId = p.conversationId || null
    stopped = Boolean(p.stopped)
    progress = p.progress || ''
    if (p.phase === 'running' || p.phase === 'starting' || p.phase === 'stopping') {
      phase = 'idle'
      stopped = true
      progress = progress || 'Lauf unterbrochen — Download bleibt.'
    }
  } catch {
    /* ignore */
  }
}

export function subscribeDebug(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function debugSnapshot(): DebugSnapshot {
  return {
    phase,
    overlay,
    running: phase === 'starting' || phase === 'running',
    stopped,
    progress,
    turns,
    picked,
    conversationId,
    error,
    warned,
    live,
  }
}

export function setDebugPicked(next: string[]) {
  if (phase === 'running' || phase === 'starting') return
  picked = next
  emit()
}

export function markDebugWarned() {
  warned = true
  emit()
}

export function setDebugOverlay(next: OverlayPhase) {
  overlay = next
  emit()
}

export function requestDebugStop() {
  stopFlag = true
  if (phase === 'running' || phase === 'starting') phase = 'stopping'
  emit()
}

export function debugTitle(at = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `Debug ${at.getFullYear()}-${p(at.getMonth() + 1)}-${p(at.getDate())} ${p(at.getHours())}:${p(at.getMinutes())}`
}

export async function startDebugRun(opts: {
  onStartChat: (title: string) => Promise<string>
  onSend: (text: string, conversationId: string) => Promise<DebugSendResult | string | void>
}): Promise<void> {
  if (phase === 'running' || phase === 'starting') return
  if (!picked.length) {
    progress = 'Mindestens eine Kategorie wählen.'
    emit()
    return
  }
  if (!warned) {
    warned = true
    progress =
      'Timer, Wecker, Kalender, Einkauf, Steckdose, Taschenlampe laufen wirklich. Anruf, SMS und Taxi warten auf Ja — der Lauf schickt kein automatisches Ja. Settings gehen zu — der Debug-Chat bleibt als Dock über CarPlay und Overlays. Home kann den Lauf killen. Nochmal Start bestätigt.'
    emit()
    return
  }
  const token = ++runToken
  stopFlag = false
  stopped = false
  error = null
  turns = []
  live = true
  phase = 'starting'
  progress = 'Gespräch…'
  emit()
  try {
    await navigator.wakeLock?.request?.('screen').catch(() => null)
  } catch {
    /* optional */
  }
  void setKeepScreenOn(true)
  try {
    conversationId = await opts.onStartChat(debugTitle())
    if (token !== runToken) return
    phase = 'running'
    emit()
    const items = selectedItems(TEST_COPY_GROUPS, picked)
    const acc: DebugTurn[] = []
    let i = 0
    for (const item of items) {
      if (token !== runToken || stopFlag) break
      i += 1
      progress = `${i}/${items.length} · ${item.group} · ${item.label}`
      emit()
      const started = Date.now()
      const turn = await oneTurn(item, (text) => opts.onSend(text, conversationId || ''), started)
      if (token !== runToken) break
      acc.push(turn)
      turns = [...acc]
      emit()
    }
    stopped = stopFlag
    phase = 'idle'
    progress = stopFlag ? `Stop nach ${acc.length} Turns. Download bleibt.` : `Fertig · ${acc.length} Turns.`
    emit()
  } catch (e) {
    error = e instanceof Error ? e.message : 'Debug-Lauf fehlgeschlagen'
    phase = 'idle'
    stopped = true
    progress = `Abbruch: ${error}. Bisherige Turns bleiben zum Download.`
    emit()
  } finally {
    void setKeepScreenOn(false)
  }
}

export function downloadDebug() {
  const snap = debugSnapshot()
  const rep = buildReport({ categories: snap.picked, turns: snap.turns, stopped: snap.stopped || stopFlag })
  const stamp = stampFilename()
  saveBlob(`${stamp}.json`, JSON.stringify(rep, null, 2), 'application/json')
  saveBlob(`${stamp}.txt`, reportToText(rep), 'text/plain;charset=utf-8')
}

async function oneTurn(
  item: TestCopyItem & { group: string },
  onSend: (text: string) => Promise<DebugSendResult | string | void>,
  started: number,
): Promise<DebugTurn> {
  try {
    const raw = await withTimeout(Promise.resolve(onSend(item.text)), TURN_TIMEOUT_MS, item.label)
    const result: DebugSendResult =
      typeof raw === 'string' || raw == null ? { reply: raw || '', error: raw ? undefined : 'leere Antwort' } : raw
    const tool = result.tool || undefined
    const error = result.error || (!result.reply && !tool ? 'keine Antwort' : undefined)
    const meta: ToolMeta | undefined = tool?.tool
      ? {
          tool_status: (tool.tool_status as ToolMeta['tool_status']) || 'executed',
          tool: tool.tool,
          action: tool.action || '',
          label: tool.label || '',
        }
      : undefined
    return {
      group: item.group,
      label: item.label,
      prompt: item.text,
      reply: result.reply || '',
      ms: Date.now() - started,
      tool: tool
        ? { status: tool.tool_status, id: tool.tool, action: tool.action, label: tool.label }
        : undefined,
      expect: item.expect,
      verdict: judgeTurn(item, result.reply || '', meta, error),
      error,
    }
  } catch (e) {
    const err = e instanceof Error ? e.message : 'fehlgeschlagen'
    return {
      group: item.group,
      label: item.label,
      prompt: item.text,
      reply: '',
      ms: Date.now() - started,
      expect: item.expect,
      verdict: judgeTurn(item, '', null, err),
      error: err,
    }
  }
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = window.setTimeout(() => reject(new Error(`Timeout nach ${Math.round(ms / 1000)} s · ${label}`)), ms)
    p.then(
      (v) => {
        window.clearTimeout(t)
        resolve(v)
      },
      (e) => {
        window.clearTimeout(t)
        reject(e)
      },
    )
  })
}

function saveBlob(name: string, body: string, type: string) {
  const blob = new Blob([body], { type })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  URL.revokeObjectURL(a.href)
}
