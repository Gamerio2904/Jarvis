import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { CATALOG_STAND } from '../engine/feature-catalog.ts'
import {
  downloadTextFile,
  fileFor,
  implementationGuide,
  mermaidDocument,
  prdDocument,
  projectSlug,
  saveProjectJson,
  type ProjectFileKind,
} from '../engine/project-docs.ts'
import { cannedPlanLine, planDeskLines } from '../engine/plan-desk.ts'
import { listPortfolio } from '../engine/portfolio.ts'
import { saveSettings, type Idea, type MemoryProposal } from '../engine/store.ts'
import { emptyPlan, restorePlanRevision, type IdeaSimulation, type IdeaSimulationElement, type IdeaSprint } from '../engine/idea-plan.ts'
import { guiSimulation, wbsFor, workflowDryRun, type WbsNode } from '../engine/idea-simulation.ts'

function renderSimulationElement(element: IdeaSimulationElement, index: number): ReactNode {
  if (element.type === 'heading') return <h4 key={`${element.type}-${index}`}>{element.text}</h4>
  if (element.type === 'text') return <p key={`${element.type}-${index}`}>{element.text}</p>
  if (element.type === 'list') {
    return (
      <section key={`${element.type}-${index}`}>
        {element.title ? <h4>{element.title}</h4> : null}
        <ul>{element.items.map((item, itemIndex) => <li key={`${item}-${itemIndex}`}>{item}</li>)}</ul>
      </section>
    )
  }
  if (element.type === 'card') {
    return <article key={`${element.type}-${index}`}><h4>{element.title}</h4><p>{element.body}</p></article>
  }
  if (element.type === 'button') return <button key={`${element.type}-${index}`} type="button" disabled>{element.label}</button>
  return (
    <div key={`${element.type}-${index}`} role="tablist" aria-label="Vorschau Tabs">
      {element.labels.map((label, tabIndex) => <button key={`${label}-${tabIndex}`} type="button" role="tab" aria-selected={element.selected === tabIndex} disabled>{label}</button>)}
    </div>
  )
}

function useClock(): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(id)
  }, [])
  return now
}

