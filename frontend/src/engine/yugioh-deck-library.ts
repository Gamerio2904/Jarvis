import type { DuelCard } from './yugioh-duel.ts'
import { REAL_CARDS, REAL_DECKS, type RealDeck } from './yugioh-real-decks.ts'

export type { RealDeck }

export const REAL_DECK_LIST: readonly RealDeck[] = REAL_DECKS
export const ULTRON_DECK_POOL: readonly RealDeck[] = REAL_DECKS.filter((deck) => deck.ultron)

export function findRealDeck(id: string): RealDeck | undefined {
  return REAL_DECKS.find((deck) => deck.id === id)
}

function cardImage(id: number): string {
  return `https://images.ygoprodeck.com/images/cards_small/${id}.jpg`
}

// Every copy gets its own duel id; catalogId stays the real card id.
export function buildRealDeck(deck: RealDeck, nextId: () => number): { main: DuelCard[]; extra: DuelCard[] } {
  const expand = (rows: [number, number][]): DuelCard[] =>
    rows.flatMap(([cardId, quantity]) => {
      const card = REAL_CARDS[cardId]
      if (!card) throw new Error(`Karte ${cardId} fehlt in der Deck-Bibliothek.`)
      return Array.from({ length: quantity }, () => ({
        ...card,
        id: nextId(),
        catalogId: cardId,
        imageUrl: cardImage(cardId),
      }))
    })
  return { main: expand(deck.main), extra: expand(deck.extra) }
}

export function pickUltronDeck(random: () => number = Math.random): RealDeck {
  if (!ULTRON_DECK_POOL.length) throw new Error('Der Ultron-Deckpool ist leer.')
  return ULTRON_DECK_POOL[Math.min(ULTRON_DECK_POOL.length - 1, Math.floor(random() * ULTRON_DECK_POOL.length))]
}
