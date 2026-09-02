import { useEffect, useMemo, useState } from 'react'
import { TEST_COPY_GROUPS } from './engine/test-copy'
import {
  debugSnapshot,
  downloadDebug,
  markDebugWarned,
  requestDebugStop,
  setDebugPicked,
  startDebugRun,
  subscribeDebug,
  type DebugSendResult,
} from './engine/debug-session'

const OFF_BY_DEFAULT = new Set(['Fernseher & Film', 'PC Foto Notiz'])

export type { DebugSendResult }

export function DebugPanel({
  onSend,
  onStartChat,
  busy,
}: {
  onSend: (text: string, conversationId: string) => Promise<DebugSendResult | string | void>
  onStartChat: (title: string) => Promise<string>
  busy: boolean
}) {
  const [snap, setSnap] = useState(debugSnapshot)
  useEffect(() => subscribeDebug(() => setSnap(debugSnapshot())), [])

  const items = useMemo(() => {
    const want = new Set(snap.picked)
    return TEST_COPY_GROUPS.filter((g) => want.has(g.title)).reduce((n, g) => n + g.items.length, 0)
  }, [snap.picked])
  const n = TEST_COPY_GROUPS.length
  const running = snap.running

  function toggle(title: string) {
    const cur = snap.picked
    setDebugPicked(cur.includes(title) ? cur.filter((t) => t !== title) : [...cur, title])
  }

  async function run() {
    if (running || busy) return
    if (!snap.warned) {
      markDebugWarned()
      return
    }
    await startDebugRun({ onStartChat, onSend })
  }

  return (
    <section className="settings-card">
      <h3>Debug</h3>
      <p className="settings-lead">
        Kategorien wählen, Start öffnet ein neues Gespräch. Der Lauf bleibt aktiv, wenn Sie zu Chat oder einem
        anderen Thema wechseln — zurückkehren und Download. Stop bricht zwischen den Turns ab. Ein einzelner
        Timeout zerstört nicht den Rest. Einzelne V1–V9-Prompts selbst tippen: Thema Probe.
      </p>
      <div className="debug-box-bar">
        <button type="button" className="ghost-btn" disabled={running} onClick={() => setDebugPicked(TEST_COPY_GROUPS.map((g) => g.title))}>
          Alle
        </button>
        <button type="button" className="ghost-btn" disabled={running} onClick={() => setDebugPicked([])}>
          keine
        </button>
        <span className="settings-hint">
          {snap.picked.length}/{n} · {items} Prompts
        </span>
      </div>
      <div className="debug-boxes">
        {TEST_COPY_GROUPS.map((g) => (
          <label key={g.title} className="debug-box-row">
            <input
              type="checkbox"
              checked={snap.picked.includes(g.title)}
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
        {snap.phase !== 'idle' ? ` Status: ${snap.phase}.` : ''}
      </p>
      <div className="debug-actions">
        <button type="button" className="retry-btn" disabled={running || busy} onClick={() => void run()}>
          {running ? 'Läuft…' : snap.warned ? 'Wirklich starten' : 'Start'}
        </button>
        <button type="button" className="ghost-btn" disabled={!running} onClick={requestDebugStop}>
          Stop
        </button>
        <button type="button" className="ghost-btn" disabled={!snap.turns.length} onClick={downloadDebug}>
          Chat herunterladen
        </button>
      </div>
      {snap.progress ? <p className="debug-progress">{snap.progress}</p> : null}
      {snap.error ? <p className="settings-hint setup-error">{snap.error}</p> : null}
      {snap.turns.length ? (
        <pre className="debug-log">
          {snap.turns
            .slice(-8)
            .map((t) => `${t.verdict.toUpperCase()} · ${t.group} · ${t.label}\nSie: ${t.prompt}\nJarvis: ${t.reply}`)
            .join('\n\n')}
        </pre>
      ) : null}
    </section>
  )
}
