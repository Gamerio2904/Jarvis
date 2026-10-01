import { useEffect, useState } from 'react'
import { HOME_APPS, type HomeAppId } from '../engine/home-apps.ts'
import { isTischplatteView, type TischplatteView } from '../engine/board-types.ts'
import { parseBoardJobs, serializeBoardJobs, stopJobs, type BoardJob } from '../engine/board-jobs.ts'
import { wireFor, type WireFrame } from '../engine/board-wire.ts'
import { expandEvents } from '../engine/calendar-occur.ts'
import { acceptProposal, pendingProposals, rejectProposal } from '../engine/memory-propose.ts'
import { listEvents, listIdeas, loadSettings, saveSettings, type Idea, type MemoryProposal } from '../engine/store.ts'
import type { ResearchSource } from '../engine/research-parse.ts'
import { ScriptStage } from './ScriptStage.tsx'

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

export function Workbench({ view, focus }: { view: string; focus: string }) {
  const vis: TischplatteView = isTischplatteView(view) ? view : 'sprints'
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [jobs, setJobs] = useState<BoardJob[]>([])
  const [sources, setSources] = useState<ResearchSource[]>([])
  const [proposals, setProposals] = useState<MemoryProposal[]>([])
  const [wire, setWire] = useState<WireFrame | null>(null)
  const [termin, setTermin] = useState('Kein Termin.')
  const [phase, setPhase] = useState('')
  const [planId, setPlanId] = useState('')
  const [scriptAt, setScriptAt] = useState(0)
  const [sprintSide, setSprintSide] = useState<'left' | 'right'>('left')

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
      void listEvents()
        .then((rows) => {
          if (dead) return
          const now = new Date()
          const until = new Date(now.getTime() + 400 * 24 * 60 * 60 * 1000)
          const next = expandEvents(rows, now, until)
            .filter((e) => new Date(e.start_at).getTime() >= now.getTime() - 60_000)
            .sort((a, b) => a.start_at.localeCompare(b.start_at))[0]
          if (!next) {
            setTermin('Kein Termin.')
            return
          }
          const when = next.all_day
            ? 'ganztägig'
            : new Date(next.start_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
          setTermin(`${next.title} · ${when}`)
        })
        .catch(() => {
          if (!dead) setTermin('Kein Termin.')
        })
      if (!dead) {
        const settings = loadSettings()
        setJobs(parseBoardJobs(settings.board_jobs_json))
        setSources(lastResearch())
        setPhase(settings.plan_phase || '')
        setPlanId(settings.plan_idea_id || '')
        setScriptAt(settings.plan_script_at || 0)
        setSprintSide(settings.script_sprint_side === 'right' ? 'right' : 'left')
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

  const active =
    phase === 'live' || phase === 'go'
      ? ideas.find((i) => i.id === planId) || ideas.find((i) => i.status === 'open') || ideas[0]
      : undefined

  function stop() {
    const next = stopJobs(jobs)
    saveSettings({ board_jobs_json: serializeBoardJobs(next) })
    setJobs(next)
  }

  return (
    <div className="workbench" data-board-view={vis} aria-label="Werkbank">
      <ScriptStage
        view={vis}
        idea={active}
        termin={termin}
        jobs={jobs.map((j) => j.label)}
        sources={sources.map((s) => `${s.title.slice(0, 48)} · ${hostOf(s.url)}`)}
        modules={HOME_APPS.map((a) => a.label)}
        wire={wire?.lines || []}
        proposals={proposals}
        phase={phase}
        scriptAt={scriptAt}
        sprintSide={sprintSide}
        onStop={stop}
        onYes={(id) => void acceptProposal(id)}
        onNo={(id) => void rejectProposal(id)}
      />
    </div>
  )
}
