import { useEffect, useState } from 'react'
import { HOME_APPS, type HomeAppId } from '../engine/home-apps.ts'
import { isTischplatteView, type TischplatteView } from '../engine/board-types.ts'
import { parseBoardJobs, serializeBoardJobs, stopJobs, type BoardJob } from '../engine/board-jobs.ts'
import { wireFor, type WireFrame } from '../engine/board-wire.ts'
import { CATALOG_STAND, FEATURE_CATALOG, versionAtLeast } from '../engine/feature-catalog.ts'
import { CORE_TITLES } from '../engine/idea-plan.ts'
import {
  acceptProposal,
  pendingProposals,
  rejectProposal,
} from '../engine/memory-propose.ts'
import {
  listIdeas,
  loadSettings,
  saveSettings,
  type Idea,
  type MemoryProposal,
} from '../engine/store.ts'
import type { ResearchSource } from '../engine/research-parse.ts'

function lastResearch(): ResearchSource[] {
  try {
    const raw = loadSettings().last_research_json
    if (!raw) return []
    const parsed = JSON.parse(raw) as { sources?: ResearchSource[] }
    return Array.isArray(parsed.sources) ? parsed.sources.filter((s) => s.url).slice(0, 8) : []
  } catch {
    return []
  }
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export function Workbench({
  view,
  focus,
}: {
  view: string
  focus: string
}) {
  const vis: TischplatteView = isTischplatteView(view) ? view : 'sprints'
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [jobs, setJobs] = useState<BoardJob[]>([])
  const [sources, setSources] = useState<ResearchSource[]>([])
  const [proposals, setProposals] = useState<MemoryProposal[]>([])
  const [wire, setWire] = useState<WireFrame | null>(null)

  useEffect(() => {
    let dead = false
    const load = () => {
      void listIdeas()
        .then((rows) => {
          if (!dead) setIdeas(rows)
        })
        .catch(() => {
          if (!dead) setIdeas([])
        })
      void pendingProposals()
        .then((rows) => {
          if (!dead) setProposals(rows)
        })
        .catch(() => {
          if (!dead) setProposals([])
        })
      if (!dead) {
        setJobs(parseBoardJobs(loadSettings().board_jobs_json))
        setSources(lastResearch())
      }
    }
    load()
    const on = () => load()
    window.addEventListener('jarvis-settings', on)
    const id = window.setInterval(load, 2_000)
    return () => {
      dead = true
      window.removeEventListener('jarvis-settings', on)
      window.clearInterval(id)
    }
  }, [])

  useEffect(() => {
    if (vis !== 'sim') {
      setWire(null)
      return
    }
    const id = (focus || 'calendar') as HomeAppId
    void wireFor(id)
      .then(setWire)
      .catch(() => setWire(null))
  }, [vis, focus])

  const active = ideas.find((i) => i.status === 'open') || ideas[0]
  const plan = active?.plan
  const cores = plan?.sprints.filter((s) => s.kind === 'core') || []
  const custom = plan?.sprints.filter((s) => s.kind === 'custom') || []
  const focusN = loadSettings().tischplatte_focus || focus

  function stop() {
    saveSettings({ board_jobs_json: serializeBoardJobs(stopJobs(jobs)) })
    setJobs(stopJobs(jobs))
  }

  return (
    <div className="workbench" data-board-view={vis} aria-label="Werkbank">
      <header className="workbench-head">
        <p className="workbench-auftrag">
          {active ? `Auftrag: ${active.title}` : 'Sagen Sie Idee: … oder Tischplatte aus.'}
        </p>
        <p className="workbench-meta">
          Stand {CATALOG_STAND} · Sicht {vis}
        </p>
      </header>

      {vis === 'psp' ? (
        <div className="workbench-psp">
          <ul className="workbench-tree">
            {ideas.slice(0, 8).map((idea) => (
              <li key={idea.id} className={idea.id === active?.id ? 'is-on' : ''}>
                {idea.title}
                <ul>
                  {(idea.plan?.sprints || []).slice(0, 6).map((s) => (
                    <li key={s.n} className={focusN === s.n ? 'is-focus' : ''}>
                      {s.title}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          <article className={`workbench-card is-grow${focusN ? ' is-focus' : ''}`}>
            <h3>{active?.title || 'Kein Auftrag'}</h3>
            <p>{plan?.sprints.find((s) => s.n === focusN)?.ziel || active?.body || 'Mitte frei. Karte wächst, Rest Haarlinie.'}</p>
          </article>
        </div>
      ) : null}

      {vis === 'modules' ? (
        <ul className="workbench-mods">
          {HOME_APPS.map((app) => (
            <li key={app.id} className={focus === app.id ? 'is-focus' : ''}>
              <span className="workbench-ghost" />
              {app.label}
            </li>
          ))}
        </ul>
      ) : null}

      {vis === 'sim' ? (
        <article className="workbench-sim" data-sim={wire?.id || focus}>
          {(wire?.lines || ['Drahtgitter', 'Keine Live-App.']).map((line) => (
            <p key={line}>{line}</p>
          ))}
        </article>
      ) : null}

      {vis === 'research' ? (
        <ul className="workbench-chips">
          {sources.length
            ? sources.map((s) => (
                <li key={s.url}>
                  {s.title.slice(0, 48)} · {hostOf(s.url)}
                </li>
              ))
            : <li>Keine Quellen im Store.</li>}
        </ul>
      ) : null}

      {vis === 'sprints' || !['psp', 'modules', 'sim', 'research'].includes(vis) ? (
        <div className="workbench-sprints">
          {(cores.length ? cores : CORE_TITLES.map((title, i) => ({ n: String(i + 1), title, ziel: '', kind: 'core' as const, lieferumfang: [], wont: [], abbruch: '' }))).map(
            (s) => (
              <article key={s.n} className={`workbench-card${focusN === s.n ? ' is-focus' : ''}`}>
                <h3>{s.title}</h3>
                <p>{s.ziel || (active ? 'Idee: Felder leer.' : 'Idee: …')}</p>
              </article>
            ),
          )}
          {custom.map((s) => (
            <article key={s.n} className="workbench-card is-custom">
              <h3>{s.title}</h3>
              <p>{s.ziel}</p>
            </article>
          ))}
        </div>
      ) : null}

      {vis === 'sprints' ? (
        <p className="workbench-catalog-head">
          Jarvis-Plan: {FEATURE_CATALOG.filter((r) => versionAtLeast(r.version, '18.18.0')).map((r) => r.title).slice(0, 4).join(', ')}
        </p>
      ) : null}

      {proposals.length ? (
        <ul className="workbench-propose">
          {proposals.slice(0, 3).map((p) => (
            <li key={p.id}>
              Vorschlag: {p.text.slice(0, 80)}
              <button type="button" onClick={() => void acceptProposal(p.id)}>
                Ja
              </button>
              <button type="button" onClick={() => void rejectProposal(p.id)}>
                Nein
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <footer className="workbench-jobs">
        {jobs.map((j) => (
          <span key={j.id} className={`workbench-job is-${j.status}`} data-job={j.kind}>
            {j.label}
          </span>
        ))}
        {jobs.some((j) => j.status === 'running' || j.status === 'pending') ? (
          <button type="button" className="workbench-stop" onClick={stop}>
            Jobs stopp
          </button>
        ) : null}
      </footer>
    </div>
  )
}
