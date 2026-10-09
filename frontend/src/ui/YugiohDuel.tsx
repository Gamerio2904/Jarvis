import { useEffect, useMemo, useRef, useState } from 'react'
import {
  activateDuelEffect,
  advanceDuelPhase,
  attack,
  canActivateCard,
  changePosition,
  checkActivation,
  coinFlip,
  createDuel,
  DUEL_SOUP_WEIGHTS,
  duelStateVector,
  effectFromDescription,
  extraSummonMaterials,
  findMaterialsForExtra,
  giveFirstTurn,
  passDuelChain,
  selectAttacker,
  setSpellTrap,
  startJarvisTurn,
  summonExtraMonster,
  summonMonster,
  type DuelCard,
  type DuelSide,
  type DuelState,
  type StrategyWeights,
} from '../engine/yugioh-duel.ts'
import { REAL_DECK_LIST, buildRealDeck, findRealDeck, pickUltronDeck } from '../engine/yugioh-deck-library.ts'
import { evaluateDuelPolicy, trainDuelPolicy, type EvaluationResult } from '../engine/yugioh-training.ts'
import {
  createNetModel,
  evaluatePolicy,
  greedyNetPolicy,
  heuristicPolicy,
  jarvisStep,
  randomPolicy,
  trainNetPolicy,
  validateNetModel,
  type NetEvaluation,
  type NetModel,
} from '../engine/yugioh-net.ts'
import { YugiohNetViz } from './YugiohNetViz.tsx'
import './yugioh-duel.css'

type ApiCard = {
  id?: unknown
  name?: unknown
  type?: unknown
  atk?: unknown
  def?: unknown
  level?: unknown
  card_images?: unknown
  banlist_info?: unknown
  desc?: unknown
  linkval?: unknown
  race?: unknown
}

const MAIN_KEY = 'jarvis_yugioh_main_v1'
const EXTRA_KEY = 'jarvis_yugioh_extra_v1'
const WEIGHTS_KEY = 'jarvis_yugioh_policy_v1'
const NET_KEY = 'jarvis_yugioh_net_v1'
const BASELINE_WEIGHTS = DUEL_SOUP_WEIGHTS

function parseWeights(raw: string | null): StrategyWeights {
  if (!raw) return { ...BASELINE_WEIGHTS }
  const parsed: unknown = JSON.parse(raw)
  if (!parsed || typeof parsed !== 'object') throw new Error('Das gespeicherte Trainingsmodell ist ungültig.')
  const candidate = parsed as Partial<StrategyWeights>
  const keys: (keyof StrategyWeights)[] = ['damage', 'board', 'resources', 'safety', 'combo']
  if (keys.some((key) => typeof candidate[key] !== 'number' || !Number.isFinite(candidate[key]))) {
    throw new Error('Das gespeicherte Trainingsmodell enthält ungültige Gewichte.')
  }
  return candidate as StrategyWeights
}

function readCardList(raw: string | null): DuelCard[] {
  if (!raw) return []
  const parsed: unknown = JSON.parse(raw)
  if (!Array.isArray(parsed)) throw new Error('Der gespeicherte Kartenstapel ist ungültig.')
  return parsed.map((item: unknown) => {
    if (!item || typeof item !== 'object') throw new Error('Eine gespeicherte Karte ist ungültig.')
    const card = item as Partial<DuelCard>
    if (
      !Number.isInteger(card.id) ||
      typeof card.name !== 'string' ||
      typeof card.type !== 'string' ||
      !['monster', 'spell', 'trap'].includes(card.kind || '')
    ) {
      throw new Error('Eine gespeicherte Karte hat unvollständige Daten.')
    }
    return card as DuelCard
  })
}

function apiCards(payload: unknown): DuelCard[] {
  if (!payload || typeof payload !== 'object' || !Array.isArray((payload as { data?: unknown }).data)) {
    throw new Error('Die Kartendatenbank hat eine unerwartete Antwort geliefert.')
  }
  return ((payload as { data: ApiCard[] }).data).flatMap((card) => {
    if (typeof card.id !== 'number' || !Number.isInteger(card.id) || typeof card.name !== 'string' || typeof card.type !== 'string') return []
    const kind = /spell/i.test(card.type) ? 'spell' : /trap/i.test(card.type) ? 'trap' : 'monster'
    const extra = /fusion|synchro|xyz|link/i.test(card.type)
    const extraKind = /fusion/i.test(card.type) ? 'fusion' : /synchro/i.test(card.type) ? 'synchro' : /xyz/i.test(card.type) ? 'xyz' : /link/i.test(card.type) ? 'link' : undefined
    const description = typeof card.desc === 'string' ? card.desc : ''
    const parsedEffect = /normal monster/i.test(card.type) ? null : effectFromDescription(description)
    const linkRating = typeof card.linkval === 'number' ? card.linkval : undefined
    const images = Array.isArray(card.card_images) ? card.card_images : []
    const imageUrl =
      images[0] && typeof images[0] === 'object' && typeof (images[0] as { image_url?: unknown }).image_url === 'string'
        ? (images[0] as { image_url: string }).image_url
        : undefined
    const banlist = card.banlist_info && typeof card.banlist_info === 'object'
      ? (card.banlist_info as Record<string, unknown>).ban_tcg
      : undefined
    const copyLimit = banlist === 'Forbidden' ? 0 : banlist === 'Limited' ? 1 : banlist === 'Semi-Limited' ? 2 : 3
    return [{
      id: card.id,
      catalogId: card.id,
      copyLimit,
      name: card.name,
      type: card.type,
      kind,
      atk: typeof card.atk === 'number' ? card.atk : undefined,
      def: typeof card.def === 'number' ? card.def : undefined,
      level: typeof card.level === 'number' ? card.level : undefined,
      linkRating,
      ...(kind !== 'monster' && typeof card.race === 'string' ? { subtype: card.race } : {}),
      tuner: /\btuner\b/i.test(description),
      ...(extraKind ? { extraKind } : {}),
      ...(parsedEffect ? { effect: parsedEffect.effect, effectSummary: parsedEffect.summary } : {}),
      imageUrl,
      extraDeck: extra,
    }]
  })
}

