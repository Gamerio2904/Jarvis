import { useCallback, useEffect, useMemo, useState } from 'react'
import type { DuelState } from '../engine/yugioh-duel.ts'
import {
  createNetModel,
  evaluatePolicy,
  FEATURE_COUNT,
  greedyNetPolicy,
  heuristicPolicy,
  randomPolicy,
  trainNetPolicy,
  type NetModel,
} from '../engine/yugioh-net.ts'
import {
  buildNetRun,
  loadNetRuns,
  netFileFromModel,
  netFileFromRun,
  saveNetRun,
  sortNetRuns,
  type NetRunFile,
  type RunSort,
} from '../engine/yugioh-net-run.ts'
import {
  createSelfPlayMatch,
  matchBoard,
  playSelfPlayMatch,
  stepSelfPlayMatch,
  type SelfPlayMatch,
  type SelfPlayResult,
  DEFAULT_AGENT,
} from '../engine/yugioh-selfplay.ts'
import { buildProofFile } from '../engine/yugioh-proof.ts'
import { YugiohNetViz } from './YugiohNetViz.tsx'

const PRESETS = [
  { id: 'fast', label: 'Schnell', episodes: 120 },
  { id: 'mid', label: 'Mittel', episodes: 500 },
  { id: 'deep', label: 'Tief', episodes: 1500 },
] as const

const HOLDOUT_SEED = 918273
const HOLDOUT_GAMES = 36

