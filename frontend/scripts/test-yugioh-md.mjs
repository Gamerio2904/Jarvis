import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import {
  activateDuelEffect,
  advanceDuelPhase,
  attack,
  banlistTone,
  beginTriggerOrder,
  cardStatuses,
  chooseChainTarget,
  confirmPrompt,
  confirmTriggerOrder,
  createDuel,
  declinePrompt,
  declareDuelPhase,
  filterDeckPool,
  legalTargets,
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
  startJarvisTurn,
  summonExtraMonster,
  summonMonster,
} from '../src/engine/yugioh-duel.ts'
import { legalExtraSummonZones, legalMainSummonZones } from '../src/engine/yugioh-zones.ts'
import { ENGINE_STAMP } from '../src/engine/yugioh-proof.ts'

function deck(size = 40) {
  return Array.from({ length: size }, (_, index) => ({
    id: index + 1,
    name: `Monster ${index + 1}`,
    type: 'Effect Monster',
    kind: 'monster',
    atk: 1000,
    def: 1000,
    level: 4,
  }))
}

function mainPhase() {
  return advanceDuelPhase(advanceDuelPhase(createDuel(deck(), deck(), () => 0)))
}

function monster(id, extra = {}) {
  return { id, name: `Karte ${id}`, type: 'Effect Monster', kind: 'monster', atk: 1000, def: 1000, level: 4, ...extra }
}

test('18.52 Aktivieren-Fenster fragt nur erlaubte Effekte', () => {
  const base = mainPhase()
  const trigger = monster(501, {
    effect: { kind: 'draw', amount: 1 },
    effectSummary: 'Darf ziehen',
    effectTrigger: 'summon',
  })
  const hand = [trigger, ...base.player.hand.slice(1)]
  const asked = summonMonster({
    ...base,
    promptMode: 'auto',
    player: { ...base.player, hand },
  }, 501)
  assert.equal(asked.pendingPrompt?.source, 'trigger')
  assert.equal(asked.pendingPrompt?.chainNumber, 1)
  assert.equal(asked.chain.length, 0)
  assert.ok(asked.player.monsters.some((card) => card.id === 501))
  const declined = declinePrompt(asked)
  assert.equal(declined.chain.length, 0)
  assert.ok(declined.player.monsters.some((card) => card.id === 501))
  const accepted = confirmPrompt(asked)
  assert.ok(accepted.chain.some((link) => link.card.id === 501))
  assert.throws(
    () => confirmPrompt({
      ...base,
      pendingPrompt: { side: 'player', cardId: 99999, chainNumber: 1, source: 'trigger', mandatory: false },
    }),
    /unterstützt|nicht/,
  )
  const mismatch = summonMonster({
    ...base,
    promptMode: 'auto',
    player: { ...base.player, hand: [{ ...trigger, effectTrigger: 'flip' }, ...base.player.hand.slice(1)] },
  }, 501)
  assert.equal(mismatch.pendingPrompt ?? null, null)
})