function counts(cards: DuelCard[], card: DuelCard): number {
  return cards.filter((item) => (item.catalogId ?? item.id) === (card.catalogId ?? card.id)).length
}

function shortCard(card: DuelCard) {
  return `${card.name}${card.kind === 'monster' ? ` · ${card.atk ?? 0}/${card.def ?? 0}` : ''}`
}

function CardTile({ card, onClick, disabled = false }: { card: DuelCard; onClick?: () => void; disabled?: boolean }) {
  const content = (
    <>
      {card.faceDown
        ? <span className="ygo-card-type">SET</span>
        : card.imageUrl ? <img src={card.imageUrl} alt="" loading="lazy" /> : <span className="ygo-card-type">{card.kind.toUpperCase()}</span>}
      <strong>{card.name}</strong>
      <small>{card.kind === 'monster' ? `${card.atk ?? 0} ATK · ${card.def ?? 0} DEF` : card.type}</small>
      {card.effectSummary ? <small className="ygo-effect-label">{card.effectSummary}</small> : null}
    </>
  )
  return onClick ? (
    <button className="ygo-card" type="button" onClick={onClick} disabled={disabled} title={shortCard(card)}>
      {content}
    </button>
  ) : (
    <div className="ygo-card ygo-card-fixed" title={shortCard(card)}>{content}</div>
  )
}

