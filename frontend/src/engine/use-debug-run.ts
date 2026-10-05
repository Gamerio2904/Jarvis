import { useMemo, useRef, useState } from 'react'
import { TEST_COPY_GROUPS, type TestCopyItem } from './test-copy'
import type { ToolMeta } from './tools'
import {
  buildReport,
  judgeTurn,
  reportToText,
  selectedItems,
  stampFilename,
  type DebugTurn,
} from './debug-run'
import { setKeepScreenOn } from '../native/voice'

export const DEBUG_OFF_BY_DEFAULT = new Set(['Fernseher & Film', 'PC Foto Notiz'])

export type DebugSendResult = { reply: string; tool?: ToolMeta | null; error?: string }

export type DebugRunApi = {
  picked: string[]
  toggle: (title: string) => void
  setAll: (on: boolean) => void
  running: boolean
  warned: boolean
  progress: string
  turns: DebugTurn[]
  items: Array<TestCopyItem & { group: string }>
  groupCount: number
  run: () => void
  stop: () => void
  download: () => void
}

export function useDebugRun(opts: {
  onSend: (text: string) => Promise<DebugSendResult | string | void>
  onStartChat: (title: string) => Promise<string>
  busy: boolean
  /** Einstellungen zu, Overlay darf auf — der Debug-Chat bleibt im Dock. */
  onBegin?: () => void
}): DebugRunApi {
  const [picked, setPicked] = useState<string[]>(() =>
    TEST_COPY_GROUPS.filter((g) => !DEBUG_OFF_BY_DEFAULT.has(g.title)).map((g) => g.title),
  )
  const [running, setRunning] = useState(false)
  const [warned, setWarned] = useState(false)
  const [progress, setProgress] = useState('')
  const [turns, setTurns] = useState<DebugTurn[]>([])
  const [stopped, setStopped] = useState(false)
  const stopRef = useRef(false)

  const items = useMemo(() => selectedItems(TEST_COPY_GROUPS, picked), [picked])

  function toggle(title: string) {
    setPicked((cur) => (cur.includes(title) ? cur.filter((t) => t !== title) : [...cur, title]))
  }

  function setAll(on: boolean) {
    setPicked(on ? TEST_COPY_GROUPS.map((g) => g.title) : [])
  }

  async function run() {
    if (running || opts.busy) return
    if (!picked.length) {
      setProgress('Mindestens eine Kategorie wählen.')
      return
    }
    if (!warned) {
      setWarned(true)
      setProgress(
        'Timer, Wecker, Kalender, Einkauf, Steckdose, Taschenlampe laufen wirklich. Anruf, SMS und Taxi warten auf Ja — der Lauf schickt kein automatisches Ja. App offen lassen (Home kann den Lauf killen). Overlays wie CarPlay dürfen aufgehen — der Debug-Chat bleibt sichtbar. Nochmal Start bestätigt.',
      )
      return
    }
    stopRef.current = false
    setStopped(false)
    setRunning(true)
    setTurns([])
    opts.onBegin?.()
    await opts.onStartChat(debugTitle())
    const acc: DebugTurn[] = []
    let i = 0
    try {
      await navigator.wakeLock?.request?.('screen').catch(() => null)
    } catch {
      /* optional */
    }
    void setKeepScreenOn(true)
    for (const item of items) {
      if (stopRef.current) break
      i += 1
      setProgress(`${i}/${items.length} · ${item.group} · ${item.label}`)
      const started = Date.now()
      const turn = await oneTurn(item, opts.onSend, started)
      acc.push(turn)
      setTurns([...acc])
    }
    setStopped(stopRef.current)
    setRunning(false)
    void setKeepScreenOn(false)
    setProgress(stopRef.current ? `Stop nach ${acc.length} Turns.` : `Fertig · ${acc.length} Turns.`)
  }

  function stop() {
    stopRef.current = true
  }

  function download() {
    const rep = buildReport({ categories: picked, turns, stopped: stopped || stopRef.current })
    const stamp = stampFilename()
    saveBlob(`${stamp}.json`, JSON.stringify(rep, null, 2), 'application/json')
    saveBlob(`${stamp}.txt`, reportToText(rep), 'text/plain;charset=utf-8')
  }

  return {
    picked,
    toggle,
    setAll,
    running,
    warned,
    progress,
    turns,
    items,
    groupCount: TEST_COPY_GROUPS.length,
    run: () => void run(),
    stop,
    download,
  }
}

function debugTitle(at = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `Debug ${at.getFullYear()}-${p(at.getMonth() + 1)}-${p(at.getDate())} ${p(at.getHours())}:${p(at.getMinutes())}`
}

async function oneTurn(
  item: TestCopyItem & { group: string },
  onSend: (text: string) => Promise<DebugSendResult | string | void>,
  started: number,
): Promise<DebugTurn> {
  try {
    const raw = await onSend(item.text)
    const result: DebugSendResult = typeof raw === 'string' || raw == null ? { reply: raw || '' } : raw
    const tool = result.tool || undefined
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
      verdict: judgeTurn(item, result.reply || '', tool, result.error),
      error: result.error,
    }
  } catch (e) {
    const error = e instanceof Error ? e.message : 'fehlgeschlagen'
    return {
      group: item.group,
      label: item.label,
      prompt: item.text,
      reply: '',
      ms: Date.now() - started,
      expect: item.expect,
      verdict: judgeTurn(item, '', null, error),
      error,
    }
  }
}

function saveBlob(name: string, body: string, type: string) {
  const blob = new Blob([body], { type })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  URL.revokeObjectURL(a.href)
}