test('18.52 Schalter OFF, AUTO und ON ändern nur die Frage', () => {
  const base = mainPhase()
  const optional = monster(502, {
    effect: { kind: 'draw', amount: 1 },
    effectSummary: 'Darf ziehen',
    effectTrigger: 'summon',
  })
  const must = monster(503, {
    effect: { kind: 'draw', amount: 1 },
    effectSummary: 'Dieser Effekt muss ziehen',
    effectTrigger: 'summon',
  })
  const quiet = summonMonster({
    ...base,
    promptMode: 'off',
    player: { ...base.player, hand: [optional, ...base.player.hand.slice(1)] },
  }, 502)
  assert.equal(quiet.pendingPrompt ?? null, null)
  assert.equal(quiet.chain.length, 0)
  const forced = summonMonster({
    ...base,
    promptMode: 'off',
    player: { ...base.player, hand: [must, ...base.player.hand.slice(1)] },
  }, 503)
  assert.ok(forced.player.deck.length < base.player.deck.length)
  assert.equal(quiet.player.deck.length, base.player.deck.length)
  const spell = {
    id: 510,
    name: 'Schlag',
    type: 'Normal Spell',
    kind: 'spell',
    effect: { kind: 'damage', amount: 100 },
    effectSummary: 'Schaden',
  }
  const paused = advanceDuelPhase({
    ...base,
    promptMode: 'on',
    player: { ...base.player, hand: [spell, ...base.player.hand] },
  })
  assert.equal(paused.phase, 'main1')
  assert.equal(paused.pendingPrompt?.source, 'phase')
  const moved = declinePrompt(paused)
  assert.notEqual(moved.phase, 'main1')
  assert.equal(parsePromptMode('on'), 'on')
  assert.equal(parsePromptMode('off'), 'off')
  assert.equal(parsePromptMode('anders'), 'auto')
  assert.equal(PROMPT_MODE_KEY, 'jarvis_yugioh_prompt_v1')
  const ui = readFileSync(new URL('../src/ui/YugiohDuel.tsx', import.meta.url), 'utf8')
  assert.match(ui, /PROMPT_MODE_KEY/)
  assert.match(ui, /localStorage/)
})

test('18.53 Zielwahl markiert nur legale Karten', () => {
  const base = mainPhase()
  const spell = {
    id: 520,
    name: 'Knall',
    type: 'Normal Spell',
    kind: 'spell',
    effect: { kind: 'destroy', target: 'monster' },
    effectSummary: 'zerstört ein Monster',
  }
  const weak = monster(521, { atk: 100 })
  const strong = monster(522, { atk: 2000 })
  const state = {
    ...base,
    promptMode: 'auto',
    player: { ...base.player, hand: [spell, ...base.player.hand] },
    jarvis: { ...base.jarvis, monsters: [weak, strong] },
  }
  assert.equal(legalTargets(state, 'player', 520).length, 2)
  const asked = activateDuelEffect(state, 'player', 520)
  assert.deepEqual([...asked.pendingTarget.candidates].sort(), [521, 522])
  assert.throws(() => chooseChainTarget(asked, 999), /nicht erlaubt/)
  const immune = monster(523, { rules: ['unaffected'], atk: 50 })
  const only = legalTargets({ ...state, jarvis: { ...state.jarvis, monsters: [immune, strong] } }, 'player', 520)
  assert.deepEqual(only.map((pick) => pick.cardId), [522])
  const single = activateDuelEffect({ ...state, jarvis: { ...state.jarvis, monsters: [strong] } }, 'player', 520)
  assert.equal(single.pendingTarget ?? null, null)
  assert.equal(single.chain.at(-1)?.targetId, 522)
})

test('18.53 offene Stapel bleiben in ihrer Reihenfolge und verdecken den Gegner', () => {
  const base = mainPhase()
  const revive = {
    id: 530,
    name: 'Beleben',
    type: 'Normal Spell',
    kind: 'spell',
    effect: { kind: 'revive' },
    effectSummary: 'belebt',
  }
  const low = monster(531, { atk: 100 })
  const high = monster(532, { atk: 2500 })
  const state = {
    ...base,
    promptMode: 'auto',
    player: { ...base.player, hand: [revive], graveyard: [low, high] },
  }
  const picks = legalTargets(state, 'player', 530)
  assert.deepEqual(picks.map((pick) => pick.cardId), [531, 532])
  assert.equal(picks.every((pick) => pick.owner === 'player'), true)
  const asked = activateDuelEffect(state, 'player', 530)
  const chosen = chooseChainTarget(asked, 531)
  const resolved = passDuelChain(chosen, 'player')
  assert.equal(resolved.player.monsters.some((card) => card.id === 531), true)
  assert.equal(resolved.player.graveyard.some((card) => card.id === 531), false)
  assert.equal(resolved.player.graveyard[0]?.id, 532)
  const hidden = monster(533)
  const recover = {
    id: 534,
    name: 'Zurück',
    type: 'Normal Spell',
    kind: 'spell',
    effect: { kind: 'recover' },
    effectSummary: 'holt zurück',
  }
  const faceDown = monster(535, { faceDown: true })
  const faceUp = monster(536)
  const open = legalTargets({
    ...base,
    player: {
      ...base.player,
      hand: [recover],
      graveyard: [],
      banished: [faceDown, faceUp],
      deck: [hidden],
    },
    jarvis: { ...base.jarvis, deck: [monster(537)], extraDeck: [monster(538, { extraDeck: true })] },
  }, 'player', 534)
  assert.deepEqual(open.map((pick) => pick.cardId), [536])
  assert.equal(open.some((pick) => pick.cardId === 537 || pick.cardId === 538), false)
})