function downloadJson(name: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

function pct(value: number) {
  return `${(value * 100).toFixed(1)} %`
}

function GlassBoard({ match }: { match: SelfPlayMatch }) {
  const board = matchBoard(match)
  const chip = (cards: { id: number; name: string; atk?: number }[]) => (
    cards.length
      ? cards.slice(0, 6).map((card) => <span key={card.id}>{card.name}{typeof card.atk === 'number' ? ` ${card.atk}` : ''}</span>)
      : <span className="is-empty">leer</span>
  )
  const side = (name: string, player: { lp: number; hand: { id: number; name: string; atk?: number }[]; monsters: { id: number; name: string; atk?: number }[] }, footer = false) => (
    <div className={`ygo-lab-side${footer ? ' is-netz' : ''}`}>
      {footer ? null : <header><span>{name}</span><em>{player.hand.length} Hand</em><strong>{player.lp} LP</strong></header>}
      <div className="ygo-lab-row" aria-label={`${name} Monster`}>{chip(player.monsters)}</div>
      <div className="ygo-lab-row" aria-label={`${name} Hand`}>{chip(player.hand)}</div>
      {footer ? <header><span>{name}</span><em>{player.hand.length} Hand</em><strong>{player.lp} LP</strong></header> : null}
    </div>
  )
  return (
    <div className="ygo-lab-board" aria-label="Sichtbare Partie Netz gegen Klon">
      {side('Klon', board.jarvis)}
      <p className="ygo-lab-move">{match.message}</p>
      {side('Netz', board.player, true)}
    </div>
  )
}

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
  const [preset, setPreset] = useState<(typeof PRESETS)[number]['id']>('fast')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [progress, setProgress] = useState(0)
  const [spectator, setSpectator] = useState<SelfPlayMatch | null>(null)
  const [auto, setAuto] = useState(false)
  const [runs, setRuns] = useState<NetRunFile[]>(() => loadNetRuns())
  const [sort, setSort] = useState<RunSort>('score')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const episodes = PRESETS.find((item) => item.id === preset)?.episodes ?? 120
  const sorted = useMemo(() => sortNetRuns(runs, sort), [runs, sort])
  const selected = sorted.find((run) => run.id === selectedId) ?? sorted[0] ?? null

  useEffect(() => {
    if (playerGame && !pausedJarvis) setPausedJarvis(true)
  }, [playerGame, pausedJarvis, setPausedJarvis])

  useEffect(() => {
    if (!spectator || !auto || spectator.end || busy) return
    const t = window.setTimeout(() => setSpectator((current) => (current && !current.end ? stepSelfPlayMatch(current) : current)), 700)
    return () => window.clearTimeout(t)
  }, [spectator, auto, busy])

  const storeRun = useCallback((file: NetRunFile) => {
    const next = saveNetRun(file)
    setRuns(next)
    setSelectedId(file.id)
    setStatus(`${file.id} · Erfolg ${pct(file.score)}`)
  }, [])

  const measureAndStore = useCallback((options: {
    model: NetModel
    before: NetModel | null
    mode: 'fast' | 'step'
    episodes: number
    seed: number
    validation: number
    training: { wins: number; losses: number; draws: number }
    match: SelfPlayResult | null
  }) => {
    setStatus('Misst den Erfolg …')
    window.setTimeout(() => {
      const net = evaluatePolicy(greedyNetPolicy(options.model), HOLDOUT_GAMES, HOLDOUT_SEED)
      const heuristic = evaluatePolicy(heuristicPolicy, HOLDOUT_GAMES, HOLDOUT_SEED)
      const random = evaluatePolicy(randomPolicy, HOLDOUT_GAMES, HOLDOUT_SEED)
      const swapped = evaluatePolicy(greedyNetPolicy(options.model), 12, 424242, undefined, true)
      const match = options.match ?? playSelfPlayMatch({
        seed: options.seed,
        deckSource: 'generated',
        agents: [
          { ...DEFAULT_AGENT, name: 'Netz', model: options.model, search: null, temperature: 0 },
          { ...DEFAULT_AGENT, name: 'Klon', model: options.model, search: null, temperature: 0 },
        ],
      })
      const file = buildNetRun({
        appVersion,
        mode: options.mode,
        episodes: options.episodes,
        seed: options.seed,
        model: options.model,
        modelBefore: options.before,
        score: net.winRate,
        versus: { net: net.winRate, heuristic: heuristic.winRate, random: random.winRate, games: HOLDOUT_GAMES, seed: HOLDOUT_SEED },
        validation: options.validation,
        training: options.training,
        match,
      })
      storeRun(file)
      setStatus(`${file.id} · Erfolg ${pct(file.score)} · Seitenwechsel ${pct(swapped.winRate)} (Seed 424242, 12 Duelle, entscheidet nicht)`)
      setBusy(false)
      setProgress(1)
    }, 30)
  }, [appVersion, storeRun])

  const exportProof = useCallback((model: NetModel) => {
    if (busy) return
    setBusy(true)
    setStatus('Nachweis wird gerechnet. Format jarvis-yugioh-proof-v1, dieselben öffentlichen Seeds wie bisher.')
    window.setTimeout(() => {
      try {
        const proof = buildProofFile({
          appVersion,
          model,
          gatePassed: false,
          gateReason: 'manuell exportiert',
        })
        downloadJson(`yugioh-nachweis-${proof.weightsSha256}.json`, proof)
        setStatus(`Nachweis ${proof.format} exportiert. Hash ${proof.weightsSha256}. Öffentliche Seeds ${proof.publicSeeds.join(', ')}.`)
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'Nachweis fehlgeschlagen.')
      } finally {
        setBusy(false)
      }
    }, 30)
  }, [appVersion, busy])

  const runFast = useCallback(() => {
    if (busy) return
    setBusy(true)
    setAuto(false)
    setSpectator(null)
    setProgress(0)
    const seed = Date.now() % 0x7fffffff
    const before = netModel
    let model = netModel || createNetModel(16, seed)
    setNetModel(model)
    const chunk = 40
    const steps = Math.ceil(episodes / chunk)
    let validation = 0
    let training = { wins: 0, losses: 0, draws: 0 }
    const step = (index: number) => {
      if (index >= steps) {
        measureAndStore({ model, before, mode: 'fast', episodes, seed, validation, training, match: null })
        return
      }
      const trained = trainNetPolicy({ model, episodes: Math.min(chunk, episodes - index * chunk), seed: seed + index, validationGames: 20 })
      model = trained.model
      validation = Math.max(validation, trained.bestValidation)
      training = {
        wins: training.wins + trained.wins,
        losses: training.losses + trained.losses,
        draws: training.draws + trained.draws,
      }
      setNetModel(model)
      setProgress((index + 1) / (steps + 1))
      setStatus(`Training ${Math.min(episodes, (index + 1) * chunk)} / ${episodes} ohne Brett`)
      window.setTimeout(() => step(index + 1), 16)
    }
    setStatus('Training startet ohne Brett')
    window.setTimeout(() => step(0), 16)
  }, [busy, episodes, measureAndStore, netModel, setNetModel])

  const startStep = useCallback(() => {
    if (busy || !netModel) return
    setAuto(false)
    setStatus('Schritt für Schritt. Netz gegen seinen Klon.')
    setSpectator(createSelfPlayMatch({
      seed: Date.now() % 0x7fffffff,
      deckSource: 'generated',
      agents: [
        { ...DEFAULT_AGENT, name: 'Netz', model: netModel, search: null, temperature: 0 },
        { ...DEFAULT_AGENT, name: 'Klon', model: netModel, search: null, temperature: 0 },
      ],
    }))
  }, [busy, netModel])

  const finishStep = useCallback(() => {
    if (!spectator?.end || busy || !netModel) return
    setBusy(true)
    setAuto(false)
    const result: SelfPlayResult = {
      seed: spectator.seed,
      decks: spectator.decks,
      winner: spectator.winner,
      end: spectator.end,
      halfTurns: spectator.halfTurn,
      lp: (() => {
        const board = matchBoard(spectator)
        return [board.player.lp, board.jarvis.lp]
      })(),
      moves: spectator.moves,
    }
    measureAndStore({
      model: netModel,
      before: null,
      mode: 'step',
      episodes: 0,
      seed: spectator.seed,
      validation: 0,
      training: { wins: 0, losses: 0, draws: 0 },
      match: result,
    })
  }, [busy, measureAndStore, netModel, spectator])

  return (
    <section className="ygo-lab" aria-label="Neuronales Netz">
      <header className="ygo-lab-head">
        <div>
          <p className="ygo-eyebrow">NETZ</p>
          <h2>Neuronales Netz</h2>
          <p>{FEATURE_COUNT} Merkmale · {netModel?.hidden ?? 16} Neuronen · lokal auf dem Gerät</p>
        </div>
        <YugiohNetViz model={netModel} training={busy} />
      </header>

      <div className="ygo-lab-controls">
        <div className="ygo-lab-presets" role="group" aria-label="Trainingslänge">
          {PRESETS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={preset === item.id ? 'is-on' : ''}
              aria-pressed={preset === item.id}
              disabled={busy}
              onClick={() => setPreset(item.id)}
            >
              {item.label}
              <small>{item.episodes}</small>
            </button>
          ))}
        </div>
        <button type="button" className="ygo-primary" disabled={busy} onClick={runFast}>
          {busy && !spectator ? 'Läuft …' : 'Schnell ohne Brett'}
        </button>
        <button type="button" disabled={busy || !netModel} onClick={startStep}>
          {netModel ? 'Schritt für Schritt' : 'Zuerst schnell trainieren'}
        </button>
        {netModel ? (
          <button type="button" onClick={() => downloadJson(`yugioh-netz-${Date.now()}.json`, netFileFromModel(netModel))}>
            Aktuelles Netz
          </button>
        ) : null}
        {netModel ? (
          <button type="button" disabled={busy} onClick={() => exportProof(netModel)}>
            Nachweis
          </button>
        ) : null}
      </div>

      {busy || progress > 0 ? (
        <div className="ygo-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
          <i style={{ width: `${progress * 100}%` }} />
        </div>
      ) : null}
      {status ? <p className="ygo-lab-status" role="status">{status}</p> : null}

      {spectator ? (
        <div className="ygo-lab-stage">
          <GlassBoard match={spectator} />
          <div className="ygo-lab-controls">
            <button type="button" disabled={Boolean(spectator.end)} onClick={() => setSpectator((current) => (current && !current.end ? stepSelfPlayMatch(current) : current))}>Ein Zug</button>
            <button type="button" disabled={Boolean(spectator.end)} onClick={() => setAuto((value) => !value)}>{auto ? 'Pause' : 'Automatisch'}</button>
            <button type="button" disabled={!spectator.end || busy} onClick={finishStep}>{spectator.end ? 'Lauf speichern' : 'Partie läuft'}</button>
            <button type="button" onClick={() => { setSpectator(null); setAuto(false) }}>Schließen</button>
          </div>
          <p className="ygo-muted">Zug {spectator.halfTurn}{spectator.end ? ` · ${spectator.end}` : ''}</p>
        </div>
      ) : null}

      <div className="ygo-lab-list-head">
        <h3>Läufe</h3>
        <label>Sortierung
          <select aria-label="Läufe sortieren" value={sort} onChange={(event) => setSort(event.target.value as RunSort)}>
            <option value="score">Höchster Erfolg</option>
            <option value="newest">Neueste</option>
            <option value="episodes">Meiste Episoden</option>
          </select>
        </label>
      </div>
      {sorted.length ? (
        <ul className="ygo-lab-list">
          {sorted.map((run) => (
            <li key={run.id} className={selected?.id === run.id ? 'is-on' : ''}>
              <button type="button" className="ygo-lab-run" onClick={() => setSelectedId(run.id)}>
                <strong>{pct(run.score)}</strong>
                <span>{run.mode === 'fast' ? 'Schnell' : 'Schritt'} · {run.episodes} Episoden</span>
                <small>{run.id}</small>
              </button>
              <div className="ygo-lab-run-actions">
                <button type="button" onClick={() => downloadJson(`${run.id}.json`, run)}>Lauf-JSON</button>
                <button type="button" onClick={() => downloadJson(`${run.id}-netz.json`, netFileFromRun(run))}>Netz</button>
                <button type="button" disabled={busy} onClick={() => exportProof(run.model)}>Nachweis</button>
              </div>
            </li>
          ))}
        </ul>
      ) : <p className="ygo-muted">Noch kein Lauf. Schnell trainiert ohne Brett. Schritt für Schritt zeigt jede Aktion.</p>}

      {selected ? (
        <article className="ygo-lab-detail" aria-label="Gewählter Lauf">
          <header>
            <strong>{selected.id}</strong>
            <span>Erfolg {pct(selected.score)} · Heuristik {pct(selected.versus.heuristic)} · Zufall {pct(selected.versus.random)}</span>
          </header>
          <p>{selected.match ? `${selected.match.moves.length} Züge · ${selected.match.decks[0]} gegen ${selected.match.decks[1]} · ${selected.match.winnerLabel}` : 'Keine Partie im Lauf.'}</p>
          {selected.improvements.length ? (
            <ol>
              {selected.improvements.slice(0, 6).map((item) => (
                <li key={`${selected.id}-${item.move}`}>Zug {item.move}, {item.actor}: {item.label}. Besser: {item.better}.</li>
              ))}
            </ol>
          ) : <p>Keine klaren Fehlzüge in der gespeicherten Partie.</p>}
          <ul className="ygo-lab-notes">
            {selected.notes.slice(0, 4).map((note) => <li key={note}>{note}</li>)}
          </ul>
        </article>
      ) : null}
    </section>
  )
}

export function quickSelfPlaySmoke(): SelfPlayResult {
  return playSelfPlayMatch({ seed: 42, deckSource: 'generated' })
}
