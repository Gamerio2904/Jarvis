import { useMemo, useRef, useState } from 'react'
import { TEST_COPY_GROUPS, type TestCopyItem } from './engine/test-copy'
import type { ToolMeta } from './engine/tools'
import {
  buildReport,
  judgeTurn,
  reportToText,
  selectedItems,
  stampFilename,
  type DebugTurn,
} from './engine/debug-run'

const OFF_BY_DEFAULT = new Set(['Fernseher & Film', 'PC Foto Notiz'])

export type DebugSendResult = { reply: string; tool?: ToolMeta | null; error?: string }

export function DebugPanel({
  onSend,
  onStartChat,
  busy,
}: {
  onSend: (text: string) => Promise<DebugSendResult | string | void>
  onStartChat: (title: string) => Promise<string>
  busy: boolean
}) {
  const [picked, setPicked] = useState<string[]>(() =>
    TEST_COPY_GROUPS.filter((g) => !OFF_BY_DEFAULT.has(g.title)).map((g) => g.title),
  )
  const [running, setRunning] = useState(false)
  const [warned, setWarned] = useState(false)
  const [progress, setProgress] = useState('')
  const [turns, setTurns] = useState<DebugTurn[]>([])
  const [stopped, setStopped] = useState(false)
  const stopRef = useRef(false)

  const items = useMemo(() => selectedItems(TEST_COPY_GROUPS, picked), [picked])
  const n = TEST_COPY_GROUPS.length

  function toggle(title: string) {
    setPicked((cur) => (cur.includes(title) ? cur.filter((t) => t !== title) : [...cur, title]))
  }

  async function run() {
    if (running || busy) return
    if (!picked.length) {
      setProgress('Mindestens eine Kategorie wählen.')
      return
    }
    if (!warned) {
      setWarned(true)
      setProgress(
        'Timer, Wecker, Kalender, Einkauf, Steckdose, Taschenlampe laufen wirklich. Anruf, SMS und Taxi warten auf Ja — der Lauf schickt kein automatisches Ja. App offen lassen (Home kann den Lauf killen). Nochmal Start bestätigt.',
      )
      return
    }
    stopRef.current = false
    setStopped(false)
    setRunning(true)
    setTurns([])
    const title = debugTitle()
    await onStartChat(title)
    const acc: DebugTurn[] = []
    let i = 0
    try {
      await navigator.wakeLock?.request?.('screen').catch(() => null)
    } catch {
      /* optional */
    }
    for (const item of items) {
      if (stopRef.current) break
      i += 1
      setProgress(`${i}/${items.length} · ${item.group} · ${item.label}`)
      const started = Date.now()
      const turn = await oneTurn(item, onSend, started)
      acc.push(turn)
      setTurns([...acc])
    }
    setStopped(stopRef.current)
    setRunning(false)
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

  return (
    <section className="settings-card">
      <h3>Debug</h3>
      <p className="settings-lead">
        Kategorien wählen, Start öffnet ein neues Gespräch. Download JSON + TXT mit Verdict. Bitte App offen lassen.
      </p>
      <div className="debug-box-bar">
        <button type="button" className="ghost-btn" disabled={running} onClick={() => setPicked(TEST_COPY_GROUPS.map((g) => g.title))}>
          Alle
        </button>
        <button type="button" className="ghost-btn" disabled={running} onClick={() => setPicked([])}>
          keine
        </button>
        <span className="settings-hint">
          {picked.length}/{n} · {items.length} Prompts
        </span>
      </div>
      <div className="debug-boxes">
        {TEST_COPY_GROUPS.map((g) => (
          <label key={g.title} className="debug-box-row">
            <input
              type="checkbox"
              checked={picked.includes(g.title)}
              disabled={running}
              onChange={() => toggle(g.title)}
            />
            <span>
              {g.title}
              <small>
                {' '}
                {g.items.length}
                {OFF_BY_DEFAULT.has(g.title) ? ' · default aus' : ''}
              </small>
            </span>
          </label>
        ))}
      </div>
      <p className="settings-hint">
        Writes sind echt. Hausstand-Import nicht im Katalog. PC/TV default aus — ehrlicher Fehler zählt als skip.
      </p>
      <div className="debug-actions">
        <button type="button" className="retry-btn" disabled={running || busy} onClick={() => void run()}>
          {running ? 'Läuft…' : warned ? 'Wirklich starten' : 'Start'}
        </button>
        <button type="button" className="ghost-btn" disabled={!running} onClick={stop}>
          Stop
        </button>
        <button type="button" className="ghost-btn" disabled={!turns.length} onClick={download}>
          Chat herunterladen
        </button>
      </div>
      {progress ? <p className="debug-progress">{progress}</p> : null}
      {turns.length ? (
        <pre className="debug-log">
          {turns
            .slice(-8)
            .map((t) => `${t.verdict.toUpperCase()} · ${t.group} · ${t.label}\nSie: ${t.prompt}\nJarvis: ${t.reply}`)
            .join('\n\n')}
        </pre>
      ) : null}
    </section>
  )
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
    const result: DebugSendResult =
      typeof raw === 'string' || raw == null ? { reply: raw || '' } : raw
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