test('18.54 Kette löst in derselben Reihenfolge auf und schreibt den Schaden einmal', () => {
  const base = mainPhase()
  const damage = {
    id: 540,
    name: 'Treffer',
    type: 'Normal Spell',
    kind: 'spell',
    effect: { kind: 'damage', amount: 500 },
    effectSummary: '500 Schaden',
  }
  const chained = activateDuelEffect({
    ...base,
    player: { ...base.player, hand: [damage] },
  }, 'player', 540)
  const resolved = passDuelChain(chained, 'player')
  assert.equal(resolved.jarvis.lp, 7500)
  assert.equal(resolved.chain.length, 0)
  assert.throws(() => passDuelChain(resolved, 'player'), /Priorität/)
  assert.equal(resolved.jarvis.lp, 7500)
  const css = readFileSync(new URL('../src/ui/yugioh-duel.css', import.meta.url), 'utf8')
  assert.match(css, /column-reverse/)
})

test('18.54 gleichzeitige eigene Auslöser haben eine Reihenfolge', () => {
  const base = mainPhase()
  const first = monster(541, { effect: { kind: 'draw', amount: 1 }, effectSummary: 'zieht', effectTrigger: 'summon' })
  const second = monster(542, { effect: { kind: 'heal', amount: 100 }, effectSummary: 'heilt', effectTrigger: 'summon' })
  const field = {
    ...base,
    player: { ...base.player, monsters: [first, second], usedEffects: [] },
  }
  const begun = beginTriggerOrder(field, [541, 542])
  const ordered = confirmTriggerOrder(begun, [542, 541])
  assert.deepEqual(ordered.chain.map((link) => link.card.id), [542, 541])
  assert.throws(() => confirmTriggerOrder(begun, [541, 541]), /nicht erlaubt/)
  const trap = {
    id: 1,
    controller: 'jarvis',
    card: { id: 549, name: 'Falle', type: 'Trap Card', kind: 'trap' },
    effect: { kind: 'negate' },
    negated: false,
    spellSpeed: 2,
  }
  assert.throws(
    () => confirmTriggerOrder({ ...begun, chain: [trap], chainPriority: 'player' }, [542, 541]),
    /Spell Speed 1/,
  )
})

test('18.55 Kampf und Ende ersetzen den Sprung, Main 2 folgt auf den Kampf', () => {
  const base = mainPhase()
  assert.throws(() => declareDuelPhase(base, 'battle'), /Turn 1/)
  const ended = declareDuelPhase(base, 'end')
  assert.equal(ended.phase, 'end')
  const later = { ...base, turn: 2 }
  const battle = declareDuelPhase(later, 'battle')
  assert.equal(battle.phase, 'battle')
  assert.equal(advanceDuelPhase(battle).phase, 'main2')
})

