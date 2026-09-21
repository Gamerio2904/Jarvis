import { TEST_COPY_GROUPS, type TestCopyItem } from './test-copy.ts'
import {
  buildReport,
  judgeTurn,
  reportToText,
  selectedItems,
  stampFilename,
  type DebugTurn,
} from './debug-run.ts'
import { historyExport } from './history.ts'
import { loadSettings, saveSettings } from './store.ts'
import { setKeepScreenOn, startDebugFg, stopDebugFg, onDebugStop } from '../native/voice.ts'
import type { ToolMeta } from './tools.ts'
import { captureHouse, restoreHouse, type HouseSnap } from './debug-house.ts'
import { setDebugRunActive } from './debug-flag.ts'

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

const DEBUG_EVENT = 'jarvis-debug'

const OFF_BY_DEFAULT = new Set(['Fernseher & Film', 'PC'])
const TURN_TIMEOUT_MS = 90_000
const PERSIST_KEY_TURNS = 80

export const DEBUG_START_WARN =
  'Timer, Wecker, Kalender, Einkauf, Steckdose, Taschenlampe laufen wirklich — danach räumt Jarvis sie weg. Anruf, SMS und Taxi warten auf Ja — der Lauf schickt kein automatisches Ja. Settings gehen zu — der Debug-Chat bleibt als Dock über CarPlay und Overlays. Home lässt den Lauf in der Meldung „Jarvis testet…“ weiterlaufen. App schließen oder Stop in der Meldung beendet ihn. Nochmal Start bestätigt.'

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
let houseSnap: HouseSnap | null = null
let restoring = false
const listeners = new Set<() => void>()

restore()

function emit() {
  for (const fn of listeners) fn()
  persist()
  try {
    window.dispatchEvent(new CustomEvent(DEBUG_EVENT, { detail: debugSnapshot() }))
  } catch {
    /* node tests */
  }
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

export function subscribeDebug(fn: (snap: DebugSnapshot) => void): () => void {
  const local = () => fn(debugSnapshot())
  listeners.add(local)
  const onWin = (e: Event) => {
    const d = (e as CustomEvent<DebugSnapshot>).detail
    fn(d || debugSnapshot())
  }
  try {
    window.addEventListener(DEBUG_EVENT, onWin)
  } catch {
    /* node tests */
  }
  return () => {
    listeners.delete(local)
    try {
      window.removeEventListener(DEBUG_EVENT, onWin)
    } catch {
      /* ignore */
    }
  }
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

onDebugStop(() => requestDebugStop())

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
    progress = DEBUG_START_WARN
    emit()
    return
  }
  const token = ++runToken
  stopFlag = false
  stopped = false
  error = null
  turns = []
  live = true
  houseSnap = null
  phase = 'starting'
  setDebugRunActive(true)
  progress = 'Gespräch…'
  emit()
  try {
    await navigator.wakeLock?.request?.('screen').catch(() => null)
  } catch {
    /* optional */
  }
  void setKeepScreenOn(true)
  void startDebugFg()
  try {
    conversationId = await opts.onStartChat(debugTitle())
    if (token !== runToken) return
    houseSnap = await captureHouse()
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
    setDebugRunActive(false)
    if (houseSnap && !restoring) {
      restoring = true
      try {
        await restoreHouse(houseSnap)
        progress = `${progress} Hausstand zurückgesetzt.`
        emit()
      } catch (e) {
        error = e instanceof Error ? e.message : 'Restore fehlgeschlagen'
        progress = `${progress} Restore: ${error}`
        emit()
      } finally {
        restoring = false
        houseSnap = null
      }
    }
    void stopDebugFg()
    void setKeepScreenOn(false)
  }
}

export async function downloadDebug(): Promise<string> {
  const snap = debugSnapshot()
  const rep = buildReport({ categories: snap.picked, turns: snap.turns, stopped: snap.stopped || stopFlag })
  const stamp = stampFilename()
  await saveReport(`${stamp}.json`, JSON.stringify(rep, null, 2), 'application/json')
  return saveReport(`${stamp}.txt`, reportToText(rep), 'text/plain;charset=utf-8')
}

/**
 * Die Sitzungs-Historie als Datei — gedacht für „er hat vorhin Unsinn
 * geredet". Läuft nur auf Knopfdruck, damit ein Debug-Werkzeug keinen Zug
 * verlangsamt.
 */
export async function downloadHistory(): Promise<string> {
  return saveReport(`${stampFilename()}-historie.json`, historyExport(), 'application/json')
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

async function saveReport(name: string, body: string, type: string): Promise<string> {
  try {
    const { saveToDownloads } = await import('../native/device.ts')
    const native = await saveToDownloads(name, body)
    if (native.ok) return `Gespeichert in Downloads/${name}.`
  } catch {
    /* browser */
  }
  const blob = new Blob([body], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 4000)
  return `Gespeichert als ${name}.`
}
