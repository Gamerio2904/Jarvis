import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { DuelState } from '../engine/yugioh-duel.ts'
import {
  attachValueHead,
  trainFromSelfPlaySamples,
  validateNetModel,
  type NetBundle,
  type NetModel,
} from '../engine/yugioh-net.ts'
import {
  buildProofFile,
  passesImprovementGate,
  proofMarkdownSummary,
  verifyProofFile,
  type YugiohProofFile,
} from '../engine/yugioh-proof.ts'
import { aggregateReviewStats, findMistakeCandidates } from '../engine/yugioh-review.ts'
import type { LeagueEntry } from '../engine/yugioh-league.ts'
import {
  collectSelfPlayTrainingBatch,
  createSelfPlayMatch,
  evaluateSelfPlayWinRate,
  matchBoard,
  stepSelfPlayMatch,
  type SelfPlayMatch,
  type SelfPlayResult,
  DEFAULT_AGENT,
  playSelfPlayMatch,
} from '../engine/yugioh-selfplay.ts'
import { SEARCH_PROFILES } from '../engine/yugioh-search.ts'

const CHECKPOINT_KEY = 'jarvis_yugioh_checkpoint_v1'
const DRAFT_KEY = 'jarvis_yugioh_draft_v1'

type Pace = 'realtime' | 'fast' | 'hidden'