export function YugiohDuel({ onClose }: { onClose: () => void }) {
  const [mainDeck, setMainDeck] = useState<DuelCard[]>([])
  const [extraDeck, setExtraDeck] = useState<DuelCard[]>([])
  const [deckLoaded, setDeckLoaded] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<DuelCard[]>([])
  const [searchBusy, setSearchBusy] = useState(false)
  const [game, setGame] = useState<DuelState | null>(null)
  const [weights, setWeights] = useState<StrategyWeights>({ ...BASELINE_WEIGHTS })
  const [trainingBusy, setTrainingBusy] = useState(false)
  const [trainingResult, setTrainingResult] = useState<ReturnType<typeof trainDuelPolicy> | null>(null)
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null)
  const [baselineEvaluation, setBaselineEvaluation] = useState<EvaluationResult | null>(null)
  const [evaluationBusy, setEvaluationBusy] = useState(false)
  const [netModel, setNetModel] = useState<NetModel | null>(null)
  const [jarvisBrain, setJarvisBrain] = useState<'net' | 'script'>('net')
  const [jarvisDeck, setJarvisDeck] = useState<string>('random')
  const [startBusy, setStartBusy] = useState(false)
  const [netBusy, setNetBusy] = useState(false)
  const [netProgress, setNetProgress] = useState(0)
  const [netEval, setNetEval] = useState<{ net: NetEvaluation; random: NetEvaluation; heuristic: NetEvaluation } | null>(null)
  const [focusedCard, setFocusedCard] = useState<{ side: DuelSide; zone: string; id: number } | null>(null)
  const [showPlayerGrave, setShowPlayerGrave] = useState(false)
  const [showJarvisGrave, setShowJarvisGrave] = useState(false)
  const [showPlayerExtra, setShowPlayerExtra] = useState(false)
  const [extraCardId, setExtraCardId] = useState<number | null>(null)
  const [extraMaterials, setExtraMaterials] = useState<number[]>([])
  const [jarvisPaused, setJarvisPaused] = useState(false)
  const [jarvisThinking, setJarvisThinking] = useState(false)
  const [coin, setCoin] = useState<{ result: DuelSide; duel: DuelState; settled: boolean } | null>(null)
  const [cardTextCache, setCardTextCache] = useState<Record<number, string>>({})
  const [cardTextBusy, setCardTextBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [searchError, setSearchError] = useState('')
  const nextCardId = useRef(1_000_000_000)
  const [demoDeckId, setDemoDeckId] = useState(REAL_DECK_LIST[0]?.id ?? '')

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  useEffect(() => {
    try {
      const main = readCardList(localStorage.getItem(MAIN_KEY))
      const extra = readCardList(localStorage.getItem(EXTRA_KEY))
      setMainDeck(main)
      setExtraDeck(extra)
      setWeights(parseWeights(localStorage.getItem(WEIGHTS_KEY)))
      const storedNet = localStorage.getItem(NET_KEY)
      if (storedNet) setNetModel(validateNetModel(JSON.parse(storedNet) as NetModel))
      nextCardId.current = Math.max(nextCardId.current, ...main.map((card) => card.id + 1), ...extra.map((card) => card.id + 1))
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Das gespeicherte Deck konnte nicht gelesen werden.')
    } finally {
      setDeckLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (!deckLoaded) return
    try {
      localStorage.setItem(MAIN_KEY, JSON.stringify(mainDeck))
      localStorage.setItem(EXTRA_KEY, JSON.stringify(extraDeck))
      localStorage.setItem(WEIGHTS_KEY, JSON.stringify(weights))
      if (netModel) localStorage.setItem(NET_KEY, JSON.stringify(netModel))
    } catch (error) {
      setNotice(error instanceof Error ? `Deck konnte nicht gespeichert werden: ${error.message}` : 'Deck konnte nicht gespeichert werden.')
    }
  }, [deckLoaded, mainDeck, extraDeck, weights, netModel])

  useEffect(() => {
    const term = query.trim()
    if (term.length < 2) {
      setResults([])
      setSearchError('')
      return
    }
    const controller = new AbortController()
    const timeout = window.setTimeout(() => {
      setSearchBusy(true)
      setSearchError('')
      void fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(term)}`, {
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) throw new Error(`Kartendatenbank antwortet mit HTTP ${response.status}.`)
          return apiCards(await response.json())
        })
        .then(setResults)
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === 'AbortError') return
          setSearchError(error instanceof Error ? error.message : 'Kartensuche fehlgeschlagen.')
          setResults([])
        })
        .finally(() => setSearchBusy(false))
    }, 350)
    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [query])

  const stateVector = useMemo(() => (game ? duelStateVector(game) : []), [game])

  function addCard(card: DuelCard) {
    const extra = Boolean(card.extraDeck)
    const destination = extra ? extraDeck : mainDeck
    if (extra && destination.length >= 15) {
      setNotice('Das Extra Deck darf höchstens 15 Karten enthalten.')
      return
    }
    if (!extra && destination.length >= 60) {
      setNotice('Das Main Deck darf höchstens 60 Karten enthalten.')
      return
    }
    const limit = card.copyLimit ?? 3
    if (limit === 0 || counts([...mainDeck, ...extraDeck], card) >= limit) {
      setNotice(limit === 0 ? `${card.name} ist auf der TCG-Liste verboten.` : `${card.name}: maximal ${limit} Exemplar(e) laut TCG-Liste.`)
      return
    }
    const copy = { ...card, id: nextCardId.current++ }
    if (extra) setExtraDeck((current) => [...current, copy])
    else setMainDeck((current) => [...current, copy])
    setNotice(`${card.name} zum ${extra ? 'Extra' : 'Main'} Deck hinzugefügt.`)
  }

  function removeCard(card: DuelCard, extra: boolean) {
    const setter = extra ? setExtraDeck : setMainDeck
    setter((current) => {
      const index = current.findIndex((entry) => entry.id === card.id)
      return index < 0 ? current : current.filter((_, i) => i !== index)
    })
  }

  function loadDemoDeck(deckId: string) {
    const real = findRealDeck(deckId)
    if (!real) return
    const deck = buildRealDeck(real, () => nextCardId.current++)
    setMainDeck(deck.main)
    setExtraDeck(deck.extra)
    setNotice(`Echtes Deck „${real.title}“ geladen (${deck.main.length} Main, ${deck.extra.length} Extra). Du kannst es noch ändern.`)
  }

  function startDuel() {
    if (startBusy) return
    setStartBusy(true)
    setNotice(jarvisBrain === 'net' && !netModel ? 'Jarvis trainiert sein Netz für das erste Duell …' : '')
    window.setTimeout(() => {
      try {
        let brain = netModel
        if (jarvisBrain === 'net' && !brain) {
          brain = trainNetPolicy({ hidden: 16, episodes: 1500, seed: 7, validationGames: 40 }).model
          setNetModel(brain)
        }
        let botMain = mainDeck.slice(0, 40)
        let botExtra = extraDeck
        let drawn = ''
        if (jarvisDeck !== 'pool') {
          const real = jarvisDeck === 'random' ? pickUltronDeck() : findRealDeck(jarvisDeck.replace(/^real:/, ''))
          if (real) {
            const built = buildRealDeck(real, () => nextCardId.current++)
            botMain = built.main
            botExtra = built.extra
            drawn = `Ultron spielt „${real.title}“.`
          }
        }
        // The duel only becomes visible after the coin flip has decided who starts.
        setGame(null)
        setCoin({ result: coinFlip(), duel: createDuel(mainDeck, botMain, Math.random, extraDeck, botExtra, weights), settled: false })
        setFocusedCard(null)
        setShowPlayerGrave(false)
        setShowJarvisGrave(false)
        setShowPlayerExtra(false)
        setExtraCardId(null)
        setExtraMaterials([])
        setJarvisPaused(false)
        setNotice(drawn)
      } catch (error) {
        setNotice(error instanceof Error ? error.message : 'Das Duell konnte nicht gestartet werden.')
      } finally {
        setStartBusy(false)
      }
    }, 30)
  }

  const coinDuel = coin?.duel
  const coinResult = coin?.result
  const coinSettled = coin?.settled

  useEffect(() => {
    if (!coinDuel) return
    const reduced = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const settle = window.setTimeout(() => setCoin((current) => (current ? { ...current, settled: true } : current)), reduced ? 400 : 2600)
    return () => window.clearTimeout(settle)
  }, [coinDuel])

  useEffect(() => {
    if (!coinSettled || !coinDuel || !coinResult) return
    const start = window.setTimeout(() => {
      setGame(giveFirstTurn(coinDuel, coinResult))
      setCoin(null)
    }, 1500)
    return () => window.clearTimeout(start)
  }, [coinSettled, coinDuel, coinResult])

  function skipCoin() {
    if (!coin) return
    setGame(giveFirstTurn(coin.duel, coin.result))
    setCoin(null)
  }

  function advancePhase() {
    if (game?.phase === 'end') {
      updateGame(startJarvisTurn)
      return
    }
    updateGame(advanceDuelPhase)
  }

  function updateGame(action: (current: DuelState) => DuelState) {
    if (!game) return
    try {
      setGame(action(game))
      setNotice('')
      setFocusedCard(null)
      setExtraCardId(null)
      setExtraMaterials([])
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Der Spielzug konnte nicht ausgeführt werden.')
    }
  }

  function openCard(side: DuelSide, zone: string, id: number) {
    setFocusedCard({ side, zone, id })
    setNotice('')
  }

  function activateEffect(side: DuelSide, cardId: number) {
    updateGame((current) => activateDuelEffect(current, side, cardId))
    setJarvisPaused(true)
  }

  function trainModel() {
    if (trainingBusy || evaluationBusy) return
    setTrainingBusy(true)
    setNotice('')
    window.setTimeout(() => {
      try {
        const trained = trainDuelPolicy(weights, 500, Date.now() % 0x7fffffff)
        const holdout = evaluateDuelPolicy(trained.weights, 300, 918273)
        const baseline = evaluateDuelPolicy(BASELINE_WEIGHTS, 300, 918273)
        if (holdout.winRate > baseline.winRate) setWeights(trained.weights)
        setTrainingResult(trained)
        setEvaluation(holdout)
        setBaselineEvaluation(baseline)
        setNotice(
          holdout.winRate > baseline.winRate
            ? `Training verbessert die Holdout-Winrate um ${((holdout.winRate - baseline.winRate) * 100).toFixed(1)} Prozentpunkte. Policy gespeichert.`
            : 'Training abgeschlossen, aber im Holdout nicht besser als die Baseline. Bisherige Policy bleibt erhalten.',
        )
      } catch (error) {
        setNotice(error instanceof Error ? error.message : 'Das Policy-Training ist fehlgeschlagen.')
      } finally {
        setTrainingBusy(false)
      }
    }, 30)
  }

  function trainNet() {
    if (netBusy || trainingBusy || evaluationBusy) return
    setNetBusy(true)
    setNetProgress(0)
    setNotice('')
    const chunks = 6
    const perChunk = 250
    const baseSeed = Date.now() % 0x7fffffff
    let model = netModel || createNetModel(16, baseSeed)
    setNetModel(model)
    const step = (index: number) => {
      try {
        if (index >= chunks) {
          const evalSeed = 918273
          setNetEval({
            net: evaluatePolicy(greedyNetPolicy(model), 200, evalSeed),
            random: evaluatePolicy(randomPolicy, 200, evalSeed),
            heuristic: evaluatePolicy(heuristicPolicy, 200, evalSeed),
          })
          setNotice('Netz-Training fertig. Es wird nur gespeichert, was die Validierung nicht verschlechtert hat.')
          setNetBusy(false)
          return
        }
        model = trainNetPolicy({ model, episodes: perChunk, seed: baseSeed + index, validationGames: 40 }).model
        setNetModel(model)
        setNetProgress((index + 1) / chunks)
        window.setTimeout(() => step(index + 1), 40)
      } catch (error) {
        setNotice(error instanceof Error ? error.message : 'Das Netz-Training ist fehlgeschlagen.')
        setNetBusy(false)
      }
    }
    window.setTimeout(() => step(0), 30)
  }

  function resetNet() {
    if (netBusy) return
    setNetModel(null)
    setNetEval(null)
    try { localStorage.removeItem(NET_KEY) } catch { /* storage unavailable */ }
  }

  function evaluateModel() {
    if (evaluationBusy || trainingBusy) return
    setEvaluationBusy(true)
    setNotice('')
    window.setTimeout(() => {
      try {
        setEvaluation(evaluateDuelPolicy(weights, 300, 918273))
        setBaselineEvaluation(evaluateDuelPolicy(BASELINE_WEIGHTS, 300, 918273))
      } catch (error) {
        setNotice(error instanceof Error ? error.message : 'Die Winrate-Auswertung ist fehlgeschlagen.')
      } finally {
        setEvaluationBusy(false)
      }
    }, 30)
  }

  const focused = useMemo(() => {
    if (!game || !focusedCard) return null
    const side = focusedCard.side === 'player' ? game.player : game.jarvis
    if (focusedCard.zone === 'hand') return side.hand.find((card) => card.id === focusedCard.id) ?? null
    if (focusedCard.zone === 'monsters') return side.monsters.find((card) => card.id === focusedCard.id) ?? null
    if (focusedCard.zone === 'spells') return side.spells.find((card) => card.id === focusedCard.id) ?? null
    if (focusedCard.zone === 'graveyard') return side.graveyard.find((card) => card.id === focusedCard.id) ?? null
    if (focusedCard.zone === 'extra') return side.extraDeck.find((card) => card.id === focusedCard.id) ?? null
    if (focusedCard.zone === 'field') return side.fieldSpell && side.fieldSpell.id === focusedCard.id ? side.fieldSpell : null
    return null
  }, [game, focusedCard])

  useEffect(() => {
    if (!focused || !focused.catalogId || cardTextCache[focused.catalogId]) return
    const controller = new AbortController()
    setCardTextBusy(true)
    void fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${focused.catalogId}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const payload = await response.json() as { data?: Array<{ desc?: string }> }
        const text = payload.data?.[0]?.desc
        if (typeof text !== 'string') return
        setCardTextCache((current) => ({ ...current, [focused.catalogId as number]: text }))
      })
      .catch(() => {
        if (focused.catalogId) {
          setCardTextCache((current) => ({ ...current, [focused.catalogId as number]: 'Kartentext konnte nicht geladen werden.' }))
        }
      })
      .finally(() => setCardTextBusy(false))
    return () => controller.abort()
  }, [focused, cardTextCache])

  const playerReactiveTrap = useMemo(() => {
    if (!game || game.turnOwner !== 'jarvis') return false
    return game.player.spells.some((card) => card.kind === 'trap' && canActivateCard(game, 'player', card.id))
  }, [game])

  useEffect(() => {
    if (!game || game.winner || game.turnOwner !== 'jarvis' || game.chain.length || jarvisPaused) return
    const delay = game.pendingAttack ? 2200 : 1500
    setJarvisThinking(true)
    const timeout = window.setTimeout(() => {
      setJarvisThinking(false)
      setGame((current) => {
        if (!current || current.winner || current.turnOwner !== 'jarvis' || current.chain.length || jarvisPaused) return current
        return jarvisStep(current, jarvisBrain === 'net' ? netModel : null)
      })
    }, delay)
    return () => {
      window.clearTimeout(timeout)
      setJarvisThinking(false)
    }
  }, [game, jarvisBrain, netModel, jarvisPaused])

  useEffect(() => {
    if (!game || game.turnOwner !== 'jarvis') setJarvisPaused(false)
  }, [game])

  function zoneCards(side: DuelSide, zone: 'monsters' | 'spells' | 'hand' | 'graveyard' | 'extra'): DuelCard[] {
    if (!game) return []
    const owner = side === 'player' ? game.player : game.jarvis
    return zone === 'extra' ? owner.extraDeck : owner[zone]
  }

  function chooseAttacker(card: DuelCard) {
    if (!game) return
    try {
      setGame(selectAttacker(game, card.id))
      setNotice('')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Das Monster kann nicht angreifen.')
    }
  }

  const phaseLabel = game?.phase === 'draw' ? 'Draw'
    : game?.phase === 'standby' ? 'Standby'
      : game?.phase === 'main1' ? 'Main 1'
        : game?.phase === 'battle' ? 'Battle'
          : game?.phase === 'main2' ? 'Main 2'
            : 'End'

  function summonFromHand(card: DuelCard, mode: 'attack' | 'set') {
    if (!game) return
    const required = (card.level || 4) >= 7 ? 2 : (card.level || 4) >= 5 ? 1 : 0
    const tributes = [...game.player.monsters]
      .sort((a, b) => (a.atk || 0) - (b.atk || 0))
      .slice(0, required)
      .map((item) => item.id)
    if (tributes.length < required) {
      setNotice(`Für ${card.name} fehlen Tribute (${tributes.length}/${required}).`)
      return
    }
    updateGame((current) => summonMonster(current, card.id, tributes, mode))
  }

  function activateIfPossible(side: DuelSide, card: DuelCard) {
    if (!game) return
    const problem = checkActivation(game, side, card.id)
    if (problem) {
      setNotice(problem)
      return
    }
    activateEffect(side, card.id)
  }

  function summonableExtra(card: DuelCard) {
    if (!game) return false
    return Boolean(findMaterialsForExtra(card, game.player.monsters))
  }

  return (
    <main className="ygo-overlay" data-last-action={game?.lastAnimation?.kind || ''} role="dialog" aria-modal="true" aria-labelledby="ygo-title">
      <header className="ygo-header">
        <div>
          <p className="ygo-eyebrow">ULTRON · DUEL PROTOCOL</p>
          <h1 id="ygo-title">Yu-Gi-Oh! Duel</h1>
        </div>
        <button className="ygo-close" type="button" onClick={onClose}>Duell schließen</button>
      </header>

      {coin ? (
        <div className="ygo-coin-stage" role="status" aria-live="polite" onClick={skipCoin}>
          <p className="ygo-coin-title">Münzwurf</p>
          <div className={`ygo-coin ${coin.result === 'player' ? 'lands-player' : 'lands-jarvis'}`} aria-hidden>
            <div className="ygo-coin-face ygo-coin-front"><span>DU</span></div>
            <div className="ygo-coin-face ygo-coin-back"><span>ULTRON</span></div>
          </div>
          <p className={`ygo-coin-result${coin.settled ? ' is-shown' : ''}`}>
            {coin.settled ? (coin.result === 'player' ? 'Du beginnst das Duell!' : 'Ultron beginnt das Duell!') : 'Die Münze fliegt …'}
          </p>
          <button className="ygo-coin-skip" type="button" onClick={(event) => { event.stopPropagation(); skipCoin() }}>Überspringen</button>
        </div>
      ) : game ? (
        <section className="ygo-game">
          {game.turnOwner === 'jarvis' && !game.winner ? (
            <div className={`ygo-ultron-bubble${jarvisThinking ? ' is-thinking' : ''}`} role="status" aria-live="polite">
              <span className="ygo-ultron-dots" aria-hidden><i /><i /><i /></span>
              <span className="ygo-ultron-text"><strong>Ultron</strong> {jarvisPaused ? 'pausiert – du kannst reagieren' : jarvisThinking ? 'denkt nach …' : game.message}</span>
            </div>
          ) : null}
          <div className="ygo-duel-status">
            <span>Zug {game.turn}</span>
            <strong>{phaseLabel}</strong>
            <span>{game.turnOwner === 'jarvis' ? 'Jarvis ist dran' : 'Du bist dran'}</span>
          </div>
          <div className="ygo-mat">
            <section className="ygo-side is-jarvis">
              <div className="ygo-player-line"><strong>JARVIS</strong><span>{game.jarvis.lp.toLocaleString('de-DE')} LP</span></div>
              <div className="ygo-lpbar is-jarvis"><i style={{ width: `${Math.max(0, Math.min(100, game.jarvis.lp / 80))}%` }} /></div>
              <div className="ygo-row ygo-row-meta">
                <button type="button" className="ygo-zone-pill" onClick={() => setNotice('Jarvis Extra Deck ist verdeckt.')}>Extra {game.jarvis.extraDeck.length}</button>
                <button type="button" className="ygo-zone-pill" onClick={() => setNotice('Jarvis Deck ist verdeckt.')}>Deck {game.jarvis.deck.length}</button>
                <button type="button" className="ygo-zone-pill" onClick={() => setShowJarvisGrave(true)}>Friedhof {game.jarvis.graveyard.length}</button>
              </div>
              <div className="ygo-row ygo-row-spells">
                <button type="button" className="ygo-zone-pill" onClick={() => game.jarvis.fieldSpell && openCard('jarvis', 'field', game.jarvis.fieldSpell.id)}>Feld {game.jarvis.fieldSpell ? '1' : '0'}</button>
                {Array.from({ length: 5 }, (_, index) => game.jarvis.spells[index] ?? null).map((card, index) => (
                  <button
                    type="button"
                    className={`ygo-battle-card${card?.faceDown ? ' is-facedown' : ''}${card && canActivateCard(game, 'jarvis', card.id) ? ' is-glow' : ''}`}
                    key={`jarvis-spell-${index}`}
                    onClick={() => card && !card.faceDown && openCard('jarvis', 'spells', card.id)}
                    disabled={!card || card.faceDown}
                  >
                    {card ? <span>{card.faceDown ? 'SET' : card.name}</span> : <span className="ygo-empty-slot" />}
                  </button>
                ))}
              </div>
              <div className="ygo-row ygo-row-monsters">
                {Array.from({ length: 5 }, (_, index) => game.jarvis.monsters[index] ?? null).map((card, index) => (
                  <button
                    data-card-id={card?.id}
                    type="button"
                    className={`ygo-battle-card${card?.position === 'defense' ? ' is-defense' : ''}${card?.faceDown ? ' is-facedown' : ''}`}
                    key={`jarvis-monster-${index}`}
                    onClick={() => {
                      if (!card) return
                      if (game.selectedAttacker !== null) updateGame((current) => attack(current, card.id))
                      else if (!card.faceDown) openCard('jarvis', 'monsters', card.id)
                    }}
                    disabled={!card}
                  >
                    {card ? <span>{card.faceDown ? 'Verdeckt' : `${card.name} ${card.atk ?? 0}/${card.def ?? 0}`}</span> : <span className="ygo-empty-slot" />}
                  </button>
                ))}
              </div>
            </section>
            <section className="ygo-side is-player">
              <div className="ygo-row ygo-row-monsters">
                {Array.from({ length: 5 }, (_, index) => game.player.monsters[index] ?? null).map((card, index) => (
                  <button
                    data-card-id={card?.id}
                    type="button"
                    className={`ygo-battle-card${card?.position === 'defense' ? ' is-defense' : ''}${game.selectedAttacker === card?.id ? ' is-selected' : ''}${card && canActivateCard(game, 'player', card.id) ? ' is-glow' : ''}`}
                    key={`player-monster-${index}`}
                    onClick={() => card && (game.phase === 'battle' ? chooseAttacker(card) : openCard('player', 'monsters', card.id))}
                    disabled={!card}
                  >
                    {card ? <span>{card.faceDown ? 'Verdeckt' : `${card.name} ${card.atk ?? 0}/${card.def ?? 0}`}</span> : <span className="ygo-empty-slot" />}
                  </button>
                ))}
              </div>
              <div className="ygo-row ygo-row-spells">
                <button type="button" className="ygo-zone-pill" onClick={() => game.player.fieldSpell && openCard('player', 'field', game.player.fieldSpell.id)}>Feld {game.player.fieldSpell ? '1' : '0'}</button>
                {Array.from({ length: 5 }, (_, index) => game.player.spells[index] ?? null).map((card, index) => (
                  <button
                    type="button"
                    className={`ygo-battle-card${card?.faceDown ? ' is-facedown' : ''}${card && canActivateCard(game, 'player', card.id) ? ' is-glow' : ''}`}
                    key={`player-spell-${index}`}
                    onClick={() => card && openCard('player', 'spells', card.id)}
                    disabled={!card}
                  >
                    {card ? <span>{card.faceDown ? 'SET' : card.name}</span> : <span className="ygo-empty-slot" />}
                  </button>
                ))}
                <button type="button" className="ygo-zone-pill" onClick={() => setShowPlayerGrave(true)}>Friedhof {game.player.graveyard.length}</button>
              </div>
              <div className="ygo-row ygo-row-meta">
                <button type="button" className="ygo-zone-pill" onClick={() => setShowPlayerExtra(true)}>Extra {game.player.extraDeck.length}</button>
                <button type="button" className="ygo-zone-pill">Deck {game.player.deck.length}</button>
                <div className="ygo-player-line"><strong>SPIELER</strong><span>{game.player.lp.toLocaleString('de-DE')} LP</span></div>
              </div>
              <div className="ygo-lpbar is-player"><i style={{ width: `${Math.max(0, Math.min(100, game.player.lp / 80))}%` }} /></div>
            </section>
          </div>
          <div className="ygo-hand" aria-label="Deine Handkarten">
            {zoneCards('player', 'hand').map((card) => (
              <button type="button" key={`hand-${card.id}`} className={`ygo-battle-card ygo-hand-card${canActivateCard(game, 'player', card.id) ? ' is-glow' : ''}`} onClick={() => openCard('player', 'hand', card.id)}>
                <span>{card.name}</span>
              </button>
            ))}
          </div>
          <p className="ygo-message" role="status">{game.message}</p>
          {game.chain.length ? (
            <section className="ygo-chain" aria-label="Effektkette">
              <strong>Effektkette · Auflösung zuletzt zuerst</strong>
              {game.chain.map((link) => (
                <div className={link.negated ? 'ygo-chain-negated' : ''} key={`chain-${link.id}`}>
                  <span>CL{link.id} · {link.controller === 'player' ? 'Du' : 'Jarvis'} · {link.card.name}</span>
                  <small>{link.card.effectSummary || link.effect.kind}</small>
                </div>
              ))}
              {game.chainPriority === 'player' ? (
                <button type="button" onClick={() => updateGame((current) => passDuelChain(current, 'player'))}>Passen / Kette auflösen</button>
              ) : <p>Jarvis reagiert …</p>}
            </section>
          ) : null}
          {game.phase === 'battle' && game.selectedAttacker !== null && !game.jarvis.monsters.length ? (
            <button className="ygo-primary" type="button" onClick={() => updateGame((current) => attack(current))}>Direktangriff</button>
          ) : null}
          {game.winner ? (
            <button className="ygo-primary" type="button" onClick={() => setGame(null)}>Neues Duell vorbereiten</button>
          ) : (
            <button className="ygo-next-phase" type="button" onClick={advancePhase}>
              {game.phase === 'end' ? 'Jarvis Zug starten' : 'Nächste Phase'}
            </button>
          )}
          {game.turnOwner === 'jarvis' && (playerReactiveTrap || jarvisPaused) ? (
            <button className="ygo-stop-turn" type="button" onClick={() => setJarvisPaused((current) => !current)}>{jarvisPaused ? 'Weiter' : 'STOP'}</button>
          ) : null}
          <details className="ygo-ai-info">
            <summary>Jarvis KI · {stateVector.length} Zustandswerte · Policy Gradient</summary>
            <p>Zugschritte von Jarvis werden nacheinander mit Pausen dargestellt. Aktivierbare Karten glühen.</p>
          </details>
          {showPlayerExtra ? (
            <section className="ygo-modal" role="dialog" aria-modal="true" aria-label="Extra Deck">
              <div className="ygo-modal-card">
                <h2>Dein Extra Deck</h2>
                <div className="ygo-modal-grid">
                  {game.player.extraDeck.map((card) => (
                    <button type="button" key={`modal-extra-${card.id}`} className={`ygo-battle-card${summonableExtra(card) ? ' is-glow' : ''}${extraCardId === card.id ? ' is-selected' : ''}`} onClick={() => { setExtraCardId(card.id); setExtraMaterials([]) }}>
                      <span>{card.name}</span>
                    </button>
                  ))}
                </div>
                {extraCardId !== null ? (
                  <>
                    <div className="ygo-actions">
                      <button
                        type="button"
                        className="ygo-primary"
                        onClick={() => {
                          const card = game.player.extraDeck.find((item) => item.id === extraCardId)
                          if (!card) return
                          const auto = findMaterialsForExtra(card, game.player.monsters)
                          if (!auto) {
                            setNotice('Keine gültigen Materialien für diese Extra-Beschwörung.')
                            return
                          }
                          updateGame((current) => summonExtraMonster(current, card.id, auto.map((item) => item.id)))
                          setShowPlayerExtra(false)
                        }}
                      >Beschwören (automatisch)</button>
                    </div>
                    <div className="ygo-modal-grid">
                      {game.player.monsters.map((monster) => (
                        <button type="button" key={`material-${monster.id}`} className={`ygo-battle-card${extraMaterials.includes(monster.id) ? ' is-selected' : ''}`} onClick={() => setExtraMaterials((current) => current.includes(monster.id) ? current.filter((id) => id !== monster.id) : [...current, monster.id])}>
                          <span>{monster.name}</span>
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const card = game.player.extraDeck.find((item) => item.id === extraCardId)
                        if (!card) return
                        try {
                          const materials = extraSummonMaterials(card, game.player.monsters, extraMaterials)
                          updateGame((current) => summonExtraMonster(current, card.id, materials.map((item) => item.id)))
                          setShowPlayerExtra(false)
                        } catch (error) {
                          setNotice(error instanceof Error ? error.message : 'Material-Auswahl ungültig.')
                        }
                      }}
                    >Mit gewählten Materialien beschwören</button>
                  </>
                ) : null}
                <button type="button" onClick={() => setShowPlayerExtra(false)}>Schließen</button>
              </div>
            </section>
          ) : null}
          {(showPlayerGrave || showJarvisGrave) ? (
            <section className="ygo-modal" role="dialog" aria-modal="true" aria-label="Friedhof">
              <div className="ygo-modal-card">
                <h2>{showPlayerGrave ? 'Dein Friedhof' : 'Jarvis Friedhof'}</h2>
                <div className="ygo-modal-grid">
                  {(showPlayerGrave ? game.player.graveyard : game.jarvis.graveyard).map((card) => (
                    <button type="button" key={`grave-${card.id}`} className="ygo-battle-card" onClick={() => openCard(showPlayerGrave ? 'player' : 'jarvis', 'graveyard', card.id)}>
                      <span>{card.name}</span>
                    </button>
                  ))}
                </div>
                <button type="button" onClick={() => { setShowPlayerGrave(false); setShowJarvisGrave(false) }}>Schließen</button>
              </div>
            </section>
          ) : null}
          {focused && focusedCard ? (
            <section className="ygo-modal" role="dialog" aria-modal="true" aria-label="Kartendetails">
              <div className="ygo-modal-card">
                <h2>{focused.name}</h2>
                {focused.imageUrl ? <img className="ygo-detail-image" src={focused.imageUrl.replace('/cards_small/', '/cards/')} alt={focused.name} /> : null}
                <p>{focused.type} {focused.level ? `· Stufe ${focused.level}` : ''}{focused.extraKind ? ` · ${focused.extraKind}` : ''}</p>
                {focused.kind === 'monster' ? <p>ATK {focused.atk ?? 0} / DEF {focused.def ?? 0}</p> : null}
                <p>{(focused.catalogId && cardTextCache[focused.catalogId]) || focused.effectSummary || (cardTextBusy ? 'Kartentext wird geladen …' : 'Kein Text verfügbar.')}</p>
                <div className="ygo-actions">
                  {focusedCard.side === 'player' && focusedCard.zone === 'hand' && focused.kind === 'monster' ? (
                    <>
                      <button className="ygo-primary" type="button" onClick={() => summonFromHand(focused, 'attack')}>Normal beschwören</button>
                      <button type="button" onClick={() => summonFromHand(focused, 'set')}>Verdeckt setzen</button>
                    </>
                  ) : null}
                  {focusedCard.side === 'player' && focusedCard.zone === 'hand' && (focused.kind === 'spell' || focused.kind === 'trap') ? (
                    <button className="ygo-primary" type="button" onClick={() => updateGame((current) => setSpellTrap(current, focused.id))}>Setzen</button>
                  ) : null}
                  {focusedCard.side === 'player' && focusedCard.zone === 'monsters' && game.phase === 'battle' && focused.position !== 'defense' ? (
                    <button type="button" onClick={() => chooseAttacker(focused)}>Als Angreifer wählen</button>
                  ) : null}
                  {focusedCard.side === 'player' && focusedCard.zone === 'monsters' ? (
                    <button type="button" onClick={() => updateGame((current) => changePosition(current, focused.id))}>Position wechseln</button>
                  ) : null}
                  {focusedCard.side === 'player' && focused.effect ? (
                    <button type="button" onClick={() => activateIfPossible(focusedCard.side, focused)}>Effekt aktivieren</button>
                  ) : null}
                  <button type="button" onClick={() => setFocusedCard(null)}>Schließen</button>
                </div>
              </div>
            </section>
          ) : null}
        </section>
      ) : (
        <section className="ygo-builder">
          <div className="ygo-builder-summary">
            <div><strong>{mainDeck.length}</strong><span>Main Deck · Ziel 40–60</span></div>
            <div><strong>{extraDeck.length}/15</strong><span>Extra Deck</span></div>
            <button className="ygo-primary" type="button" disabled={startBusy || mainDeck.length < 40 || mainDeck.length > 60} onClick={startDuel}>
              {startBusy ? 'Startet …' : 'Duell starten'}
            </button>
          </div>
          <section className="ygo-demo">
            <strong>Echte Decks – ein Tippen und spielen</strong>
            <div className="ygo-demo-grid">
              <select aria-label="Echtes Deck" value={demoDeckId} onChange={(event) => setDemoDeckId(event.target.value)}>
                {REAL_DECK_LIST.map((deck) => (
                  <option value={deck.id} key={deck.id}>{deck.title}</option>
                ))}
              </select>
              <button type="button" onClick={() => loadDemoDeck(demoDeckId)}>Deck laden</button>
            </div>
            <div className="ygo-demo-options">
              <label>Jarvis-Deck
                <select value={jarvisDeck} onChange={(event) => setJarvisDeck(event.target.value)}>
                  <option value="random">Zufällig (Ultron-Pool, 25 echte Decks)</option>
                  <option value="pool">Aus meinem Deck</option>
                  {REAL_DECK_LIST.map((deck) => (
                    <option value={`real:${deck.id}`} key={deck.id}>{deck.title}</option>
                  ))}
                </select>
              </label>
              <label>Jarvis-Gehirn
                <select value={jarvisBrain} onChange={(event) => setJarvisBrain(event.target.value as 'net' | 'script')}>
                  <option value="net">Neuronales Netz</option>
                  <option value="script">Skript-KI (alt)</option>
                </select>
              </label>
            </div>
          </section>
          <section className="ygo-training-lab">
            <div>
              <strong>RL-Trainingslabor</strong>
              <span>500 Episoden Policy-Gradient · synthetische Baseline-Duelle</span>
            </div>
            <div className="ygo-actions">
              <button className="ygo-primary" type="button" disabled={trainingBusy || evaluationBusy} onClick={trainModel}>
                {trainingBusy ? 'Trainiert …' : 'Policy trainieren'}
              </button>
              <button type="button" disabled={evaluationBusy || trainingBusy} onClick={evaluateModel}>
                {evaluationBusy ? 'Misst …' : '300 Holdout-Duelle'}
              </button>
            </div>
            {trainingResult ? (
              <p>Letzter Lauf: {trainingResult.episodes} Spiele · Trainings-Winrate {(trainingResult.winRate * 100).toFixed(1)}% · {trainingResult.updates} Gradient-Updates</p>
            ) : null}
            {evaluation ? (
              <p>Gleicher Holdout: Policy {evaluation.wins}/{evaluation.games} Siege, Winrate {(evaluation.winRate * 100).toFixed(1)}%{baselineEvaluation ? ` · Soup-Baseline ${(baselineEvaluation.winRate * 100).toFixed(1)}%` : ''}</p>
            ) : null}
            <small>Holdout ist identisch ausgesät; eine schlechtere Policy ersetzt nie das lokal gespeicherte Modell. Keine Turnier-Winrate.</small>
          </section>
          <section className="ygo-net-lab">
            <div>
              <strong>Neuronales Netz</strong>
              <span>28 Merkmale · 16 Neuronen · wechselnde Gegnerdecks (inkl. unbekanntem burn-Deck beim Test)</span>
            </div>
            <YugiohNetViz model={netModel} training={netBusy} />
            {netBusy ? <div className="ygo-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(netProgress * 100)}><i style={{ width: `${netProgress * 100}%` }} /></div> : null}
            <div className="ygo-actions">
              <button className="ygo-primary" type="button" disabled={netBusy || trainingBusy || evaluationBusy} onClick={trainNet}>
                {netBusy ? 'Netz lernt …' : netModel ? 'Weitertrainieren (+1500 Episoden)' : 'Netz trainieren'}
              </button>
              <button type="button" disabled={netBusy || !netModel} onClick={resetNet}>Zurücksetzen</button>
            </div>
            {netEval ? (
              <div className="ygo-net-eval">
                {([['Netz', netEval.net], ['Heuristik', netEval.heuristic], ['Zufall', netEval.random]] as const).map(([name, result]) => (
                  <div key={name}>
                    <span>{name}</span>
                    <strong>{(result.winRate * 100).toFixed(1)}%</strong>
                    <small>{result.wins}/{result.games}</small>
                  </div>
                ))}
              </div>
            ) : null}
            <small>Simulierte Duelle mit vereinfachten Regeln, nicht Turnierstärke. Das Netz ist sichtbar, trainierbar und steuert Jarvis im Duell Schritt für Schritt.</small>
          </section>
          <p className="ygo-disclaimer">Jarvis baut ein 40-Karten-Deck aus deinem Main-Deck-Pool. Unterstützte Kartentexte können Effekte und vereinfachte Ketten auslösen. Offizielle Kosten, Timing, Ziele und Kartentext-Errata werden nicht vollständig simuliert.</p>
          <label className="ygo-search">
            <span>Karte in YGOPRODeck suchen</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Kartennamen eingeben …" />
          </label>
          {searchBusy ? <p className="ygo-muted">Kartendaten werden geladen …</p> : null}
          {searchError ? <p className="ygo-error" role="alert">{searchError}</p> : null}
          <div className="ygo-results">
            {results.map((card) => {
              const copies = counts([...mainDeck, ...extraDeck], card)
              return (
                <CardTile
                  card={card}
                  key={card.catalogId}
                  disabled={copies >= (card.copyLimit ?? 3)}
                  onClick={() => addCard(card)}
                />
              )
            })}
          </div>
          <div className="ygo-deck-lists">
            <section>
              <h2>Main Deck <span>{mainDeck.length}/60</span></h2>
              {mainDeck.map((card) => (
                <button className="ygo-deck-entry" type="button" onClick={() => removeCard(card, false)} key={`main-${card.id}`}>
                  <span>{card.name}</span><small>{card.kind} · entfernen</small>
                </button>
              ))}
            </section>
            <section>
              <h2>Extra Deck <span>{extraDeck.length}/15</span></h2>
              {extraDeck.map((card) => (
                <button className="ygo-deck-entry" type="button" onClick={() => removeCard(card, true)} key={`extra-${card.id}`}>
                  <span>{card.name}</span><small>{card.type} · entfernen</small>
                </button>
              ))}
            </section>
          </div>
          {notice ? <p className="ygo-message" role="status">{notice}</p> : null}
          {!deckLoaded ? <p className="ygo-muted">Deck wird geladen …</p> : null}
        </section>
      )}
      {notice && game ? <p className="ygo-notice" role="status">{notice}</p> : null}
    </main>
  )
}
