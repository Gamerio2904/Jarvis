import { useEffect, useState } from 'react'
import { AGENT_META } from '../../engine/agents/meta.ts'
import {
  historyExport,
  historyLine,
  historyTurns,
  subscribeHistory,
  type HistoryTurn,
} from '../../engine/history.ts'

function agentLabel(id: string): string {
  return AGENT_META[id]?.label || id
}

function Detail({ t }: { t: HistoryTurn }) {
  const times = [
    t.msFirstToken != null ? `Hirn ${t.msFirstToken} ms` : '',
    t.msFirstAudio != null ? `Stimme ${t.msFirstAudio} ms` : '',
    `gesamt ${t.msTotal} ms`,
  ].filter(Boolean)
  const tight = t.quota.filter((q) => q.blocked || (q.remainingRequests ?? 1) <= 0)
  return (
    <div className="turn-detail">
      <p className="turn-said">
        <strong>Du:</strong> {t.text}
      </p>
      <p className="turn-said">
        <strong>Jarvis:</strong> {t.reply || '—'}
      </p>
      <p className="lage-hint">
        {t.path} · {times.join(' · ')}
      </p>
      {t.steps.length ? (
        <ol className="turn-steps">
          {t.steps.map((s, i) => (
            <li key={`${s.agent}-${s.phase}-${i}`} className={s.ok ? '' : 'is-bad'}>
              <span>
                {agentLabel(s.agent)} · {s.phase}
              </span>
              <span>{s.ms} ms</span>
              {s.detail ? <em>{s.detail}</em> : null}
            </li>
          ))}
        </ol>
      ) : null}
      {t.brain.length ? (
        <p className="lage-hint">{t.brain.map((b) => `${b.slot}: ${b.model}${b.ok ? '' : ' ✗'}`).join(' · ')}</p>
      ) : null}
      {tight.length ? (
        <p className="lage-hint">Kontingent knapp: {tight.map((q) => q.provider).join(', ')}</p>
      ) : null}
    </div>
  )
}

/**
 * Die letzten Züge dieser Sitzung. Nur gelesen — kein Zug wird hier
 * wiederholt, kein Gerät startet.
 */
export function TurnHistory() {
  const [, tick] = useState(0)
  const [openTurn, setOpenTurn] = useState<number | null>(null)
  useEffect(() => subscribeHistory(() => tick((n) => n + 1)), [])

  /** Bewusst bei jedem Bild neu: 50 Einträge umdrehen kostet nichts, und der
   *  Puffer liegt außerhalb von React. */
  const turns = historyTurns().reverse()
  if (!turns.length) {
    return (
      <div className="turn-history">
        <p className="lage-hint">Noch keine Züge in dieser Sitzung.</p>
      </div>
    )
  }

  function copyExport() {
    void navigator.clipboard?.writeText(historyExport())
  }

  return (
    <div className="turn-history">
      <div className="turn-history-head">
        <strong>Letzte Züge ({turns.length})</strong>
        <button type="button" className="lage-tab" onClick={copyExport}>
          Export
        </button>
      </div>
      <ul className="turn-list">
        {turns.map((t, i) => (
          <li key={`${t.turn}-${t.at}-${i}`}>
            <button
              type="button"
              className={`turn-row${openTurn === t.turn ? ' is-on' : ''}`}
              onClick={() => setOpenTurn(openTurn === t.turn ? null : t.turn)}
              aria-expanded={openTurn === t.turn}
            >
              <span>{historyLine(t)}</span>
              <em>{t.text}</em>
            </button>
            {openTurn === t.turn ? <Detail t={t} /> : null}
          </li>
        ))}
      </ul>
    </div>
  )
}
