import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { CATALOG_STAND } from '../engine/feature-catalog.ts'
import { isTischplatteView } from '../engine/board-types.ts'
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
import { newId, saveSettings, type Idea, type MemoryProposal } from '../engine/store.ts'
import {
  diffPlanRevisions,
  emptyPlan,
  moveBacklogItem,
  parsePlan,
  restorePlanRevision,
  type IdeaPlan,
  type IdeaSimulation,
  type IdeaSimulationElement,
  type IdeaSprint,
  type PlanRisk,
  type PlanStatus,
} from '../engine/idea-plan.ts'
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
  onPlanChange,
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
  onPlanChange: (plan: IdeaPlan, summary: string) => Promise<void>
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
  const [planError, setPlanError] = useState('')
  const [backlogDescription, setBacklogDescription] = useState('')
  const [backlogRequirement, setBacklogRequirement] = useState('')
  const [undoBacklogPlan, setUndoBacklogPlan] = useState<IdeaPlan | null>(null)
  const [riskDescription, setRiskDescription] = useState('')
  const [riskImpact, setRiskImpact] = useState('')
  const [riskMitigation, setRiskMitigation] = useState('')
  const [statusReason, setStatusReason] = useState('')
  const [statusNextAction, setStatusNextAction] = useState('')
  const [selectedRevision, setSelectedRevision] = useState('')
  const [stageView, setStageView] = useState(view)
  const locked = phase === 'go'
  const live = phase === 'live'
  useEffect(() => setStageView(view), [view])

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
  const baseSimulation = stageView === 'workflow'
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
    const restored = restorePlanRevision(idea.plan, latest.id, newId())
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

  async function persistPlan(plan: IdeaPlan, summary: string) {
    try {
      await onPlanChange(plan, summary)
      setPlanError('')
    } catch (error) {
      setPlanError(error instanceof Error ? error.message : String(error))
    }
  }

  async function addBacklogItem() {
    const description = backlogDescription.trim()
    if (!idea?.plan || !description) return
    const plan = idea.plan
    const requirementIds = backlogRequirement.trim() ? [backlogRequirement.trim()] : []
    await persistPlan({
      ...plan,
      backlog: [...(plan.backlog || []), {
        id: `B-${newId()}`,
        description,
        requirementIds,
        status: 'backlog',
      }],
    }, 'Backlog-Eintrag ergänzt')
    setBacklogDescription('')
    setBacklogRequirement('')
  }

  async function moveBacklog(id: string, sprintId?: string) {
    if (!idea?.plan) return
    const next = moveBacklogItem(idea.plan, id, sprintId)
    if (!next) {
      setPlanError('Der Backlog-Eintrag konnte nicht verschoben werden. Prüfe Ziel-Sprint und Anforderungen.')
      return
    }
    setUndoBacklogPlan(idea.plan)
    await persistPlan(next, sprintId ? `Backlog-Eintrag in Sprint ${sprintId} verschoben` : 'Eintrag zurück in den Backlog verschoben')
  }

  async function undoBacklogMove() {
    if (!undoBacklogPlan) return
    await persistPlan(undoBacklogPlan, 'Backlog-Verschiebung rückgängig gemacht')
    setUndoBacklogPlan(null)
  }

  async function addRisk() {
    if (!idea?.plan || !riskDescription.trim() || !riskImpact.trim() || !riskMitigation.trim()) return
    const risk: PlanRisk = {
      id: `R-${newId()}`,
      description: riskDescription.trim(),
      impact: riskImpact.trim(),
      mitigation: riskMitigation.trim(),
      status: 'open',
    }
    await persistPlan({ ...idea.plan, risks: [...(idea.plan.risks || []), risk] }, 'Risiko erfasst')
    setRiskDescription('')
    setRiskImpact('')
    setRiskMitigation('')
  }

  async function setRiskStatus(id: string, status: PlanRisk['status']) {
    if (!idea?.plan) return
    await persistPlan({
      ...idea.plan,
      risks: (idea.plan.risks || []).map((risk) => risk.id === id ? { ...risk, status } : risk),
    }, status === 'resolved' ? 'Risiko erledigt' : 'Risiko wieder geöffnet')
  }

  async function addStatusUpdate(status: PlanStatus) {
    if (!idea?.plan || !statusReason.trim()) return
    await persistPlan({
      ...idea.plan,
      statusUpdates: [...(idea.plan.statusUpdates || []), {
        status,
        at: new Date().toISOString(),
        reason: statusReason.trim(),
        nextAction: statusNextAction.trim() || undefined,
      }],
    }, 'Projektstatus aktualisiert')
    setStatusReason('')
    setStatusNextAction('')
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
    setStageView(next)
    if (isTischplatteView(next)) saveSettings({ tischplatte_on: true, tischplatte_view: next })
  }

  const revisionRows = idea?.plan?.revisions || []
  const chosenRevision = revisionRows.find((revision) => revision.id === selectedRevision) || revisionRows.at(-1)
  let revisionDiff: ReturnType<typeof diffPlanRevisions> = []
  if (chosenRevision && idea?.plan) {
    try {
      const prior = parsePlan(JSON.parse(chosenRevision.snapshot), idea.plan.ideaId)
      if (prior) revisionDiff = diffPlanRevisions(prior, idea.plan)
    } catch {
      revisionDiff = []
    }
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
          <h2>{idea ? idea.title : 'Noch keine Idee'}</h2>
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
            <button type="button" aria-pressed={stageView === 'sprints'} className={stageView === 'sprints' ? 'is-on' : ''} onClick={() => setView('sprints')}>
              Sprints
            </button>
            <button type="button" aria-pressed={stageView === 'psp'} className={stageView === 'psp' ? 'is-on' : ''} onClick={() => setView('psp')}>
              PSP
            </button>
            <button type="button" aria-pressed={stageView === 'research'} className={stageView === 'research' ? 'is-on' : ''} onClick={() => setView('research')}>
              Quellen
            </button>
            <button type="button" aria-pressed={stageView === 'backlog'} className={stageView === 'backlog' ? 'is-on' : ''} onClick={() => setView('backlog')}>Backlog</button>
            <button type="button" aria-pressed={stageView === 'dependencies'} className={stageView === 'dependencies' ? 'is-on' : ''} onClick={() => setView('dependencies')}>Abhängigkeiten</button>
            <button type="button" aria-pressed={stageView === 'timeline'} className={stageView === 'timeline' ? 'is-on' : ''} onClick={() => setView('timeline')}>Zeitplan</button>
            <button type="button" aria-pressed={stageView === 'risks'} className={stageView === 'risks' ? 'is-on' : ''} onClick={() => setView('risks')}>Risiken & Status</button>
            <button type="button" aria-pressed={stageView === 'revisions'} className={stageView === 'revisions' ? 'is-on' : ''} onClick={() => setView('revisions')}>Revisionen</button>
            <button type="button" aria-pressed={stageView === 'sim'} className={stageView === 'sim' ? 'is-on' : ''} onClick={() => setView('sim')}>Vorschau</button>
            <button type="button" aria-pressed={stageView === 'workflow'} className={stageView === 'workflow' ? 'is-on' : ''} onClick={() => setView('workflow')}>Probelauf</button>
          </div>
          {stageView === 'backlog' ? (
            idea?.plan ? (
              <section aria-labelledby="plan-backlog-title">
                <h3 id="plan-backlog-title">Backlog — ungeplante Arbeit</h3>
                <p>Ein Eintrag wird erst durch eine ausdrückliche Auswahl einem Sprint zugeordnet; dadurch wird kein Sprint freigegeben.</p>
                <form onSubmit={(event) => { event.preventDefault(); void addBacklogItem() }}>
                  <label>Beschreibung<input value={backlogDescription} maxLength={500} onChange={(event) => setBacklogDescription(event.target.value)} /></label>
                  <label>Anforderungs-ID (optional)<input value={backlogRequirement} maxLength={80} onChange={(event) => setBacklogRequirement(event.target.value)} /></label>
                  <button type="submit" disabled={!backlogDescription.trim()}>Zum Backlog hinzufügen</button>
                </form>
                {idea.plan.backlog?.length ? (
                  <ul aria-label="Backlog-Einträge">
                    {idea.plan.backlog.map((item) => (
                      <li key={item.id}>
                        <strong>{item.description}</strong>
                        <span>{item.status === 'planned' ? `Sprint ${item.sprintId}` : item.status === 'done' ? 'Erledigt' : 'Nicht eingeplant'}</span>
                        {item.requirementIds.length ? <span>Anforderungen: {item.requirementIds.join(', ')}</span> : <span>Keine Anforderung verknüpft</span>}
                        {item.status !== 'done' ? (
                          <label>
                            Ziel-Sprint für {item.description}
                            <select value={item.status === 'planned' ? item.sprintId : ''} onChange={(event) => void moveBacklog(item.id, event.target.value || undefined)}>
                              <option value="">Backlog (nicht eingeplant)</option>
                              {idea.plan?.sprints.map((sprint) => <option key={sprint.n} value={sprint.n}>Sprint {sprint.n} — {sprint.title || sprint.ziel}</option>)}
                            </select>
                          </label>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : <p>Der Backlog ist leer.</p>}
                {undoBacklogPlan ? <button type="button" onClick={() => void undoBacklogMove()}>Verschiebung rückgängig</button> : null}
                {planError ? <p role="alert">{planError}</p> : null}
              </section>
            ) : <p>Für dieses Projekt gibt es noch keinen Plan.</p>
          ) : stageView === 'dependencies' ? (
            idea?.plan ? (
              <section aria-labelledby="plan-dependencies-title">
                <h3 id="plan-dependencies-title">Sprintbeziehungen</h3>
                {idea.plan.sprints.length ? <ul>{idea.plan.sprints.map((sprint) => {
                  const relations = sprint.relations || sprint.haengt_an.map((targetId) => ({ type: 'depends_on' as const, targetId }))
                  return <li key={sprint.n}>
                    <strong>Sprint {sprint.n} — {sprint.title || sprint.ziel}</strong>
                    {relations.length ? <ul>{relations.map((relation, index) => <li key={`${relation.type}-${relation.targetId}-${index}`}>{relation.type === 'depends_on' ? 'benötigt' : relation.type === 'blocks' ? 'blockiert' : 'verwandt mit'} Sprint {relation.targetId}</li>)}</ul> : <span>Keine Abhängigkeiten</span>}
                    <span>Gateway: {sprint.gateway}</span>
                  </li>
                })}</ul> : <p>Noch keine Sprints vorhanden.</p>}
              </section>
            ) : <p>Für dieses Projekt gibt es noch keinen Plan.</p>
          ) : stageView === 'timeline' ? (
            idea?.plan ? (
              <section aria-labelledby="plan-timeline-title">
                <h3 id="plan-timeline-title">Optionale Zeitplanung</h3>
                <p>Zeiten behalten ihre angegebene Zeitzone. Leere Daten bleiben ungeplant; Konflikte verschieben nichts automatisch.</p>
                {idea.plan.sprints.length ? <ol>{[...idea.plan.sprints].sort((a, b) => (a.startAt || '').localeCompare(b.startAt || '') || Number(a.n) - Number(b.n)).map((sprint) => (
                  <li key={sprint.n}>
                    <strong>Sprint {sprint.n} — {sprint.title || sprint.ziel}</strong>
                    <label>Start (ISO-Datum mit Zeitzone)
                      <input aria-label={`Startdatum Sprint ${sprint.n}`} placeholder="2026-10-08T09:00:00+02:00" defaultValue={sprint.startAt || ''} onBlur={(event) => {
                        const value = event.target.value.trim()
                        void persistPlan({ ...idea.plan!, sprints: idea.plan!.sprints.map((item) => item.n === sprint.n ? { ...item, startAt: value || undefined } : item) }, `Startdatum für Sprint ${sprint.n} geändert`)
                      }} />
                    </label>
                    <label>Ende (ISO-Datum mit Zeitzone)
                      <input aria-label={`Enddatum Sprint ${sprint.n}`} placeholder="2026-10-09T17:00:00+02:00" defaultValue={sprint.endAt || ''} onBlur={(event) => {
                        const value = event.target.value.trim()
                        void persistPlan({ ...idea.plan!, sprints: idea.plan!.sprints.map((item) => item.n === sprint.n ? { ...item, endAt: value || undefined } : item) }, `Enddatum für Sprint ${sprint.n} geändert`)
                      }} />
                    </label>
                  </li>
                ))}</ol> : <p>Es gibt noch keine Sprints zum Einplanen.</p>}
                {planError ? <p role="alert">{planError}</p> : null}
              </section>
            ) : <p>Für dieses Projekt gibt es noch keinen Plan.</p>
          ) : stageView === 'risks' ? (
            idea?.plan ? (
              <section aria-labelledby="plan-status-title">
                <h3 id="plan-status-title">Risiken und Projektstatus</h3>
                <form onSubmit={(event) => { event.preventDefault(); void addRisk() }}>
                  <label>Risiko<input value={riskDescription} maxLength={500} onChange={(event) => setRiskDescription(event.target.value)} /></label>
                  <label>Auswirkung<input value={riskImpact} maxLength={500} onChange={(event) => setRiskImpact(event.target.value)} /></label>
                  <label>Gegenmaßnahme<input value={riskMitigation} maxLength={500} onChange={(event) => setRiskMitigation(event.target.value)} /></label>
                  <button type="submit" disabled={!riskDescription.trim() || !riskImpact.trim() || !riskMitigation.trim()}>Risiko erfassen</button>
                </form>
                <ul aria-label="Risiken">{(idea.plan.risks || []).map((risk) => <li key={risk.id}>
                  <strong>{risk.description}</strong><span>Auswirkung: {risk.impact}</span><span>Gegenmaßnahme: {risk.mitigation}</span><span>Status: {risk.status === 'open' ? 'offen' : 'erledigt'}</span>
                  <button type="button" onClick={() => void setRiskStatus(risk.id, risk.status === 'open' ? 'resolved' : 'open')}>{risk.status === 'open' ? 'Als erledigt markieren' : 'Wieder öffnen'}</button>
                </li>)}</ul>
                <form onSubmit={(event) => { event.preventDefault(); void addStatusUpdate((event.currentTarget.elements.namedItem('status') as HTMLSelectElement).value as PlanStatus) }}>
                  <label>Status<select name="status" defaultValue="planned"><option value="planned">Im Plan</option><option value="at_risk">Gefährdet</option><option value="blocked">Blockiert</option><option value="completed">Abgeschlossen</option></select></label>
                  <label>Begründung<input value={statusReason} maxLength={500} onChange={(event) => setStatusReason(event.target.value)} /></label>
                  <label>Nächste Aktion (optional)<input value={statusNextAction} maxLength={500} onChange={(event) => setStatusNextAction(event.target.value)} /></label>
                  <button type="submit" disabled={!statusReason.trim()}>Status festhalten</button>
                </form>
                <h4>Statusverlauf</h4>
                {idea.plan.statusUpdates?.length ? <ol>{[...idea.plan.statusUpdates].reverse().map((update, index) => <li key={`${update.at}-${index}`}>
                  <strong>{({ planned: 'Im Plan', at_risk: 'Gefährdet', blocked: 'Blockiert', completed: 'Abgeschlossen' })[update.status]}</strong>
                  <time dateTime={update.at}>{new Date(update.at).toLocaleString()}</time><span>{update.reason}</span>{update.nextAction ? <span>Nächste Aktion: {update.nextAction}</span> : null}
                  {update.sprintId ? <span>Sprint {update.sprintId}</span> : null}{update.requirementId ? <span>Anforderung {update.requirementId}</span> : null}
                </li>)}</ol> : <p>Es gibt noch keine manuell festgehaltenen Statusmeldungen.</p>}
                {planError ? <p role="alert">{planError}</p> : null}
              </section>
            ) : <p>Für dieses Projekt gibt es noch keinen Plan.</p>
          ) : stageView === 'revisions' ? (
            idea?.plan ? (
              <section aria-labelledby="plan-revisions-title">
                <h3 id="plan-revisions-title">Revisionen vergleichen</h3>
                {revisionRows.length ? <>
                  <label>Vergleichsrevision<select value={chosenRevision?.id || ''} onChange={(event) => setSelectedRevision(event.target.value)}>{revisionRows.map((revision) => <option key={revision.id} value={revision.id}>{new Date(revision.at).toLocaleString()} — {revision.summary || revision.id}</option>)}</select></label>
                  <ul>{revisionDiff.length ? revisionDiff.map((change) => <li key={change.section}><strong>{change.section}</strong><details><summary>Änderungen anzeigen</summary><h4>Vorher</h4><pre>{change.before}</pre><h4>Nachher</h4><pre>{change.after}</pre></details></li>) : <li>Die gewählte Revision entspricht dem aktuellen Stand.</li>}</ul>
                  <button type="button" onClick={() => {
                    if (!chosenRevision) return
                    const restored = restorePlanRevision(idea.plan!, chosenRevision.id, newId())
                    if (restored) void persistPlan(restored, `Revision ${chosenRevision.id} wiederhergestellt`)
                    else setPlanError('Die Revision konnte nicht gelesen werden.')
                  }}>Revision wiederherstellen (neue Revision wird angelegt)</button>
                </> : <p>Noch keine gespeicherten Revisionen.</p>}
                {planError ? <p role="alert">{planError}</p> : null}
              </section>
            ) : <p>Für dieses Projekt gibt es noch keinen Plan.</p>
          ) : stageView === 'research' ? (
            <>
              <h3>Belege und Quellen</h3>
              <ul>
                {sources.length ? (
                  sources.map((s) => <li key={s}>{s}</li>)
                ) : (
                  <li>Keine Quelle dokumentiert. Fehlende Belege bleiben sichtbar und gelten nicht als bestätigt.</li>
                )}
              </ul>
              {idea?.plan ? <section aria-label="Herkunft von Anforderungen und Entscheidungen">
                <h4>Anforderungen</h4>
                <ul>{idea.plan.anforderungen.length ? idea.plan.anforderungen.map((need) => <li key={need.id}>
                  <strong>{need.id}: {need.satz}</strong>
                  <span>{need.provenance ? `${need.provenance.kind} · ${need.provenance.confirmation === 'confirmed' ? 'bestätigt' : 'unbestätigt'}` : 'Herkunft nicht dokumentiert'}</span>
                  {need.provenance?.evidenceIds.length ? <span>Belege: {need.provenance.evidenceIds.join(', ')}</span> : <span>Kein Beleg verknüpft</span>}
                </li>) : <li>Keine Anforderungen erfasst.</li>}</ul>
                <h4>Entscheidungen</h4>
                <ul>{idea.plan.entscheidungen.length ? idea.plan.entscheidungen.map((decision) => <li key={decision.id}>
                  <strong>{decision.id}: {decision.schnitt}</strong><span>{decision.grund}</span>
                  <span>{decision.provenance ? `${decision.provenance.kind} · ${decision.provenance.confirmation === 'confirmed' ? 'bestätigt' : 'unbestätigt'}` : 'Herkunft nicht dokumentiert'}</span>
                  {decision.provenance?.evidenceIds.length ? <span>Belege: {decision.provenance.evidenceIds.join(', ')}</span> : <span>Kein Beleg verknüpft</span>}
                </li>) : <li>Keine Entscheidungen erfasst.</li>}</ul>
              </section> : null}
            </>
          ) : stageView === 'sim' || stageView === 'workflow' ? (
            <div className="script-simulation" aria-label={stageView === 'workflow' ? 'Ablauf-Simulation' : 'Oberflächenvorschau'}>
              <p className="script-simulation-badge">{stageView === 'workflow' ? 'Gedankliche Simulation — keine echte Ausführung' : 'Oberflächenvorschau — keine Live-App'}</p>
              <h3>{shownSimulation.title}</h3>
              <div className="script-preview">
                {shownSimulation.elements.map((element, index) => renderSimulationElement(element, index))}
              </div>
              {shownSimulation.assumptions.length ? (
                <ul className="script-assumptions">{shownSimulation.assumptions.map((item) => <li key={item}>{item}</li>)}</ul>
              ) : null}
              {stageView === 'sim' && idea?.plan ? (
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
          ) : stageView === 'modules' ? (
            <ul>
              {modules.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          ) : stageView === 'psp' ? (
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
