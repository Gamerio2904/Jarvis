import { useEffect, useState } from 'react'
import { HOME_APPS, type HomeAppId } from '../engine/home-apps.ts'
import { isTischplatteView, type TischplatteView } from '../engine/board-types.ts'
import { parseBoardJobs, serializeBoardJobs, stopJobs, type BoardJob } from '../engine/board-jobs.ts'
import {
  focusPiece,
  loadPieces,
  serializePieces,
  type MotionCue,
  type PiecePos,
} from '../engine/board-pieces.ts'
import { wireFor, type WireFrame } from '../engine/board-wire.ts'
import { CATALOG_STAND } from '../engine/feature-catalog.ts'
import { expandEvents } from '../engine/calendar-occur.ts'
import {
  acceptProposal,
  pendingProposals,
  rejectProposal,
} from '../engine/memory-propose.ts'
import {
  listEvents,
  listIdeas,
  loadSettings,
  saveSettings,
  type Idea,
  type MemoryProposal,
} from '../engine/store.ts'
import type { ResearchSource } from '../engine/research-parse.ts'
import { BoardStage } from './BoardStage.tsx'

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

function readMotion(): MotionCue | null {
  try {
    const raw = loadSettings().tischplatte_motion_json
    if (!raw) return null
    return JSON.parse(raw) as MotionCue
  } catch {
    return null
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
  const [pieces, setPieces] = useState<PiecePos[]>(() => loadPieces(loadSettings().tischplatte_pieces_json))
  const [motion, setMotion] = useState<MotionCue | null>(() => readMotion())
  const [termin, setTermin] = useState('Kein Termin.')
  const [wide, setWide] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 900 : true))

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
        setPieces(loadPieces(settings.tischplatte_pieces_json))
        setMotion(readMotion())
      }
    }
    load()
    const on = () => load()
    window.addEventListener('jarvis-settings', on)
    const id = window.setInterval(load, 2_000)
    const onResize = () => setWide(window.innerWidth >= 900)
    window.addEventListener('resize', onResize)
    return () => {
      dead = true
      window.removeEventListener('jarvis-settings', on)
      window.removeEventListener('resize', onResize)
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
  const plan = [...(active?.plan?.sprints || [])].sort((a, b) => Number(a.n) - Number(b.n))
  const rows = active
    ? plan.map((s) => ({
        n: String(s.n),
        line: s.ziel?.trim() ? s.ziel : s.n === '1' ? active.title || s.title : 'Noch leer.',
      }))
    : []
  const psp = plan.map((s) => ({
    n: String(s.n),
    title: s.title,
    ziel: s.ziel?.trim() ? s.ziel : 'Noch leer.',
  }))

  function savePieces(next: PiecePos[]) {
    setPieces(next)
    saveSettings({ tischplatte_pieces_json: serializePieces(next) })
  }

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
        <p className="workbench-meta">Planung · Sprints und PSP als JSON · Stand {CATALOG_STAND}</p>
      </header>
      <BoardStage
        pieces={pieces}
        focus={focusPiece(vis)}
        wide={wide}
        rows={rows}
        pspTitle={active?.title || ''}
        psp={psp}
        sources={sources.map((s) => `${s.title.slice(0, 48)} · ${hostOf(s.url)}`)}
        termin={termin}
        jobs={jobs.map((j) => j.label)}
        modules={HOME_APPS.map((a) => a.label)}
        wire={wire?.lines || []}
        proposals={proposals}
        motion={motion}
        onChange={savePieces}
        onYes={(id) => void acceptProposal(id)}
        onNo={(id) => void rejectProposal(id)}
        onStop={stop}
      />
    </div>
  )
}
