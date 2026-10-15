import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { DuelState } from '../engine/yugioh-duel.ts'
import {
  attachValueHead,
  trainFromSelfPlaySamples,
  validateNetModel,
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
  const checkpointRef = useRef<NetModel | null>(null)

  useEffect(() => {
    if (playerGame && !pausedJarvis) setPausedJarvis(true)
  }, [playerGame, pausedJarvis, setPausedJarvis])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CHECKPOINT_KEY)
      if (raw) checkpointRef.current = validateNetModel(JSON.parse(raw) as NetModel)
    } catch { /* ignore */ }
  }, [])

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
  }, [trainingBusy, netModel, appVersion, setNetModel, trainingCurve])

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
          <h2>Zuschauen</h2>
          <p>Zwei Kopien der aktuellen KI spielen gegeneinander. Dein eigenes Duell bleibt stehen, solange diese Ansicht offen ist.</p>
          <div className="ygo-actions">
            <button type="button" className="ygo-primary" onClick={startSpectator}>Partie starten</button>
            <button type="button" disabled={!spectator} onClick={() => setSpectatorPaused((p) => !p)}>{spectatorPaused ? 'Weiter' : 'Pause'}</button>
            <button type="button" disabled={!spectator} onClick={() => setSpectator(null)}>Schließen</button>
          </div>
          <label>Geschwindigkeit
            <select value={pace} onChange={(e) => setPace(e.target.value as Pace)}>
              <option value="realtime">Langsam, Zug für Zug</option>
              <option value="fast">Schnell</option>
              <option value="hidden">Nur das Ergebnis</option>
            </select>
          </label>
          {spectator ? (
            <p className="ygo-muted">{spectator.message} · Zug {spectator.halfTurn}{spectator.end ? ` · Ende: ${spectator.end}` : ''}</p>
          ) : <p className="ygo-muted">Noch keine Partie. „Partie starten“ spielt eine Runde vor.</p>}
          {board && pace !== 'hidden' ? (
            <div className="ygo-mini-board" aria-hidden>
              <span>Klon A {board.player.lp} LP</span>
              <span>Klon B {board.jarvis.lp} LP</span>
            </div>
          ) : null}
        </div>

        <div className="ygo-dev-col">
          <h2>Lernen und prüfen</h2>
          <p>Das Netz spielt 8 Durchgänge à 3 Partien gegen sich selbst. Danach prüfst du den Nachweis und speicherst nur, wenn die Prüfung grün ist.</p>
          <button type="button" className="ygo-primary" disabled={trainingBusy || !netModel} onClick={runTraining}>
            {trainingBusy ? `Lernt … ${trainingProgress.done}/${trainingProgress.total}` : netModel ? 'Lernen starten' : 'Zuerst ein Duell starten, damit ein Netz da ist'}
          </button>
          {trainingCurve.length ? (
            <p>Siegquote nach jedem Durchgang: {trainingCurve.map((v) => `${(v * 100).toFixed(0)}%`).join(' → ')}</p>
          ) : null}
          {stats ? (
            <p>Letzte Partie: {stats.mistakeCandidates} fragliche Züge von {stats.totalMoves}.</p>
          ) : null}
          {analysisDone ? (
            <>
              <button type="button" className="ygo-primary" disabled={verifyBusy} onClick={runVerify}>
                {verifyBusy ? 'Prüfung läuft …' : 'Nachweis prüfen'}
              </button>
              {verifyOk === true ? (
                <button type="button" className="ygo-primary" onClick={saveCheckpoint}>Geprüftes Netz merken</button>
              ) : verifyOk === false ? (
                <p className="ygo-error" role="alert">Prüfung fehlgeschlagen. Das alte Netz bleibt.</p>
              ) : null}
            </>
          ) : null}
          {gateMsg ? <p className="ygo-message">{gateMsg}</p> : null}
          {proof ? (
            <div className="ygo-actions">
              <button type="button" onClick={downloadProof}>Nachweis herunterladen</button>
              <button
                type="button"
                onClick={() => {
                  const md = proofMarkdownSummary(proof)
                  void navigator.clipboard?.writeText(md)
                }}
              >Kurztext kopieren</button>
            </div>
          ) : null}
          {league.length ? (
            <ul className="ygo-league-list">
              {league.map((e) => (
                <li key={e.id}>{e.label}: {Math.round(e.rating)} Punkte</li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

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
