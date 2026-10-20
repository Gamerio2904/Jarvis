import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  activateDuelEffect,
  advanceDuelPhase,
  attack,
  banlistTone,
  canActivateCard,
  cardBattleStats,
  cardStatuses,
  changePosition,
  checkActivation,
  chooseChainTarget,
  coinFlip,
  confirmPrompt,
  confirmTriggerOrder,
  createDuel,
  declinePrompt,
  declareDuelPhase,
  discardForHandLimit,
  DUEL_SOUP_WEIGHTS,
  duelStateVector,
  effectFromDescription,
  filterDeckPool,
  findMaterialsForExtra,
  giveFirstTurn,
  hasRule,
  isFirstTurnBattleBlocked,
  legalExtraSummonZones,
  legalMainSummonZones,
  materialClauseFromText,
  parsePromptMode,
  passDuelChain,
  pendulumSummon,
  placePendulumScale,
  PROMPT_MODE_KEY,
  relatedFromCatalog,
  resolveDeclaredAttack,
  ritualSummon,
  selectAttacker,
  setSpellTrap,
  startJarvisTurn,
  summonExtraMonster,
  summonMonster,
  extraSummonMaterials,
  type DuelCard,
  type DuelPlayer,
  type DuelSide,
  type DuelState,
  type PromptMode,
  type StrategyWeights,
} from '../engine/yugioh-duel.ts'
import { REAL_DECK_LIST, buildRealDeck, findRealDeck, pickUltronDeck } from '../engine/yugioh-deck-library.ts'
import { arrowsFromMarkers } from '../engine/yugioh-zones.ts'
import { evaluateDuelPolicy, trainDuelPolicy, type EvaluationResult } from '../engine/yugioh-training.ts'
import {
  createNetModel,
  evaluatePolicy,
  greedyNetPolicy,
  heuristicPolicy,
  jarvisStep,
  mirrorBotStep,
  FEATURE_COUNT,
  randomPolicy,
  trainNetPolicy,
  validateNetModel,
  type NetEvaluation,
  type NetModel,
} from '../engine/yugioh-net.ts'
import { YugiohNetViz } from './YugiohNetViz.tsx'
import { YugiohSelfPlayDev } from './YugiohSelfPlayDev.tsx'
import './yugioh-duel.css'

const APP_VERSION = '18.66.9'

function settleOwnActivation(state: DuelState): DuelState {
  if (state.pendingPrompt || state.pendingTarget || state.pendingTriggerOrder) return state
  if (
    !state.chain.length
    || state.chainPriority !== 'player'
    || state.chainPasses !== 1
    || state.chain.some((link) => link.controller !== 'player')
  ) return state
  try {
    return passDuelChain(state, 'player')
  } catch {
    return state
  }
}

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
  linkmarkers?: unknown
  race?: unknown
  attribute?: unknown
  archetype?: unknown
  scale?: unknown
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
    const parsedEffect = /normal monster/i.test(card.type)
      ? null
      : effectFromDescription(description, {
        kind,
        type: card.type,
        subtype: kind !== 'monster' && typeof card.race === 'string' ? card.race : undefined,
      })
    const linkRating = typeof card.linkval === 'number' ? card.linkval : undefined
    const linkArrows = Array.isArray(card.linkmarkers)
      ? arrowsFromMarkers(card.linkmarkers.filter((marker): marker is string => typeof marker === 'string'))
      : []
    const images = Array.isArray(card.card_images) ? card.card_images : []
    const imageUrl =
      images[0] && typeof images[0] === 'object' && typeof (images[0] as { image_url?: unknown }).image_url === 'string'
        ? (images[0] as { image_url: string }).image_url
        : undefined
    const banlist = card.banlist_info && typeof card.banlist_info === 'object'
      ? (card.banlist_info as Record<string, unknown>).ban_tcg
      : undefined
    const copyLimit = banlist === 'Forbidden' ? 0 : banlist === 'Limited' ? 1 : banlist === 'Semi-Limited' ? 2 : undefined
    const clause = materialClauseFromText(description)
    const ritualSpell = description.match(/Ritual Spell Card "([^"]+)"/i)?.[1]
    return [{
      id: card.id,
      catalogId: card.id,
      copyLimit,
      name: card.name,
      type: card.type,
      kind,
      atk: typeof card.atk === 'number' ? card.atk : undefined,
      def: typeof card.def === 'number' ? card.def : undefined,
      baseAtk: typeof card.atk === 'number' ? card.atk : undefined,
      baseDef: typeof card.def === 'number' ? card.def : undefined,
      level: typeof card.level === 'number' ? card.level : undefined,
      linkRating,
      ...(kind !== 'monster' && typeof card.race === 'string' ? { subtype: card.race } : {}),
      ...(typeof card.race === 'string' ? { race: card.race } : {}),
      ...(typeof card.attribute === 'string' ? { attribute: card.attribute } : {}),
      ...(typeof card.archetype === 'string' ? { archetype: card.archetype } : {}),
      ...(typeof card.scale === 'number' ? { pendulumScale: card.scale } : {}),
      ...(clause ? { materialClause: clause } : {}),
      ...(/ritual/i.test(card.type) ? { ritual: true } : {}),
      ...(ritualSpell ? { ritualSpellName: ritualSpell } : {}),
      tuner: /\btuner\b/i.test(description),
      ...(extraKind ? { extraKind } : {}),
      ...(linkArrows.length ? { linkArrows } : {}),
      ...(parsedEffect ? {
        effect: parsedEffect.effect,
        effectSummary: parsedEffect.summary,
        effectTrigger: parsedEffect.trigger,
        ...(parsedEffect.rules?.length ? { rules: parsedEffect.rules } : {}),
      } : {}),
      imageUrl,
      extraDeck: extra,
    }]
  })
}

function counts(cards: DuelCard[], card: DuelCard): number {
  return cards.filter((item) => (item.catalogId ?? item.id) === (card.catalogId ?? card.id)).length
}