test('18.55 Schadensfenster und Lebenspunkte bleiben bei der Engine', () => {
  const base = mainPhase()
  const attacker = monster(550, { atk: 1600, position: 'attack', zoneKind: 'mmz', zoneIndex: 0 })
  const target = monster(551, { atk: 0, def: 0, position: 'attack' })
  const ready = {
    ...base,
    turn: 2,
    phase: 'battle',
    selectedAttacker: 550,
    player: { ...base.player, monsters: [attacker] },
    jarvis: { ...base.jarvis, monsters: [target] },
  }
  const immediate = attack(ready, 551)
  assert.equal(immediate.jarvis.lp, 6400)
  const paused = attack({ ...ready, battleWindow: true }, 551)
  assert.equal(paused.jarvis.lp, 8000)
  assert.equal(paused.battleStep, 'damage')
  const done = resolveDeclaredAttack(paused)
  assert.equal(done.jarvis.lp, immediate.jarvis.lp)
  assert.equal(done.lastAnimation?.damage?.jarvis, 1600)
  assert.throws(() => resolveDeclaredAttack(done), /keine offene Angriffsdeklaration/)
  assert.equal(done.jarvis.lp, 6400)
  const trap = {
    id: 552,
    name: 'Ausweichen',
    type: 'Trap Card',
    kind: 'trap',
    faceDown: true,
    lockedKey: 0,
    effect: { kind: 'negateAttack' },
    effectSummary: 'negiert den Angriff',
  }
  const trapped = attack({
    ...ready,
    battleWindow: true,
    jarvis: { ...ready.jarvis, spells: [trap] },
  }, 551)
  const negated = passDuelChain(trapped, 'player')
  assert.equal(negated.jarvis.lp, 8000)
  assert.equal(ENGINE_STAMP, '18.60.0-ygo-md')
})

test('18.56 Zonenwahl bleibt in den bekannten Zonen', () => {
  const base = mainPhase()
  assert.ok(legalMainSummonZones(base.player.monsters).length > 1)
  const placed = summonMonster(base, base.player.hand[0].id)
  assert.equal(placed.player.monsters[0].zoneIndex, 0)
  assert.throws(() => summonMonster(base, base.player.hand[0].id, [], 'attack', 5), /nicht erlaubt/)
  const first = monster(560)
  const second = monster(561)
  const fusion = monster(562, { extraDeck: true, extraKind: 'fusion' })
  const state = {
    ...base,
    player: { ...base.player, monsters: [first, second], extraDeck: [fusion] },
  }
  assert.ok(legalExtraSummonZones(state.player.monsters, [560, 561]).every((zone) => zone.zoneKind === 'emz' || zone.zoneIndex < 5))
  assert.throws(
    () => summonExtraMonster(state, 562, [560, 561], { zoneKind: 'mmz', zoneIndex: 4 }),
    /nicht erlaubt/,
  )
  assert.throws(
    () => summonExtraMonster(state, 562, [560, 561], { zoneKind: 'mmz', zoneIndex: 5 }),
    /nicht erlaubt/,
  )
})

test('18.56 Xyz-Material bleibt unter der Karte', () => {
  const base = mainPhase()
  const first = monster(570, { level: 4 })
  const second = monster(571, { level: 4 })
  const xyz = monster(572, { extraDeck: true, extraKind: 'xyz', level: 4 })
  const result = summonExtraMonster({
    ...base,
    player: { ...base.player, monsters: [first, second], extraDeck: [xyz] },
  }, 572, [570, 571])
  assert.deepEqual(result.player.monsters[0].materials?.map((card) => card.id).sort(), [570, 571])
  assert.equal(result.player.graveyard.some((card) => card.id === 570 || card.id === 571), false)
})

test('18.56 benannte Materialien gelten nur, wenn der Text sie hergibt', () => {
  assert.equal(materialClauseFromText('2 monsters'), null)
  assert.equal(materialClauseFromText('using "Alpha" and "Beta" as material')?.status, 'names')
  assert.equal(materialClauseFromText('must include material "Only"')?.status, 'ambiguous')
  assert.equal(materialClauseFromText('materials with a total Level equal 8')?.status, 'levelSum')
  const base = mainPhase()
  const alpha = monster(580, { name: 'Alpha' })
  const beta = monster(581, { name: 'Beta' })
  const other = monster(582, { name: 'Gamma' })
  const named = monster(583, {
    extraDeck: true,
    extraKind: 'fusion',
    materialClause: { status: 'names', names: ['Alpha', 'Beta'] },
  })
  const open = {
    ...base,
    player: { ...base.player, monsters: [alpha, other], extraDeck: [named] },
  }
  assert.throws(() => summonExtraMonster(open, 583, [580, 582]), /Alpha|Beta/)
  const ready = {
    ...base,
    player: { ...base.player, monsters: [alpha, beta], extraDeck: [named] },
  }
  assert.equal(summonExtraMonster(ready, 583, [580, 581]).player.monsters[0].id, 583)
  const plain = monster(584, { extraDeck: true, extraKind: 'fusion' })
  assert.equal(summonExtraMonster({
    ...base,
    player: { ...base.player, monsters: [other, monster(585)], extraDeck: [plain] },
  }, 584, [582, 585]).player.monsters[0].id, 584)
  const muddy = monster(586, { extraDeck: true, extraKind: 'fusion', materialClause: { status: 'ambiguous' } })
  assert.throws(() => summonExtraMonster({
    ...base,
    player: { ...base.player, monsters: [alpha, beta], extraDeck: [muddy] },
  }, 586, [580, 581]), /nicht eindeutig/)
})

