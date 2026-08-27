import { useState } from 'react'
import { TEST_COPY_GROUPS } from './engine/test-copy'
import { listMessages } from './engine/store'

export function DebugPanel({
  onSend,
  conversationId,
  busy,
}: {
  onSend: (text: string) => Promise<string | void>
  conversationId: string | null
  busy: boolean
}) {
  const [cat, setCat] = useState(TEST_COPY_GROUPS[0]?.title || 'Smalltalk')
  const [running, setRunning] = useState(false)
  const [log, setLog] = useState('')
  const group = TEST_COPY_GROUPS.find((g) => g.title === cat) || TEST_COPY_GROUPS[0]

  async function run() {
    if (running || busy) return
    setRunning(true)
    setLog('')
    const lines: string[] = []
    for (const item of group.items) {
      lines.push(`Sie: ${item.text}`)
      setLog(lines.join('\n'))
      try {
        const reply = (await onSend(item.text)) || '—'
        lines.push(`Jarvis: ${reply}`)
      } catch (e) {
        lines.push(`Fehler: ${e instanceof Error ? e.message : 'fehlgeschlagen'}`)
      }
      setLog(lines.join('\n\n'))
    }
    setRunning(false)
  }

  async function download() {
    const id = conversationId
    const rows = id ? await listMessages(id) : []
    const body =
      (rows.length
        ? rows.map((m) => `${m.role === 'user' ? 'Sie' : 'Jarvis'}: ${m.content}`).join('\n\n')
        : log) || 'Leer.'
    const blob = new Blob([body], { type: 'text/plain;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `jarvis-debug-${cat.replace(/\s+/g, '-').toLowerCase()}.txt`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <section className="settings-card">
      <h3>Debug</h3>
      <p className="settings-lead">Kategorie, dann Start. Ein Gespräch, Prompt nach Prompt. Chat danach herunterladen.</p>
      <label className="settings-inline">
        <span>Kategorie</span>
        <select value={cat} onChange={(e) => setCat(e.target.value)} disabled={running}>
          {TEST_COPY_GROUPS.map((g) => (
            <option key={g.title} value={g.title}>
              {g.title}
            </option>
          ))}
        </select>
      </label>
      <p className="settings-hint">{group.items.length} Prompts · {group.items.map((i) => i.label).join(' · ')}</p>
      <div className="debug-actions">
        <button type="button" className="retry-btn" disabled={running || busy} onClick={() => void run()}>
          {running ? 'Läuft…' : 'Start'}
        </button>
        <button type="button" className="ghost-btn" disabled={running} onClick={() => void download()}>
          Chat herunterladen
        </button>
      </div>
      {log ? <pre className="debug-log">{log}</pre> : null}
    </section>
  )
}