export function ScriptStage({
  view,
  focus,
  idea,
  termin,
  jobs,
  sources,
  modules,
  wire,
  proposals,
  loadError,
  phase,
  scriptAt,
  sprintSide,
  onStop,
  onYes,
  onNo,
  onSimulationChange,
  onImportProject,
}: {
  view: string
  focus: string
  idea?: Idea
  termin: string
  jobs: string[]
  sources: string[]
  modules: string[]
  wire: string[]
  proposals: MemoryProposal[]
  loadError: string
  phase: string
  scriptAt: number
  sprintSide?: 'left' | 'right'
  onStop: () => void
  onYes: (id: string) => void
  onNo: (id: string) => void
  onSimulationChange: (simulation: IdeaSimulation | null) => Promise<void>
  onImportProject: (raw: unknown) => Promise<string>
}) {
  const now = useClock()
  const [cardName, setCardName] = useState('')
  useEffect(() => {
    let live = true
    const load = () => {
      if (!idea?.id) {
        setCardName('')
        return
      }
      void listPortfolio()
        .then((rows) => {
          if (!live) return
          const row = rows.find((item) => (item.idea_id === idea.id || item.id === idea.id) && !item.archived)
          setCardName(row?.name || '')
        })
        .catch(() => {
          if (live) setCardName('')
        })
    }
    load()
    window.addEventListener('jarvis-settings', load)
    return () => {
      live = false
      window.removeEventListener('jarvis-settings', load)
    }
  }, [idea?.id])
  const lines = useMemo(() => planDeskLines(idea, phase, cardName), [idea, phase, cardName])
  const [shown, setShown] = useState(lines.length)
  const [exportNote, setExportNote] = useState('')
  const [copied, setCopied] = useState('')
  const [feedbackKind, setFeedbackKind] = useState<'text' | 'card' | 'button'>('text')
  const [feedbackTitle, setFeedbackTitle] = useState('')
  const [feedbackBody, setFeedbackBody] = useState('')
  const [proposedSimulation, setProposedSimulation] = useState<IdeaSimulation | null>(null)
  const [simulationError, setSimulationError] = useState('')
  const [importNote, setImportNote] = useState('')
  const locked = phase === 'go'
  const live = phase === 'live'

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || locked || !scriptAt) {
      setShown(lines.length)
      return
    }
    let id = 0
    const tick = () => {
      const n = Math.max(1, Math.min(lines.length, Math.floor((Date.now() - scriptAt) / 420) + 1))
      setShown((cur) => (cur === n ? cur : n))
      if (n >= lines.length) window.clearInterval(id)
    }
    id = window.setInterval(tick, 420)
    tick()
    return () => window.clearInterval(id)
  }, [lines, scriptAt, locked])

  const said = new Set(
    (idea?.plan?.anforderungen || []).map((row) => row.satz.replace(/\s+/g, ' ').trim().toLowerCase()),
  )
  if (idea?.title) said.add(idea.title.replace(/\s+/g, ' ').trim().toLowerCase())
  const sprints: IdeaSprint[] = [...(idea?.plan?.sprints || [])]
    .sort((a, b) => Number(a.n) - Number(b.n))
    .filter((sprint) => {
      const line = (sprint.ziel || sprint.title || '').replace(/\s+/g, ' ').trim()
      if (!line || cannedPlanLine(line) || said.has(line.toLowerCase())) return false
      return true
    })
  const wege = (sprints[0]?.lieferumfang || []).filter((step) => !said.has(step.task.replace(/\s+/g, ' ').trim().toLowerCase()))
  const clock = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  const visible = lines.slice(0, shown)
  const typing = live && shown < lines.length
  const baseSimulation = view === 'workflow'
    ? workflowDryRun(idea?.plan || emptyPlan(idea?.id || ''), idea?.title || 'Projekt')
    : idea?.plan?.simulation?.kind === 'gui'
      ? idea.plan.simulation
      : guiSimulation(focus || 'Oberflächenvorschau', (wire.length ? wire : ['Noch keine Vorschau vorhanden.']).map((text, index): IdeaSimulationElement =>
          index === 0 ? { type: 'heading', text } : { type: 'text', text },
        ), ['Diese Vorschau verwendet nur feste, geprüfte Bausteine.'])
  const shownSimulation = proposedSimulation || baseSimulation

  async function copyPrompt(n: string, prompt: string) {
    if (!prompt) return
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(n)
      window.setTimeout(() => setCopied((cur) => (cur === n ? '' : cur)), 1600)
    } catch {
      setCopied('')
    }
  }

  function proposeSimulationChange() {
    const title = feedbackTitle.trim()
    const body = feedbackBody.trim()
    if (!title) {
      setSimulationError('Bitte gib einen Text oder Titel für die Änderung ein.')
      return
    }
    let element: IdeaSimulationElement
    if (feedbackKind === 'card') {
      element = { type: 'card', title, body }
    } else if (feedbackKind === 'button') {
      element = { type: 'button', label: title }
    } else {
      element = { type: 'text', text: title }
    }
    setProposedSimulation({ ...baseSimulation, elements: [...baseSimulation.elements, element].slice(0, 32), createdAt: new Date().toISOString() })
    setSimulationError('')
  }

  async function applySimulationChange() {
    if (!proposedSimulation) return
    try {
      await onSimulationChange(proposedSimulation)
      setProposedSimulation(null)
      setFeedbackTitle('')
      setFeedbackBody('')
      setSimulationError('')
    } catch (error) {
      setSimulationError(error instanceof Error ? error.message : String(error))
    }
  }

  async function undoSimulationChange() {
    const latest = idea?.plan?.revisions?.at(-1)
    if (!latest || !idea?.plan) return
    const restored = restorePlanRevision(idea.plan, latest.id)
    if (!restored) {
      setSimulationError('Die vorige Vorschau konnte nicht wiederhergestellt werden.')
      return
    }
    try {
      await onSimulationChange(restored.simulation || null)
      setSimulationError('')
    } catch (error) {
      setSimulationError(error instanceof Error ? error.message : String(error))
    }
  }

  function renderWbs(node: WbsNode): ReactNode {
    return (
      <li key={node.id} data-wbs-kind={node.kind}>
        <span>{node.label}</span>
        {node.children.length ? <ul>{node.children.map(renderWbs)}</ul> : null}
      </li>
    )
  }

  async function exportFile(kind: ProjectFileKind) {
    if (!idea || !locked) return
    try {
      const file = fileFor(idea, kind)
      const saved = await saveProjectJson(file.name, file.data)
      setExportNote(saved)
    } catch (error) {
      setExportNote(`Export fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  async function importFile(file?: File) {
    if (!file) return
    try {
      const raw: unknown = JSON.parse(await file.text())
      setImportNote(await onImportProject(raw))
    } catch (error) {
      setImportNote(`Import fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  function exportMarkdown(kind: 'prd' | 'mermaid' | 'guide') {
    if (!idea || !locked) return
    const slug = projectSlug(idea.title)
    const file = kind === 'prd'
      ? { name: `${slug}-prd.md`, data: prdDocument(idea) }
      : kind === 'mermaid'
        ? { name: `${slug}-ablauf.mmd`, data: mermaidDocument(idea), mime: 'text/plain' }
        : { name: `${slug}-sprint-leitfaden.md`, data: implementationGuide(idea) }
    try {
      downloadTextFile(file.name, file.data, 'mime' in file ? file.mime : 'text/markdown')
      setExportNote(`Export erstellt: ${file.name}`)
    } catch (error) {
      setExportNote(`Export fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  function setView(next: string) {
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
            <button type="button" className={view === 'sprints' ? 'is-on' : ''} onClick={() => setView('sprints')}>
              Sprints
            </button>
            <button type="button" className={view === 'psp' ? 'is-on' : ''} onClick={() => setView('psp')}>
              PSP
            </button>
            <button type="button" className={view === 'research' ? 'is-on' : ''} onClick={() => setView('research')}>
              Quellen
            </button>
            <button type="button" className={view === 'sim' ? 'is-on' : ''} onClick={() => setView('sim')}>Vorschau</button>
            <button type="button" className={view === 'workflow' ? 'is-on' : ''} onClick={() => setView('workflow')}>Probelauf</button>
          </div>
          {view === 'research' ? (
            <ul>
              {sources.length ? (
                sources.map((s) => <li key={s}>{s}</li>)
              ) : (
                <li>Keine Quelle im Store. Die Wege stehen im Satz. Sag Such, dann kommt eine Quelle dazu.</li>
              )}
            </ul>
          ) : view === 'sim' || view === 'workflow' ? (
            <div className="script-simulation" aria-label={view === 'workflow' ? 'Ablauf-Simulation' : 'Oberflächenvorschau'}>
              <p className="script-simulation-badge">{view === 'workflow' ? 'Gedankliche Simulation — keine echte Ausführung' : 'Oberflächenvorschau — keine Live-App'}</p>
              <h3>{shownSimulation.title}</h3>
              <div className="script-preview">
                {shownSimulation.elements.map((element, index) => renderSimulationElement(element, index))}
              </div>
              {shownSimulation.assumptions.length ? (
                <ul className="script-assumptions">{shownSimulation.assumptions.map((item) => <li key={item}>{item}</li>)}</ul>
              ) : null}
              {view === 'sim' && idea?.plan ? (
                <div className="script-preview-edit">
                  <h4>Vorschau anpassen</h4>
                  <label>
                    Baustein
                    <select value={feedbackKind} onChange={(event) => setFeedbackKind(event.target.value as typeof feedbackKind)}>
                      <option value="text">Text ergänzen</option>
                      <option value="card">Karte ergänzen</option>
                      <option value="button">Knopf ergänzen</option>
                    </select>
                  </label>
                  <label>
                    {feedbackKind === 'button' ? 'Knopftext' : feedbackKind === 'card' ? 'Kartentitel' : 'Text'}
                    <input value={feedbackTitle} maxLength={160} onChange={(event) => setFeedbackTitle(event.target.value)} />
                  </label>
                  {feedbackKind === 'card' ? (
                    <label>
                      Karteninhalt
                      <input value={feedbackBody} maxLength={300} onChange={(event) => setFeedbackBody(event.target.value)} />
                    </label>
                  ) : null}
                  <button type="button" onClick={proposeSimulationChange}>Änderung vorschlagen</button>
                  {proposedSimulation ? (
                    <div className="script-preview-proposal" aria-live="polite">
                      <p>Vorschau der Änderung</p>
                      <button type="button" onClick={() => void applySimulationChange()}>Übernehmen</button>
                      <button type="button" onClick={() => setProposedSimulation(null)}>Verwerfen</button>
                    </div>
                  ) : null}
                  {idea.plan.revisions?.length ? <button type="button" onClick={() => void undoSimulationChange()}>Letzte Änderung rückgängig</button> : null}
                  {simulationError ? <p role="alert">{simulationError}</p> : null}
                </div>
              ) : null}
            </div>
          ) : view === 'modules' ? (
            <ul>
              {modules.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          ) : view === 'psp' ? (
            idea?.plan ? (
              <ul className="script-wbs">{renderWbs(wbsFor(idea, idea.plan))}</ul>
            ) : (
              <p>Für dieses Projekt gibt es noch keine Projektstruktur.</p>
            )
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
              <ol className="script-psp">
                {sprints.length ? (
                  sprints.map((s) => (
                    <li key={s.n}>
                      <span>{s.n}</span>
                      <strong>{s.title}</strong>
                      <em>{s.ziel?.trim() || 'Noch leer.'}</em>
                      {s.prompt ? (
                        <div className="script-prompt">
                          <p>{s.prompt}</p>
                          <button type="button" onClick={() => void copyPrompt(s.n, s.prompt)}>
                            {copied === s.n ? 'Kopiert' : 'Prompt kopieren'}
                          </button>
                        </div>
                      ) : null}
                    </li>
                  ))
                ) : idea?.plan?.sprints?.length ? null : (
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
            <button type="button" disabled={!locked || !idea} onClick={() => exportMarkdown('prd')}>PRD</button>
            <button type="button" disabled={!locked || !idea} onClick={() => exportMarkdown('mermaid')}>Diagramm</button>
            <button type="button" disabled={!locked || !idea} onClick={() => exportMarkdown('guide')}>Leitfaden</button>
            <label className="script-import">
              Projekt importieren
              <input type="file" accept="application/json,.json" onChange={(event) => void importFile(event.target.files?.[0])} />
            </label>
          </div>
          <p className="script-export-note">
            {exportNote || (locked ? 'Export ist bereit.' : cardName ? 'Die Karte liegt.' : 'Export nach Go.')}
          </p>
          {importNote ? <p className="script-export-note" role="status">{importNote}</p> : null}
        </aside>
      </div>
      {loadError ? <p className="script-error" role="alert">{loadError}</p> : null}
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
          <p>
            {locked
              ? 'Umgesetzt. Export ist bereit.'
              : live
                ? cardName
                  ? 'Sag Fertig, dann geht der Bildschirm zu.'
                  : 'Sag Fertig, wenn der Satz steht. Go legt die Karte.'
                : 'Sagen Sie Go, Umsetzen oder Leg los.'}
          </p>
        )}
        {locked ? <b className="script-stamp">Fest</b> : null}
      </footer>
    </section>
  )
}