test('18.57 Statussymbole nennen nur den Zustand der Engine', () => {
  assert.deepEqual(cardStatuses(monster(590, { rules: ['untargetable'] })), ['untargetable'])
  assert.deepEqual(cardStatuses(monster(591, { rules: ['unaffected'] })), ['immune'])
  assert.deepEqual(cardStatuses(monster(592, { effectsNegated: true })), ['negated'])
  assert.deepEqual(cardStatuses(monster(593)), [])
  const base = createDuel(deck(), deck(), () => 0)
  const ended = startJarvisTurn({
    ...base,
    phase: 'end',
    player: { ...base.player, monsters: [monster(594, { effectsNegated: true })] },
  })
  assert.equal(ended.turnOwner, 'jarvis')
  assert.equal(ended.player.monsters[0].effectsNegated, undefined)
})

test('18.58 Pendel-Skalen und Pendelbeschwörung', () => {
  const base = mainPhase()
  const left = monster(600, { pendulumScale: 1, level: 4 })
  const right = monster(601, { pendulumScale: 8, level: 4 })
  const plain = monster(602)
  const handState = {
    ...base,
    player: { ...base.player, hand: [left, right, plain, ...base.player.hand] },
  }
  assert.throws(() => placePendulumScale(handState, 602, 0), /keine Pendel-Skala/)
  const scaled = placePendulumScale(placePendulumScale(handState, 600, 0), 601, 1)
  assert.equal(scaled.player.scales?.[0]?.pendulumScale, 1)
  assert.equal(scaled.player.scales?.[1]?.pendulumScale, 8)
  assert.equal(scaled.player.monsters.some((card) => card.id === 600 || card.id === 601), false)
  const mid = monster(603, { level: 4 })
  const outside = monster(604, { level: 8 })
  assert.throws(() => pendulumSummon({
    ...scaled,
    player: { ...scaled.player, hand: [outside, ...scaled.player.hand] },
  }, [604]), /Skalen/)
  const summoned = pendulumSummon({
    ...scaled,
    player: { ...scaled.player, hand: [mid, ...scaled.player.hand] },
  }, [603])
  assert.ok(summoned.player.monsters.some((card) => card.id === 603))
  const attacker = monster(605, { atk: 1800, position: 'attack' })
  const defender = monster(606, { atk: 0, def: 0, position: 'attack', pendulumScale: 4 })
  const battle = attack(selectAttacker({
    ...base,
    turn: 2,
    phase: 'battle',
    player: { ...base.player, monsters: [attacker] },
    jarvis: { ...base.jarvis, monsters: [defender] },
  }, 605), 606)
  assert.equal(battle.jarvis.extraDeck.some((card) => card.id === 606 && card.faceUpExtra), true)
  assert.equal(battle.jarvis.graveyard.some((card) => card.id === 606), false)
  const blocked = monster(607, { zoneKind: 'emz', zoneIndex: 0 })
  const blockedRight = monster(608, { zoneKind: 'emz', zoneIndex: 1 })
  const extraPen = monster(609, { level: 4, faceUpExtra: true, pendulumScale: 3 })
  assert.throws(() => pendulumSummon({
    ...scaled,
    player: {
      ...scaled.player,
      monsters: [blocked, blockedRight],
      extraDeck: [extraPen],
      hand: [],
    },
  }, [609]), /EMZ|Link/)
})