const ARROW_MARKS = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖']

function arrowText(card: DuelCard): string {
  if (!card.linkArrows?.length) return ''
  return card.linkArrows.map((arrow) => ARROW_MARKS[arrow] ?? '').join('')
}

function shortCard(card: DuelCard) {
  const arrows = arrowText(card)
  const marks = card.counters ? ` · ${card.counters} Marken` : ''
  const token = card.token ? ' · Token' : ''
  return `${card.name}${card.kind === 'monster' ? ` · ${card.atk ?? 0}/${card.def ?? 0}` : ''}${token}${marks}${arrows ? ` ${arrows}` : ''}`
}

function monsterAt(monsters: DuelCard[], kind: 'mmz' | 'emz', index: number): DuelCard | null {
  const exact = monsters.find((monster) => (monster.zoneKind === 'emz' ? 'emz' : 'mmz') === kind && monster.zoneIndex === index)
  if (exact) return exact
  if (kind !== 'mmz') return null
  if (monsters.some((monster) => monster.zoneIndex != null)) {
    const used = new Set(monsters.filter((monster) => monster.zoneKind !== 'emz' && monster.zoneIndex != null).map((monster) => monster.zoneIndex))
    let cursor = 0
    for (const monster of monsters) {
      if (monster.zoneKind === 'emz' || monster.zoneIndex != null) continue
      while (used.has(cursor)) cursor += 1
      if (cursor === index) return monster
      used.add(cursor)
      cursor += 1
    }
    return null
  }
  return monsters.filter((monster) => monster.zoneKind !== 'emz')[index] ?? null
}

function cardArt(card: DuelCard): string | undefined {
  if (card.faceDown) return undefined
  if (card.imageUrl) return card.imageUrl
  if (card.catalogId) return `https://images.ygoprodeck.com/images/cards_small/${card.catalogId}.jpg`
  return undefined
}

function statTone(current: number, base: number): string {
  if (current > base) return 'is-buff'
  if (current < base) return 'is-nerf'
  return ''
}

function PlayCard({
  card,
  owner,
  opponent,
  className = '',
  disabled = false,
  pickable = false,
  onClick,
}: {
  card: DuelCard | null
  owner?: DuelPlayer | null
  opponent?: DuelPlayer | null
  className?: string
  disabled?: boolean
  pickable?: boolean
  onClick?: () => void
}) {
  const stats = card && owner && card.kind === 'monster' && !card.faceDown ? cardBattleStats(card, owner, opponent ?? undefined) : null
  const art = card ? cardArt(card) : undefined
  const arrows = card ? arrowText(card) : ''
  return (
    <button
      type="button"
      className={`ygo-slot${card ? '' : ' is-empty'}${card?.faceDown ? ' is-facedown' : ''}${card?.position === 'defense' ? ' is-defense' : ''}${card?.zoneKind === 'emz' ? ' is-emz' : ''}${className ? ` ${className}` : ''}`}
      disabled={disabled || (!card && !pickable)}
      onClick={onClick}
      title={card ? shortCard(card) : 'Leere Zone'}
    >
      {art ? <img className="ygo-slot-art" src={art} alt="" /> : null}
      {card && !art ? <span className="ygo-slot-name">{card.faceDown ? 'SET' : card.name}</span> : null}
      {card?.token ? <em className="ygo-mark">Token</em> : null}
      {card?.counters ? <em className="ygo-mark">{card.counters}</em> : null}
      {arrows ? <em className="ygo-arrows">{arrows}</em> : null}
      {card && !card.faceDown ? cardStatuses(card).map((status) => (
        <em key={status} className={`ygo-status is-${status}`}>{status === 'negated' ? 'NEG' : status === 'untargetable' ? 'UNT' : 'IMM'}</em>
      )) : null}
      {stats ? (
        <span className="ygo-slot-stats">
          <b className={statTone(stats.atk, stats.baseAtk)}>{stats.atk}</b>
          <b className={statTone(stats.def, stats.baseDef)}>{stats.def}</b>
        </span>
      ) : null}
    </button>
  )
}

function armDuel(state: DuelState, mode: PromptMode): DuelState {
  return { ...state, promptMode: mode, battleWindow: true, log: state.log ?? [] }
}

