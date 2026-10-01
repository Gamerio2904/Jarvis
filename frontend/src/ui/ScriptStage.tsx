import { useEffect, useMemo, useState } from 'react'
import { CATALOG_STAND } from '../engine/feature-catalog.ts'
import { fileFor, PLAN_GAPS, saveProjectJson, type ProjectFileKind } from '../engine/project-docs.ts'
import { saveSettings, type Idea, type MemoryProposal } from '../engine/store.ts'
import type { IdeaSprint } from '../engine/idea-plan.ts'

type Line = { key: string; text: string }

function scriptLines(idea: Idea | undefined, phase: string): Line[] {
  if (!idea) return [{ key: 'BEREIT', text: 'Sagen Sie: Plane das: …' }]
  const plan = [...(idea.plan?.sprints || [])].sort((a, b) => Number(a.n) - Number(b.n))
  const out: Line[] = [{ key: 'PROJEKT', text: idea.title }]
  for (const step of plan[0]?.lieferumfang || []) out.push({ key: 'WEG', text: step.task })
  for (const sprint of plan) {
    out.push({ key: `SPRINT ${sprint.n}`, text: sprint.ziel?.trim() || sprint.title })
  }
  if (plan[0]?.lieferumfang?.length) {
    out.push({ key: 'FEHLT', text: PLAN_GAPS.map((gap) => gap.name).join(', ') })
  }
  out.push({
    key: 'STATUS',
    text: phase === 'go' ? 'Umgesetzt. Export ist bereit.' : 'Live. Wartet auf Go.',
  })
  return out
}

function useClock(): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])
  return now
}