export function YugiohSelfPlayDev({
  appVersion,
  netModel,
  setNetModel,
  playerGame,
  pausedJarvis,
  setPausedJarvis,
}: {
  appVersion: string
  netModel: NetModel | null
  setNetModel: (m: NetModel | null) => void
  playerGame: DuelState | null
  pausedJarvis: boolean
  setPausedJarvis: (v: boolean) => void
}) {
  const [spectator, setSpectator] = useState<SelfPlayMatch | null>(null)
  const [spectatorPaused, setSpectatorPaused] = useState(false)
  const [pace, setPace] = useState<Pace>('realtime')
  const [trainingBusy, setTrainingBusy] = useState(false)
  const [trainingProgress, setTrainingProgress] = useState({ done: 0, total: 0 })
  const [trainingCurve, setTrainingCurve] = useState<number[]>([])
  const [lastResult, setLastResult] = useState<SelfPlayResult | null>(null)
  const [league, setLeague] = useState<LeagueEntry[]>([])
  const [proof, setProof] = useState<YugiohProofFile | null>(null)
  const [verifyBusy, setVerifyBusy] = useState(false)
  const [verifyOk, setVerifyOk] = useState<boolean | null>(null)
  const [analysisDone, setAnalysisDone] = useState(false)
  const [gateMsg, setGateMsg] = useState('')
  const [bundle, setBundle] = useState<NetBundle | null>(null)
  const checkpointRef = useRef<NetModel | null>(null)

  useEffect(() => {
    if (playerGame && !pausedJarvis) setPausedJarvis(true)
  }, [playerGame, pausedJarvis, setPausedJarvis])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CHECKPOINT_KEY)
      if (raw) checkpointRef.current = validateNetModel(JSON.parse(raw) as NetModel)
    } catch { /* ignore */ }
    if (netModel) setBundle(attachValueHead(netModel))
    else setBundle(null)
  }, [netModel])

  const board = useMemo(() => (spectator ? matchBoard(spectator) : null), [spectator])

  useEffect(() => {
    if (!spectator || spectatorPaused || spectator.end) return
    const delay = pace === 'fast' ? 120 : pace === 'hidden' ? 40 : 650
    const t = window.setTimeout(() => setSpectator((m) => (m && !m.end ? stepSelfPlayMatch(m) : m)), delay)
    return () => window.clearTimeout(t)
  }, [spectator, spectatorPaused, pace])

  const startSpectator = useCallback(() => {
    setSpectator(createSelfPlayMatch({
      seed: Date.now() % 100000,
      agents: [
        { ...DEFAULT_AGENT, model: netModel, search: SEARCH_PROFILES.game, temperature: 0.15, name: 'Klon A' },
        { ...DEFAULT_AGENT, model: netModel, search: SEARCH_PROFILES.game, temperature: 0.15, name: 'Klon B' },
      ],
    }))
    setSpectatorPaused(false)
  }, [netModel])

  const runTraining = useCallback(() => {
    if (trainingBusy || !netModel) return
    setTrainingBusy(true)
    setVerifyOk(null)
    setAnalysisDone(false)
    setProof(null)
    const total = 8
    setTrainingProgress({ done: 0, total })
    const before = checkpointRef.current ?? netModel
    const beforeRate = evaluateSelfPlayWinRate(before)
    let working = netModel
    let curve = [...trainingCurve]
    let last: SelfPlayResult | null = null

    const step = (index: number) => {
      if (index >= total) {
        const afterRate = evaluateSelfPlayWinRate(working)
        curve = [...curve, afterRate]
        setTrainingCurve(curve)
        setNetModel(working)
        setLastResult(last)
        const gate = passesImprovementGate(afterRate, beforeRate)
        setGateMsg(gate.reason)
        const built = buildProofFile({
          appVersion,
          model: working,
          modelBefore: before,
          lastMatch: last,
          trainingCurve: curve,
          gatePassed: gate.passed,
          gateReason: gate.reason,
          beforeWinRate: beforeRate,
          afterWinRate: afterRate,
        })
        setProof(built)
        setLeague(built.league)
        setAnalysisDone(true)
        setTrainingBusy(false)
        return
      }
      const batch = collectSelfPlayTrainingBatch(working, 3, 7000 + index * 10)
      last = batch.results.at(-1) ?? last
      const trained = trainFromSelfPlaySamples(attachValueHead(working), batch.samples, 0.02)
      working = trained.policy
      setTrainingProgress({ done: index + 1, total })
      window.setTimeout(() => step(index + 1), 30)
    }
    window.setTimeout(() => step(0), 30)
  }, [trainingBusy, netModel, appVersion, setNetModel, trainingCurve, bundle])

  const runVerify = useCallback(() => {
    if (!proof || !netModel) return
    setVerifyBusy(true)
    window.setTimeout(() => {
      const result = verifyProofFile(proof, netModel)
      setVerifyOk(result.ok)
      setVerifyBusy(false)
    }, 40)
  }, [proof, netModel])

  const saveCheckpoint = useCallback(() => {
    if (!netModel || verifyOk !== true) return
    const gate = passesImprovementGate(
      evaluateSelfPlayWinRate(netModel),
      evaluateSelfPlayWinRate(checkpointRef.current),
    )
    if (!gate.passed) {
      setGateMsg(gate.reason)
      return
    }
    try {
      localStorage.setItem(CHECKPOINT_KEY, JSON.stringify(netModel))
      checkpointRef.current = netModel
      localStorage.removeItem(DRAFT_KEY)
      setGateMsg('Checkpoint gespeichert.')
    } catch {
      setGateMsg('Speichern fehlgeschlagen.')
    }
  }, [netModel, verifyOk])

  const mistakes = useMemo(
    () => (lastResult ? findMistakeCandidates(lastResult.moves) : []),
    [lastResult],
  )
  const stats = useMemo(
    () => (lastResult ? aggregateReviewStats(lastResult.moves, mistakes) : null),
    [lastResult, mistakes],
  )

  const downloadProof = useCallback(() => {
    if (!proof) return
    const blob = new Blob([JSON.stringify(proof, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `yugioh-nachweis-${proof.weightsSha256}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [proof])

  return (
    <section className="ygo-dev-panel" aria-label="Yu-Gi-Oh Entwicklermenü">
      <div className="ygo-dev-grid">
        <div className="ygo-dev-col">
          <h2>Self-Play Zuschauer</h2>
          <p>Zwei Klone, sichtbarer Stepper. Dein laufendes Duell bleibt erhalten; Jarvis pausiert im Dev-Modus.</p>
          <div className="ygo-actions">
            <button type="button" className="ygo-primary" onClick={startSpectator}>KI-gegen-KI starten</button>
            <button type="button" disabled={!spectator} onClick={() => setSpectatorPaused((p) => !p)}>{spectatorPaused ? 'Weiter' : 'Pause'}</button>
            <button type="button" disabled={!spectator} onClick={() => setSpectator(null)}>Beenden</button>
          </div>
          <label>Tempo
            <select value={pace} onChange={(e) => setPace(e.target.value as Pace)}>
              <option value="realtime">Echtzeit</option>
              <option value="fast">Schnell</option>
              <option value="hidden">Nur Infos</option>
            </select>
          </label>
          {spectator ? (
            <p className="ygo-muted">{spectator.message} · Zug {spectator.halfTurn}{spectator.end ? ` · Ende: ${spectator.end}` : ''}</p>
          ) : null}
          {board && pace !== 'hidden' ? (
            <div className="ygo-mini-board" aria-hidden>
              <span>Du {board.player.lp} LP</span>
              <span>Ultron {board.jarvis.lp} LP</span>
            </div>
          ) : null}
        </div>

        <div className="ygo-dev-col">
          <h2>Training · Liga · Nachweis</h2>
          <button type="button" className="ygo-primary" disabled={trainingBusy || !netModel} onClick={runTraining}>
            {trainingBusy ? `Trainiert … ${trainingProgress.done}/${trainingProgress.total}` : 'Self-Play trainieren (8×3 Matches)'}
          </button>
          {trainingCurve.length ? (
            <p>Winrate-Kurve: {trainingCurve.map((v) => `${(v * 100).toFixed(0)}%`).join(' → ')}</p>
          ) : null}
          {stats ? (
            <p>Review: {stats.mistakeCandidates} Fehlerkandidaten · {stats.totalMoves} Züge</p>
          ) : null}
          {analysisDone ? (
            <>
              <button type="button" className="ygo-primary" disabled={verifyBusy} onClick={runVerify}>
                {verifyBusy ? 'Verify läuft …' : 'Verify (Hash + Nachspielen)'}
              </button>
              {verifyOk === true ? (
                <button type="button" className="ygo-primary" onClick={saveCheckpoint}>Checkpoint speichern (Gate + Verify)</button>
              ) : verifyOk === false ? (
                <p className="ygo-error" role="alert">Verify rot — nichts wird überschrieben.</p>
              ) : null}
            </>
          ) : null}
          {gateMsg ? <p className="ygo-message">{gateMsg}</p> : null}
          {proof ? (
            <div className="ygo-actions">
              <button type="button" onClick={downloadProof}>Nachweis-JSON laden</button>
              <button
                type="button"
                onClick={() => {
                  const md = proofMarkdownSummary(proof)
                  void navigator.clipboard?.writeText(md)
                }}
              >Kurzbericht kopieren</button>
            </div>
          ) : null}
          {league.length ? (
            <ul className="ygo-league-list">
              {league.map((e) => (
                <li key={e.id}>{e.label}: {Math.round(e.rating)} ±{Math.round(400 / Math.sqrt(Math.max(1, e.games)))}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      {trainingBusy && board && pace !== 'hidden' ? (
        <div className="ygo-training-overlay">
          <div className="ygo-training-board">
            <p>Live Self-Play</p>
            <div className="ygo-mini-board">
              <span>{board.player.lp} LP</span>
              <span>{board.jarvis.lp} LP</span>
            </div>
          </div>
          <div className="ygo-training-side">
            <p>Match {trainingProgress.done}/{trainingProgress.total}</p>
            <p>Value-Kopf: {bundle?.schema === 2 ? 'v2 aktiv' : '—'}</p>
          </div>
        </div>
      ) : null}

      {lastResult && analysisDone ? (
        <details className="ygo-match-log">
          <summary>Match-Log ({lastResult.moves.length} Züge)</summary>
          <button
            type="button"
            onClick={() => {
              const blob = new Blob([JSON.stringify(lastResult, null, 2)], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `selfplay-${lastResult.seed}.json`
              a.click()
              URL.revokeObjectURL(url)
            }}
          >JSON exportieren</button>
          <ol>
            {mistakes.slice(0, 12).map((m) => (
              <li key={m.move}>Zug {m.move}: {m.label} (besser: {m.bestAlternative})</li>
            ))}
          </ol>
        </details>
      ) : null}
    </section>
  )
}

export function quickSelfPlaySmoke(): SelfPlayResult {
  return playSelfPlayMatch({ seed: 42, deckSource: 'generated' })
}