function statusLabel(status: 'negated' | 'untargetable' | 'immune'): string {
  if (status === 'negated') return 'negated'
  if (status === 'untargetable') return 'unanvisierbar'
  return 'immun'
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
  const tone = banlistTone(card.copyLimit)
  return onClick ? (
    <button className={`ygo-card${tone ? ` is-${tone}` : ''}`} type="button" onClick={onClick} disabled={disabled} title={shortCard(card)}>
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
  const [promptMode, setPromptMode] = useState<PromptMode>(() => {
    try { return parsePromptMode(localStorage.getItem(PROMPT_MODE_KEY)) } catch { return 'auto' }
  })
  const [deckFilter, setDeckFilter] = useState({ type: '', attribute: '', level: '', race: '', archetype: '', text: '' })
  const [relatedCard, setRelatedCard] = useState<DuelCard | null>(null)
  const [zonePick, setZonePick] = useState<{ cardId: number; tributes: number[]; mode: 'attack' | 'set'; kind: 'normal' | 'extra'; materialIds: number[] } | null>(null)
  const [chainHold, setChainHold] = useState(false)
  const [searchBusy, setSearchBusy] = useState(false)
  const [game, setGame] = useState<DuelState | null>(null)
  const [spectator, setSpectator] = useState(false)
  const [spectatorPaused, setSpectatorPaused] = useState(false)
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
  const [tributeFor, setTributeFor] = useState<number | null>(null)
  const [tributeIds, setTributeIds] = useState<number[]>([])
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
  const [uiMode, setUiMode] = useState<'game' | 'dev'>('game')

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        const leave = window.confirm('Duell schließen?')
        if (leave) onClose()
      }
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
      if (storedNet) {
        try {
          setNetModel(validateNetModel(JSON.parse(storedNet) as NetModel))
        } catch {
          localStorage.removeItem(NET_KEY)
        }
      }
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

  function startBotDuel() {
    const leftDeck = REAL_DECK_LIST[0]
    const rightDeck = REAL_DECK_LIST.find((deck) => deck.id !== leftDeck?.id) || leftDeck
    if (!leftDeck || !rightDeck) return
    try {
      const left = buildRealDeck(leftDeck, () => nextCardId.current++)
      const right = buildRealDeck(rightDeck, () => nextCardId.current++)
      const opened = giveFirstTurn(
        armDuel(createDuel(left.main, right.main, Math.random, left.extra, right.extra, weights), promptMode),
        coinFlip(),
      )
      setCoin(null)
      setGame(opened)
      setSpectator(true)
      setSpectatorPaused(false)
      setFocusedCard(null)
      setJarvisPaused(false)
      setNotice(`Bot-Duell: ${leftDeck.title} gegen ${rightDeck.title}.`)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Das Bot-Duell konnte nicht starten.')
    }
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
        setCoin({ result: coinFlip(), duel: armDuel(createDuel(mainDeck, botMain, Math.random, extraDeck, botExtra, weights), promptMode), settled: false })
        setFocusedCard(null)
        setShowPlayerGrave(false)
        setShowJarvisGrave(false)
        setShowPlayerExtra(false)
        setExtraCardId(null)
        setExtraMaterials([])
        setJarvisPaused(false)
        setSpectator(false)
        setSpectatorPaused(false)
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
      const next = settleOwnActivation(action(game))
      setGame(next)
      setNotice('')
      setTributeFor(null)
      setTributeIds([])
      setExtraCardId(null)
      setExtraMaterials([])
      const previous = game.lastAnimation
      const anim = next.lastAnimation
      const fresh = Boolean(anim && (!previous || previous.id !== anim.id || previous.kind !== anim.kind || previous.side !== anim.side))
      if (!spectator && fresh && anim && anim.side === 'player' && (anim.kind === 'summon' || anim.kind === 'set' || anim.kind === 'effect' || anim.kind === 'destroy')) {
        const zone = next.player.monsters.some((card) => card.id === anim.id) ? 'monsters'
          : next.player.spells.some((card) => card.id === anim.id) ? 'spells'
            : next.player.fieldSpell?.id === anim.id ? 'field'
              : next.player.graveyard.some((card) => card.id === anim.id) ? 'graveyard'
                : null
        setFocusedCard(zone ? { side: 'player', zone, id: anim.id } : null)
      } else {
        setFocusedCard(null)
      }
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
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
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

  const attackKey = game?.pendingAttack?.side === 'jarvis'
    ? `${game.pendingAttack.attackerId}:${game.pendingAttack.targetId ?? 'direct'}`
    : ''
  const [releasedAttack, setReleasedAttack] = useState('')
  const holdAttack = Boolean(attackKey && playerReactiveTrap && releasedAttack !== attackKey)

  useEffect(() => {
    if (spectator || uiMode !== 'game' || !game || game.winner || game.turnOwner !== 'jarvis' || game.chain.length || jarvisPaused || holdAttack) return
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
  }, [game, jarvisBrain, netModel, jarvisPaused, holdAttack, uiMode, spectator])

  useEffect(() => {
    if (!spectator || spectatorPaused || !game || game.winner) return
    const reduced = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const timeout = window.setTimeout(() => {
      setGame((current) => (current && !current.winner ? mirrorBotStep(current, null) : current))
    }, reduced ? 80 : 500 + Math.floor(Math.random() * 501))
    return () => window.clearTimeout(timeout)
  }, [spectator, spectatorPaused, game])

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

  function tributesFor(card: DuelCard): number {
    if (hasRule(card, 'freeTribute')) return 0
    return (card.level || 4) >= 7 ? 2 : (card.level || 4) >= 5 ? 1 : 0
  }

  function summonFromHand(card: DuelCard, mode: 'attack' | 'set', chosen: number[] = []) {
    if (!game) return
    const required = tributesFor(card)
    const tributes = chosen.length
      ? chosen
      : [...game.player.monsters]
        .sort((a, b) => (a.atk || 0) - (b.atk || 0))
        .slice(0, required)
        .map((item) => item.id)
    if (tributes.length < required) {
      setTributeFor(card.id)
      setTributeIds([])
      setFocusedCard({ side: 'player', zone: 'hand', id: card.id })
      setNotice(`Tippe ${required} eigene Monster als Tribut für ${card.name}.`)
      return
    }
    const remaining = game.player.monsters.filter((monster) => !tributes.includes(monster.id))
    const zones = legalMainSummonZones(remaining)
    if (zones.length > 1) {
      setZonePick({ cardId: card.id, tributes, mode, kind: 'normal', materialIds: [] })
      setNotice('Tippe eine leuchtende Monsterzone.')
      return
    }
    setZonePick(null)
    updateGame((current) => summonMonster(current, card.id, tributes, mode, zones[0]?.zoneIndex))
  }

  function chooseZone(kind: 'mmz' | 'emz', index: number) {
    if (!zonePick) return
    const pick = zonePick
    setZonePick(null)
    if (pick.kind === 'normal') {
      updateGame((current) => summonMonster(current, pick.cardId, pick.tributes, pick.mode, index))
      return
    }
    updateGame((current) => summonExtraMonster(current, pick.cardId, pick.materialIds, { zoneKind: kind, zoneIndex: index }))
  }

  function zoneChoice(kind: 'mmz' | 'emz', index: number): boolean {
    if (!zonePick || !game) return false
    const monsters = game.player.monsters.filter((monster) => !zonePick.tributes.includes(monster.id))
    const zones = zonePick.kind === 'normal'
      ? legalMainSummonZones(monsters)
      : legalExtraSummonZones(monsters, zonePick.materialIds)
    return zones.some((slot) => slot.zoneKind === kind && slot.zoneIndex === index)
  }

  function markedTarget(card: DuelCard | null): string {
    if (!card || !game?.pendingTarget?.candidates.includes(card.id)) return ''
    const own = game.player.monsters.some((monster) => monster.id === card.id)
      || game.player.spells.some((spell) => spell.id === card.id)
      || game.player.graveyard.some((item) => item.id === card.id)
      || game.player.deck.some((item) => item.id === card.id)
      || game.player.banished.some((item) => item.id === card.id)
    return own ? ' is-target-own' : ' is-target-foe'
  }

  function passChain() {
    if (!game || chainHold || game.pendingPrompt || game.pendingTarget) return
    const reduced = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || game.chain.length < 2) {
      updateGame((current) => passDuelChain(current, 'player'))
      return
    }
    setChainHold(true)
    window.setTimeout(() => {
      setChainHold(false)
      updateGame((current) => passDuelChain(current, 'player'))
    }, 420)
  }

  function storePromptMode(mode: PromptMode) {
    setPromptMode(mode)
    try { localStorage.setItem(PROMPT_MODE_KEY, mode) } catch { /* Speicher nicht verfügbar */ }
    if (game) setGame({ ...game, promptMode: mode })
  }

  function playHandCard(card: DuelCard) {
    if (!game || spectator || game.winner || game.turnOwner !== 'player') {
      openCard('player', 'hand', card.id)
      return
    }
    if ((game.discardNeeded || 0) > 0) {
      updateGame((current) => discardForHandLimit(current, card.id))
      return
    }
    if (!['main1', 'main2'].includes(game.phase)) {
      setNotice('Beschwören und Zauber gehen in der Main Phase. Tippe auf Nächste Phase.')
      openCard('player', 'hand', card.id)
      return
    }
    if (card.kind === 'monster') {
      if (hasRule(card, 'cannotNormal') && card.effect?.kind === 'summonHand') {
        activateIfPossible('player', card)
        return
      }
      summonFromHand(card, 'attack')
      return
    }
    if (card.kind === 'spell' && card.effect && checkActivation(game, 'player', card.id) === null) {
      activateIfPossible('player', card)
      return
    }
    updateGame((current) => setSpellTrap(current, card.id))
  }

  function offerTribute(card: DuelCard) {
    if (!game || tributeFor === null) return
    const next = tributeIds.includes(card.id) ? tributeIds.filter((id) => id !== card.id) : [...tributeIds, card.id]
    const summon = game.player.hand.find((item) => item.id === tributeFor)
    if (!summon) {
      setTributeFor(null)
      setTributeIds([])
      return
    }
    if (next.length >= tributesFor(summon)) {
      summonFromHand(summon, 'attack', next)
      return
    }
    setTributeIds(next)
    setNotice(`Tribut ${next.length}/${tributesFor(summon)} für ${summon.name}.`)
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

  function popClass(card: DuelCard | null): string {
    if (!card || !game?.lastAnimation) return ''
    if (game.lastAnimation.destroyed?.includes(card.id)) return ' is-hit'
    if (game.lastAnimation.id === card.id) return ' is-arriving'
    return ''
  }

  const board = (
    <main className={`ygo-overlay${spectator ? ' is-spectator' : ''}`} data-last-action={game?.lastAnimation?.kind || ''} role="dialog" aria-modal="true" aria-labelledby="ygo-title">
      <header className="ygo-header">
        <div>
          <p className="ygo-eyebrow">ULTRON · DUEL PROTOCOL</p>
          <h1 id="ygo-title">Yu-Gi-Oh! Duel</h1>
        </div>
        <div className="ygo-header-actions">
          <button
            className="ygo-mode-toggle"
            type="button"
            aria-pressed={uiMode === 'dev'}
            onClick={() => setUiMode((m) => (m === 'game' ? 'dev' : 'game'))}
          >
            {uiMode === 'game' ? 'Dev ⇄ Spiel' : 'Spiel ⇄ Dev'}
          </button>
          <button className="ygo-close" type="button" onClick={onClose}>Duell schließen</button>
        </div>
      </header>

      {uiMode === 'dev' ? (
        <YugiohSelfPlayDev
          appVersion={APP_VERSION}
          netModel={netModel}
          setNetModel={setNetModel}
          playerGame={game}
          pausedJarvis={jarvisPaused}
          setPausedJarvis={setJarvisPaused}
        />
      ) : coin ? (
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
            <span>{spectator ? (game.turnOwner === 'jarvis' ? 'Ultron ist dran' : 'Gegner-Bot ist dran') : (game.turnOwner === 'jarvis' ? 'Jarvis ist dran' : 'Du bist dran')}</span>
            <label className="ygo-prompt-mode">Aktivieren
              <select aria-label="Aktivieren-Fenster" value={game.promptMode || promptMode} onChange={(event) => storePromptMode(event.target.value as PromptMode)}>
                <option value="off">OFF</option>
                <option value="auto">AUTO</option>
                <option value="on">ON</option>
              </select>
            </label>
          </div>
          {game.log?.length ? (
            <ol className="ygo-duel-log" aria-label="Duellprotokoll">
              {game.log.slice(-8).map((line, index) => <li key={`log-${index}`}>{line}</li>)}
            </ol>
          ) : null}
          <div className={`ygo-mat${game.lastAnimation?.kind === 'effect' ? ' is-casting' : ''}${game.lastAnimation?.kind === 'summon' ? ' is-summoning' : ''}`}>
            <div className="ygo-lp is-jarvis">
              <strong>ULTRON</strong>
              <span>{game.jarvis.lp.toLocaleString('de-DE')} LP</span>
              <i style={{ width: `${Math.max(0, Math.min(100, game.jarvis.lp / 80))}%` }} />
            </div>
            <div className="ygo-field">
              <div className="ygo-piles">
                <button type="button" className="ygo-pile" onClick={() => setNotice('Ultrons Extra Deck bleibt verdeckt.')}>Extra<br />{game.jarvis.extraDeck.length}</button>
                <button type="button" className="ygo-pile is-deck" onClick={() => setNotice('Ultrons Deck bleibt verdeckt.')}>Deck<br />{game.jarvis.deck.length}</button>
                <PlayCard card={game.jarvis.fieldSpell ?? null} className="ygo-field-slot" onClick={() => game.jarvis.fieldSpell && openCard('jarvis', 'field', game.jarvis.fieldSpell.id)} />
                <button type="button" className={`ygo-pile${game.lastAnimation && game.jarvis.graveyard.at(-1)?.id === game.lastAnimation.id ? ' is-arriving' : ''}`} aria-label={`Friedhof Ultron, ${game.jarvis.graveyard.length}`} onClick={() => setShowJarvisGrave(true)}>
                  {game.jarvis.graveyard.at(-1) && cardArt(game.jarvis.graveyard.at(-1) as DuelCard) ? <img src={cardArt(game.jarvis.graveyard.at(-1) as DuelCard)} alt="" /> : <span className="ygo-pile-name">Friedhof</span>}
                  <em>{game.jarvis.graveyard.length}</em>
                </button>
              </div>
              <div className="ygo-zones">
                <div className="ygo-zones-row">
                  {Array.from({ length: 5 }, (_, index) => game.jarvis.spells[index] ?? null).map((card, index) => (
                    <PlayCard
                      key={`jarvis-spell-${index}`}
                      card={card}
                      className={`${card && canActivateCard(game, 'jarvis', card.id) ? ' is-glow' : ''}${popClass(card)}`}
                      onClick={() => card && !card.faceDown && openCard('jarvis', 'spells', card.id)}
                    />
                  ))}
                </div>
                <div className="ygo-zones-row">
                  {Array.from({ length: 5 }, (_, index) => monsterAt(game.jarvis.monsters, 'mmz', index)).map((card, index) => (
                    <PlayCard
                      key={`jarvis-monster-${index}`}
                      card={card}
                      owner={game.jarvis}
                      opponent={game.player}
                      className={`${card && canActivateCard(game, 'jarvis', card.id) ? ' is-glow' : ''}${popClass(card)}${markedTarget(card)}`}
                      onClick={() => {
                        if (!card) return
                        if (game.pendingTarget?.candidates.includes(card.id)) { updateGame((current) => chooseChainTarget(current, card.id)); return }
                        if (game.selectedAttacker !== null) updateGame((current) => attack(current, card.id))
                        else if (!card.faceDown) openCard('jarvis', 'monsters', card.id)
                      }}
                    />
                  ))}
                </div>
                <div className="ygo-zones-mid" aria-label="Extra-Monsterzonen">
                  {[0, 1].map((index) => {
                    const playerCard = monsterAt(game.player.monsters, 'emz', index)
                    const jarvisCard = monsterAt(game.jarvis.monsters, 'emz', index)
                    const card = playerCard || jarvisCard
                    const own = Boolean(playerCard)
                    return (
                      <PlayCard
                        key={`emz-${index}`}
                        card={card}
                        owner={own ? game.player : game.jarvis}
                        opponent={own ? game.jarvis : game.player}
                        className={`${card && game.selectedAttacker === card.id ? ' is-selected' : ''}${card && tributeIds.includes(card.id) ? ' is-tribute' : ''}${popClass(card)}${markedTarget(card)}${own && zoneChoice('emz', index) ? ' is-zone-choice' : ''}`}
                        pickable={own && zoneChoice('emz', index)}
                        onClick={() => {
                          if (own && zoneChoice('emz', index)) { chooseZone('emz', index); return }
                          if (!card) return
                          if (own && game.pendingTarget?.candidates.includes(card.id)) { updateGame((current) => chooseChainTarget(current, card.id)); return }
                          if (own && tributeFor !== null) offerTribute(card)
                          else if (own && game.phase === 'battle') chooseAttacker(card)
                          else if (game.selectedAttacker !== null && !own) updateGame((current) => attack(current, card.id))
                          else if (!card.faceDown) openCard(own ? 'player' : 'jarvis', 'monsters', card.id)
                        }}
                      />
                    )
                  })}
                </div>
                <div className="ygo-zones-row">
                  {Array.from({ length: 5 }, (_, index) => monsterAt(game.player.monsters, 'mmz', index)).map((card, index) => (
                    <PlayCard
                      key={`player-monster-${index}`}
                      card={card}
                      owner={game.player}
                      opponent={game.jarvis}
                      className={`${game.selectedAttacker === card?.id ? ' is-selected' : ''}${card && tributeIds.includes(card.id) ? ' is-tribute' : ''}${card && canActivateCard(game, 'player', card.id) ? ' is-glow' : ''}${popClass(card)}${markedTarget(card)}${zoneChoice('mmz', index) ? ' is-zone-choice' : ''}`}
                      pickable={zoneChoice('mmz', index)}
                      onClick={() => {
                        if (zoneChoice('mmz', index)) { chooseZone('mmz', index); return }
                        if (!card) return
                        if (game.pendingTarget?.candidates.includes(card.id)) { updateGame((current) => chooseChainTarget(current, card.id)); return }
                        if (tributeFor !== null) offerTribute(card)
                        else if (game.phase === 'battle') chooseAttacker(card)
                        else openCard('player', 'monsters', card.id)
                      }}
                    />
                  ))}
                </div>
                <div className="ygo-zones-row">
                  {Array.from({ length: 5 }, (_, index) => {
                    const spell = game.player.spells[index] ?? null
                    const scaleSlot: 0 | 1 | null = index === 0 ? 0 : index === 4 ? 1 : null
                    const scale = scaleSlot === null ? null : game.player.scales?.[scaleSlot] ?? null
                    const card = scale ?? spell
                    return (
                      <div key={`player-spell-${index}`} className={`ygo-endzone${scaleSlot !== null ? ' is-scale' : ''}`}>
                        <PlayCard
                          card={card}
                          owner={scale ? game.player : undefined}
                          opponent={scale ? game.jarvis : undefined}
                          pickable={scaleSlot !== null && !card}
                          className={`${card && canActivateCard(game, 'player', card.id) ? ' is-glow' : ''}${popClass(card)}`}
                          onClick={() => {
                            if (scale) { openCard('player', 'hand', scale.id); return }
                            if (spell) {
                              if (canActivateCard(game, 'player', spell.id)) activateIfPossible('player', spell)
                              else openCard('player', 'spells', spell.id)
                              return
                            }
                            if (scaleSlot === null) return
                            const pendulum = focused?.pendulumScale != null ? focused : game.player.hand.find((item) => typeof item.pendulumScale === 'number')
                            if (!pendulum) { setNotice('Diese Karte hat keine Pendel-Skala. Es wird keine Skala erfunden.'); return }
                            updateGame((current) => placePendulumScale(current, pendulum.id, scaleSlot))
                          }}
                        />
                        {scaleSlot !== null ? (
                          <span className="ygo-scale-mark">{scaleSlot === 0 ? 'Skala L' : 'Skala R'}{typeof scale?.pendulumScale === 'number' ? ` ${scale.pendulumScale}` : ''}</span>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="ygo-piles">
                <button type="button" className={`ygo-pile${game.lastAnimation && game.player.graveyard.at(-1)?.id === game.lastAnimation.id ? ' is-arriving' : ''}`} aria-label={`Friedhof, ${game.player.graveyard.length}`} onClick={() => setShowPlayerGrave(true)}>
                  {game.player.graveyard.at(-1) && cardArt(game.player.graveyard.at(-1) as DuelCard) ? <img src={cardArt(game.player.graveyard.at(-1) as DuelCard)} alt="" /> : <span className="ygo-pile-name">Friedhof</span>}
                  <em>{game.player.graveyard.length}</em>
                </button>
                <PlayCard card={game.player.fieldSpell ?? null} className="ygo-field-slot" onClick={() => game.player.fieldSpell && openCard('player', 'field', game.player.fieldSpell.id)} />
                <button type="button" className="ygo-pile is-deck">Deck<br />{game.player.deck.length}</button>
                <button type="button" className="ygo-pile" onClick={() => setShowPlayerExtra(true)}>Extra<br />{game.player.extraDeck.length}</button>
              </div>
            </div>
            {focused && focusedCard ? (
              <div className="ygo-inspect" role="region" aria-label="Karte auf dem Feld">
                {focused.imageUrl ? <img src={focused.imageUrl} alt="" /> : <span className="ygo-inspect-fallback">{focused.kind === 'monster' ? 'MON' : 'ZAUBER'}</span>}
                <div>
                  <strong>{focused.name}</strong>
                  <p>{[focused.attribute, focused.level != null ? (focused.extraKind === 'xyz' ? `Rang ${focused.level}` : focused.extraKind === 'link' ? `Link ${focused.linkRating || focused.level}` : `Stufe ${focused.level}`) : '', arrowText(focused), focused.race, focused.type].filter(Boolean).join(' · ')}</p>
                  {cardStatuses(focused).length ? <p>{cardStatuses(focused).map(statusLabel).join(', ')}</p> : null}
                  {focused.materials?.length ? <p>Xyz-Material: {focused.materials.map((material) => material.name).join(', ')}</p> : null}
                  <p>{(focused.catalogId && cardTextCache[focused.catalogId]) || focused.effectSummary || (cardTextBusy ? 'Kartentext wird geladen …' : focused.type)}</p>
                  <div className="ygo-actions">
                    {focusedCard.side === 'player' && focusedCard.zone === 'hand' && focused.kind === 'monster' ? (
                      <>
                        <button className="ygo-primary" type="button" onClick={() => summonFromHand(focused, 'attack', tributeIds)}>Normal beschwören</button>
                        <button type="button" onClick={() => summonFromHand(focused, 'set', tributeIds)}>Verdeckt setzen</button>
                        {focused.ritual || /ritual/i.test(focused.type) ? (
                          <button type="button" onClick={() => updateGame((current) => ritualSummon(current, focused.id, null, tributeIds))}>Ritual</button>
                        ) : null}
                        {typeof focused.pendulumScale === 'number' ? (
                          <button type="button" onClick={() => updateGame((current) => pendulumSummon(current, [focused.id]))}>Pendelbeschwören</button>
                        ) : null}
                      </>
                    ) : null}
                    {focusedCard.side === 'player' && focusedCard.zone === 'hand' && (focused.kind === 'spell' || focused.kind === 'trap') ? (
                      <button className="ygo-primary" type="button" onClick={() => playHandCard(focused)}>Spielen</button>
                    ) : null}
                    {focusedCard.side === 'player' && focusedCard.zone === 'monsters' && game.phase === 'battle' && focused.position !== 'defense' ? (
                      <button type="button" onClick={() => chooseAttacker(focused)}>Angreifen</button>
                    ) : null}
                    {focusedCard.side === 'player' && focusedCard.zone === 'monsters' ? (
                      <button type="button" onClick={() => updateGame((current) => changePosition(current, focused.id))}>Position</button>
                    ) : null}
                    {focusedCard.side === 'player' && focused.effect ? (
                      <button type="button" onClick={() => activateIfPossible(focusedCard.side, focused)}>
                        {focused.faceDown ? 'Aufdecken' : 'Effekt'}
                      </button>
                    ) : null}
                    <button type="button" onClick={() => { setFocusedCard(null); setTributeFor(null); setTributeIds([]) }}>Schließen</button>
                  </div>
                </div>
              </div>
            ) : null}
            <div className="ygo-lp is-player">
              <strong>{spectator ? 'BOT' : 'DU'}</strong>
              <span>{game.player.lp.toLocaleString('de-DE')} LP</span>
              <i style={{ width: `${Math.max(0, Math.min(100, game.player.lp / 80))}%` }} />
            </div>
          </div>
          <div className="ygo-hand" aria-label="Deine Handkarten">
            {zoneCards('player', 'hand').map((card) => (
              <PlayCard
                key={`hand-${card.id}`}
                card={card}
                owner={game.player}
                className={`ygo-hand-card${canActivateCard(game, 'player', card.id) ? ' is-glow' : ''}${tributeFor === card.id ? ' is-selected' : ''}${popClass(card)}`}
                onClick={() => playHandCard(card)}
              />
            ))}
          </div>
          <p className="ygo-message" role="status">{game.message}</p>
          {game.chain.length ? (
            <section className="ygo-chain" aria-label="Effektkette">
              <strong>Effektkette · Auflösung zuletzt zuerst</strong>
              <div className="ygo-chain-stack">
                {game.chain.map((link) => (
                  <div className={`ygo-chain-card${link.negated ? ' ygo-chain-negated' : ''}${link.id === game.chain[game.chain.length - 1]?.id ? ' is-top' : ''}`} key={`chain-${link.id}`}>
                    <span>CL{link.id} · {link.controller === 'player' ? 'Du' : 'Jarvis'} · {link.card.name}</span>
                    <small>{link.card.effectSummary || link.effect.kind}</small>
                  </div>
                ))}
              </div>
              {game.pendingTarget ? <p>Wähle ein leuchtendes Ziel.</p> : game.pendingPrompt ? <p>Ja oder Nein zur Aktivierung.</p> : game.chainPriority === 'player' ? (
                <button type="button" disabled={chainHold} onClick={passChain}>{chainHold ? 'Kette löst auf …' : 'Passen / Kette auflösen'}</button>
              ) : <p>Jarvis reagiert …</p>}
            </section>
          ) : null}
          {game.pendingPrompt ? (
            <section className="ygo-prompt" role="dialog" aria-label="Aktivieren">
              <p>Kettenglied {game.pendingPrompt.chainNumber}</p>
              <strong>{[...game.player.hand, ...game.player.monsters, ...game.player.spells, ...game.jarvis.hand, ...game.jarvis.monsters, ...game.jarvis.spells].find((card) => card.id === game.pendingPrompt?.cardId)?.name}</strong>
              <div className="ygo-actions">
                <button className="ygo-primary" type="button" onClick={() => updateGame(confirmPrompt)}>Ja</button>
                <button type="button" disabled={game.pendingPrompt.mandatory} onClick={() => updateGame(declinePrompt)}>Nein</button>
              </div>
            </section>
          ) : null}
          {game.pendingTriggerOrder ? (
            <section className="ygo-prompt" role="dialog" aria-label="Auslöser-Reihenfolge">
              <p>Gleichzeitige Auslöser</p>
              <div className="ygo-actions">
                <button type="button" onClick={() => updateGame((current) => confirmTriggerOrder(current, current.pendingTriggerOrder || []))}>Reihenfolge bestätigen</button>
                <button type="button" onClick={() => updateGame((current) => confirmTriggerOrder(current, [...(current.pendingTriggerOrder || [])].reverse()))}>Umkehren</button>
              </div>
            </section>
          ) : null}
          {game.battleWindow && game.phase === 'battle' ? (
            <p className="ygo-battle-steps" aria-label="Kampfschritte">
              {(['start', 'declare', 'damage', 'end'] as const).map((step) => (
                <span key={step} className={game.battleStep === step ? 'is-current' : ''}>
                  {step === 'start' ? 'Start' : step === 'declare' ? 'Angriffsdeklaration' : step === 'damage' ? 'Schadensrechnung' : 'Ende'}
                </span>
              ))}
            </p>
          ) : null}
          {game.lastAnimation?.kind === 'attack' && game.lastAnimation.damage ? (
            <p className="ygo-lp-float" aria-label="Lebenspunkt-Differenz">
              <span className="ygo-attack-arrow" aria-hidden>→</span>
              {game.lastAnimation.damage.jarvis ? `−${game.lastAnimation.damage.jarvis}` : game.lastAnimation.damage.player ? `−${game.lastAnimation.damage.player}` : '0'}
            </p>
          ) : null}
          {game.phase === 'battle' && game.selectedAttacker !== null && (!game.jarvis.monsters.length || game.player.monsters.some((card) => card.id === game.selectedAttacker && hasRule(card, 'direct'))) ? (
            <button className="ygo-primary" type="button" onClick={() => updateGame((current) => attack(current))}>Direktangriff</button>
          ) : null}
          {game.winner ? (
            <button className="ygo-primary" type="button" onClick={() => { setGame(null); setSpectator(false) }}>Neues Duell vorbereiten</button>
          ) : (
            <>
              {game.phase === 'main1' && !isFirstTurnBattleBlocked(game) ? (
                <button className="ygo-next-phase" type="button" onClick={() => updateGame((current) => declareDuelPhase(current, 'battle'))} disabled={spectator || game.turnOwner === 'jarvis' || game.chain.length > 0}>Kampf</button>
              ) : null}
              {game.phase === 'main1' || game.phase === 'battle' || game.phase === 'main2' ? (
                <button className="ygo-next-phase" type="button" onClick={() => updateGame((current) => declareDuelPhase(current, 'end'))} disabled={spectator || game.turnOwner === 'jarvis' || game.chain.length > 0}>Ende</button>
              ) : null}
              {game.battleStep === 'damage' && game.battleWindow ? (
                <button className="ygo-primary" type="button" onClick={() => updateGame(resolveDeclaredAttack)}>Schadensrechnung</button>
              ) : null}
              <button className="ygo-next-phase" type="button" onClick={advancePhase} disabled={spectator || game.turnOwner === 'jarvis' || game.chain.length > 0}>
                {game.phase === 'end' ? 'Jarvis Zug starten' : 'Nächste Phase'}
              </button>
              {spectator ? (
                <button className="ygo-stop-turn" type="button" onClick={() => setSpectatorPaused((current) => !current)}>{spectatorPaused ? 'Bot-Duell weiter' : 'Bot-Duell pausieren'}</button>
              ) : null}
            </>
          )}
          {game.turnOwner === 'jarvis' && (playerReactiveTrap || jarvisPaused) ? (
            <button className="ygo-stop-turn" type="button" onClick={() => setJarvisPaused((current) => !current)}>{jarvisPaused ? 'Weiter' : 'STOP'}</button>
          ) : null}
          {holdAttack ? (
            <button className="ygo-stop-turn" type="button" onClick={() => setReleasedAttack(attackKey)}>Angriff zulassen</button>
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
                          const ids = materials.map((item) => item.id)
                          const zones = legalExtraSummonZones(game.player.monsters, ids)
                          if (zones.length > 1) {
                            setZonePick({ cardId: card.id, tributes: [], mode: 'attack', kind: 'extra', materialIds: ids })
                            setShowPlayerExtra(false)
                            setNotice('Tippe eine leuchtende Monsterzone.')
                            return
                          }
                          updateGame((current) => summonExtraMonster(current, card.id, ids, zones[0]))
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
        </section>
      ) : (
        <>
          <section className="ygo-builder">
          <div className="ygo-builder-summary">
            <div><strong>{mainDeck.length}</strong><span>Main Deck · Ziel 40–60</span></div>
            <div><strong>{extraDeck.length}/15</strong><span>Extra Deck</span></div>
            <button className="ygo-primary" type="button" disabled={startBusy || mainDeck.length < 40 || mainDeck.length > 60} onClick={startDuel}>
              {startBusy ? 'Startet …' : 'Duell starten'}
            </button>
            <button className="ygo-primary" type="button" onClick={startBotDuel}>Bot-Duell ansehen</button>
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
              <span>{FEATURE_COUNT} Merkmale · 16 Neuronen · wechselnde Gegnerdecks (inkl. unbekanntem burn-Deck beim Test)</span>
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
          <div className="ygo-editor">
            <div className="ygo-deck-lists">
              <section>
                <h2>Main Deck <span>{mainDeck.length}/60</span></h2>
                {mainDeck.map((card) => (
                  <button className={`ygo-deck-entry${banlistTone(card.copyLimit) ? ` is-${banlistTone(card.copyLimit)}` : ''}`} type="button" onClick={() => removeCard(card, false)} key={`main-${card.id}`}>
                    <span>{card.name}</span><small>{card.kind} · entfernen</small>
                  </button>
                ))}
              </section>
              <section>
                <h2>Extra Deck <span>{extraDeck.length}/15</span></h2>
                {extraDeck.map((card) => (
                  <button className={`ygo-deck-entry${banlistTone(card.copyLimit) ? ` is-${banlistTone(card.copyLimit)}` : ''}`} type="button" onClick={() => removeCard(card, true)} key={`extra-${card.id}`}>
                    <span>{card.name}</span><small>{card.type} · entfernen</small>
                  </button>
                ))}
              </section>
            </div>
            <div className="ygo-editor-search">
              <label className="ygo-search">
                <span>Karte in YGOPRODeck suchen</span>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Kartennamen eingeben …" />
              </label>
              <div className="ygo-filters">
                <input aria-label="Filter Typ" value={deckFilter.type} placeholder="Typ" onChange={(event) => setDeckFilter({ ...deckFilter, type: event.target.value })} />
                <input aria-label="Filter Attribut" value={deckFilter.attribute} placeholder="Attribut" onChange={(event) => setDeckFilter({ ...deckFilter, attribute: event.target.value })} />
                <input aria-label="Filter Stufe" value={deckFilter.level} placeholder="Stufe" onChange={(event) => setDeckFilter({ ...deckFilter, level: event.target.value })} />
                <input aria-label="Filter Rasse" value={deckFilter.race} placeholder="Rasse" onChange={(event) => setDeckFilter({ ...deckFilter, race: event.target.value })} />
                <input aria-label="Filter Archetyp" value={deckFilter.archetype} placeholder="Archetyp" onChange={(event) => setDeckFilter({ ...deckFilter, archetype: event.target.value })} />
                <input aria-label="Filter Effekttext" value={deckFilter.text} placeholder="Effekttext" onChange={(event) => setDeckFilter({ ...deckFilter, text: event.target.value })} />
              </div>
              {searchBusy ? <p className="ygo-muted">Kartendaten werden geladen …</p> : null}
              {searchError ? <p className="ygo-error" role="alert">{searchError}</p> : null}
              <div className="ygo-results">
                {filterDeckPool(results, {
                  type: deckFilter.type,
                  attribute: deckFilter.attribute,
                  level: deckFilter.level.trim() ? Number(deckFilter.level) : null,
                  race: deckFilter.race,
                  archetype: deckFilter.archetype,
                  text: deckFilter.text,
                }).map((card) => {
                  const copies = counts([...mainDeck, ...extraDeck], card)
                  return (
                    <CardTile
                      card={card}
                      key={card.catalogId}
                      disabled={copies >= (card.copyLimit ?? 3)}
                      onClick={() => { addCard(card); setRelatedCard(card) }}
                    />
                  )
                })}
              </div>
              {relatedCard ? (
                <div className="ygo-related" aria-label="Verwandte Karten">
                  {relatedCard.archetype ? relatedFromCatalog(results, relatedCard).map((card) => (
                    <button type="button" key={`rel-${card.catalogId}`} onClick={() => addCard(card)}>{card.name}</button>
                  )) : <p>Kein Archetyp-Name vorhanden.</p>}
                </div>
              ) : null}
            </div>
          </div>
          {notice ? <p className="ygo-message" role="status">{notice}</p> : null}
          {!deckLoaded ? <p className="ygo-muted">Deck wird geladen …</p> : null}
          </section>
        </>
      )}
      {notice && game ? <p className="ygo-notice" role="status">{notice}</p> : null}
    </main>
  )
  return typeof document === 'undefined' ? board : createPortal(board, document.body)
}