test('18.58 Ritual verbraucht die Normalbeschwörung nicht', () => {
  const base = mainPhase()
  const ritual = monster(610, { type: 'Ritual Monster', ritual: true, level: 8, atk: 3000 })
  const low = monster(611, { level: 3 })
  const high = monster(612, { level: 5 })
  const spell = { id: 613, name: 'Schwarzes Ritual', type: 'Ritual Spell', kind: 'spell' }
  const state = {
    ...base,
    player: { ...base.player, hand: [ritual, spell], monsters: [low, high], normalSummonUsed: false },
  }
  assert.throws(() => ritualSummon(state, 610, null, [611]), /Tributstufe/)
  const summoned = ritualSummon(state, 610, null, [611, 612])
  assert.equal(summoned.player.normalSummonUsed, false)
  assert.ok(summoned.player.monsters.some((card) => card.id === 610))
  assert.ok(summoned.player.graveyard.some((card) => card.id === 611))
  assert.throws(() => ritualSummon({
    ...state,
    player: { ...state.player, hand: [monster(614), spell] },
  }, 614, null, [611, 612]), /keine Ritual/)
  assert.throws(() => ritualSummon({
    ...state,
    player: { ...state.player, hand: [{ ...ritual, ritualSpellName: 'Schwarzes Ritual' }, monster(615, { name: 'Anderer Zauber', type: 'Spell', kind: 'spell' })] },
  }, 610, 615, [611, 612]), /Schwarzes Ritual/)
})

test('18.59 Deckfilter und Banlist bleiben am geladenen Stapel', () => {
  const cards = [
    monster(620, { level: 4, attribute: 'DARK', race: 'Spellcaster', archetype: 'Magier', effectSummary: 'zieht', copyLimit: 0 }),
    monster(621, { level: 8, attribute: 'LIGHT', race: 'Dragon', effectSummary: 'brennt', copyLimit: 3 }),
    monster(622, { level: 4, attribute: 'DARK', race: 'Spellcaster', archetype: 'Magier', name: 'Zwillingsmagier' }),
  ]
  assert.equal(filterDeckPool(cards, { level: 4 }).length, 2)
  assert.equal(filterDeckPool(cards, { level: 4 })[0].copyLimit, 0)
  assert.equal(banlistTone(0), 'forbidden')
  assert.equal(banlistTone(1), 'limited')
  assert.equal(banlistTone(2), 'semi')
  assert.equal(banlistTone(undefined), null)
  assert.equal(banlistTone(3), null)
  assert.equal(relatedFromCatalog(cards, cards[1]).length, 0)
  assert.equal(relatedFromCatalog(cards, cards[0]).some((card) => card.id === 622), true)
  assert.equal(relatedFromCatalog(cards, monster(623)).length, 0)
})

test('18.59 Duellprotokoll nennt nur geschehene Aktionen', () => {
  const base = mainPhase()
  const played = summonMonster({ ...base, log: [] }, base.player.hand[0].id)
  assert.ok(played.log?.some((line) => line.startsWith('Beschwörung:')))
  const phased = advanceDuelPhase({ ...played, log: played.log })
  assert.ok(phased.log?.some((line) => line.startsWith('Phase:')))
  assert.equal(phased.log?.some((line) => line.includes('Replay')), false)
})

test('18.60 die Doku nennt die offenen Lücken und der Stempel ist neu', () => {
  const doc = readFileSync(new URL('../../docs/yugioh-duel.md', import.meta.url), 'utf8')
  assert.match(doc, /Xyz-Material abnehmen/)
  assert.match(doc, /Replay/)
  assert.match(doc, /historische Pendel/)
  assert.match(doc, /OCG/)
  assert.equal(ENGINE_STAMP, '18.60.0-ygo-md')
  const version = readFileSync(new URL('../package.json', import.meta.url), 'utf8')
  assert.match(version, /"version": "18\.60\.0"/)
})