export function ScriptStage({
  view,
  idea,
  termin,
  jobs,
  sources,
  modules,
  wire,
  proposals,
  phase,
  scriptAt,
  sprintSide,
  onStop,
  onYes,
  onNo,
}: {
  view: string
  idea?: Idea
  termin: string
  jobs: string[]
  sources: string[]
  modules: string[]
  wire: string[]
  proposals: MemoryProposal[]
  phase: string
  scriptAt: number
  sprintSide?: 'left' | 'right'
  onStop: () => void
  onYes: (id: string) => void
  onNo: (id: string) => void
}) {
  const now = useClock()
  const lines = useMemo(() => scriptLines(idea, phase), [idea, phase])
  const [shown, setShown] = useState(lines.length)
  const [exportNote, setExportNote] = useState('')
  const locked = phase === 'go'
  const live = phase === 'live'

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || locked || !scriptAt) {
      setShown(lines.length)
      return
    }
    const tick = () => {
      const n = Math.min(lines.length, Math.floor((Date.now() - scriptAt) / 420) + 1)
      setShown(Math.max(1, n))
    }
    tick()
    const id = window.setInterval(tick, 420)
    return () => window.clearInterval(id)
  }, [lines, scriptAt, locked])

  const sprints: IdeaSprint[] = [...(idea?.plan?.sprints || [])].sort((a, b) => Number(a.n) - Number(b.n))
  const wege = sprints[0]?.lieferumfang || []
  const clock = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  const visible = lines.slice(0, shown)
  const typing = live && shown < lines.length

  async function exportFile(kind: ProjectFileKind) {
    if (!idea || !locked) return
    const file = fileFor(idea, kind)
    const saved = await saveProjectJson(file.name, file.data)
    setExportNote(saved)
  }

  function focus(next: string) {
    saveSettings({ tischplatte_on: true, tischplatte_view: next })
  }

  return (
    <section className={`script-desk${locked ? ' is-go' : ''}${live ? ' is-live' : ''}`} aria-label="Skripttafel">
      <svg className="script-rings" viewBox="0 0 400 400" aria-hidden>
        <circle cx="200" cy="200" r="150" />
        <circle cx="200" cy="200" r="108" />
        <circle cx="200" cy="200" r="64" />
        <path d="M200 28v28M200 344v28M28 200h28M344 200h28" />
      </svg>
      <header className="script-bar">
        <p className="script-clock">{clock}</p>
        <div className="script-title">
          <p className="script-kicker">Auftrag</p>
          <h2>{idea ? idea.title : 'Noch kein Skript'}</h2>
        </div>
        <p className={`script-phase${locked ? ' is-go' : ''}`}>{locked ? 'Fest' : live ? 'Live' : 'Bereit'}</p>
      </header>
      <div className={`script-body${sprintSide === 'right' ? ' is-sprints-right' : ''}`}>
        <ol className="script-lines" aria-live="polite">
          {visible.map((line, i) => (
            <li key={`${line.key}-${i}`} className={i === visible.length - 1 && typing ? 'is-typing' : ''}>
              <span>{line.key}</span>
              <strong>{line.text}</strong>
            </li>
          ))}
        </ol>
        <aside className="script-side" aria-label="Plan">
          <div className="script-focus" role="group" aria-label="Sicht">
            <button type="button" className={view === 'sprints' ? 'is-on' : ''} onClick={() => focus('sprints')}>
              Sprints
            </button>
            <button type="button" className={view === 'psp' ? 'is-on' : ''} onClick={() => focus('psp')}>
              PSP
            </button>
            <button type="button" className={view === 'research' ? 'is-on' : ''} onClick={() => focus('research')}>
              Quellen
            </button>
          </div>
          {view === 'research' ? (
            <ul>
              {sources.length ? (
                sources.map((s) => <li key={s}>{s}</li>)
              ) : (
                <li>Keine Quelle im Store. Die Wege stehen im Satz. Sag Such, dann kommt eine Quelle dazu.</li>
              )}
            </ul>
          ) : view === 'sim' ? (
            <ul>
              {(wire.length ? wire : ['Drahtgitter, keine Live-App.']).map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          ) : view === 'modules' ? (
            <ul>
              {modules.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          ) : (
            <>
              {wege.length ? (
                <ol className="script-wege">
                  {wege.map((weg, i) => (
                    <li key={weg.id}>
                      <span>W{i + 1}</span>
                      <strong>{weg.task}</strong>
                    </li>
                  ))}
                </ol>
              ) : null}
              {wege.length ? (
                <p className="script-gap">Fehlt noch: {PLAN_GAPS.map((gap) => gap.name).join(', ')}.</p>
              ) : null}
              <ol className="script-psp">
              {sprints.length ? (
                sprints.map((s) => (
                  <li key={s.n}>
                    <span>{s.n}</span>
                    <strong>{s.title}</strong>
                    <em>{s.ziel?.trim() || 'Noch leer.'}</em>
                  </li>
                ))
              ) : (
                <li>
                  <span>—</span>
                  <strong>Leer</strong>
                  <em>Plane das: … schreibt das Skript.</em>
                </li>
              )}
            </ol>
            </>
          )}
          <div className="script-export">
            <button type="button" disabled={!locked || !idea} onClick={() => void exportFile('psp')}>
              PSP
            </button>
            <button type="button" disabled={!locked || !idea} onClick={() => void exportFile('sprints')}>
              Sprints
            </button>
            <button type="button" disabled={!locked || !idea} onClick={() => void exportFile('all')}>
              Alles
            </button>
          </div>
          <p className="script-export-note">{exportNote || (locked ? 'Export ist bereit.' : 'Export nach Go.')}</p>
        </aside>
      </div>
      {proposals.length ? (
        <ul className="script-asks">
          {proposals.slice(0, 2).map((p) => (
            <li key={p.id}>
              <span>{p.text}</span>
              <button type="button" onClick={() => onYes(p.id)}>
                Ja
              </button>
              <button type="button" onClick={() => onNo(p.id)}>
                Nein
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <footer className="script-foot">
        <p>{termin}</p>
        <p className="script-stand">Planung · festes Skript · Stand {CATALOG_STAND}</p>
        {jobs.length ? (
          <button type="button" className="script-jobs" onClick={onStop}>
            {jobs[0]} · stoppen
          </button>
        ) : (
          <p>{locked ? 'Umgesetzt. Export ist bereit.' : 'Sagen Sie Go, Umsetzen oder Leg los.'}</p>
        )}
        {locked ? <b className="script-stamp">Fest</b> : null}
      </footer>
    </section>
  )
}
