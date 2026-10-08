import type { Todo } from './store.ts'

const TODO_WORD = /\b(to-?dos?|aufgaben?|erledigen|erledigt|offen(?:e|en)?)\b/i
const ASK_WORD = /\b(was|welche|zeig|zeige|nenn|nenne|sag|sage|lies|liste|hab|habe|hast|habt|steht|gibt|muss|noch|alle|meine|anstehen)/i

/** „Was hab ich für Todos?“, „was muss ich noch erledigen“, „zeig meine Aufgaben“. */
export function isTodoQuery(text: string): boolean {
  const t = text.trim()
  return Boolean(t) && TODO_WORD.test(t) && ASK_WORD.test(t)
}

export function openTodos(todos: Todo[]): Todo[] {
  return todos
    .filter((t) => t.status !== 'done')
    .sort((a, b) => {
      const da = a.deadline_date ? `${a.deadline_date} ${a.deadline_time || '99:99'}` : '9999'
      const db = b.deadline_date ? `${b.deadline_date} ${b.deadline_time || '99:99'}` : '9999'
      return da === db ? 0 : da < db ? -1 : 1
    })
}

export function todoSpeech(todos: Todo[]): string {
  const open = openTodos(todos)
  if (!open.length) return 'Sir, Sie haben nichts mehr zu erledigen.'
  const head = open.length === 1 ? 'Sir, Sie haben eine offene Aufgabe: ' : `Sir, Sie haben ${open.length} offene Aufgaben: `
  return head + open.map((t) => t.title).join(', ') + '.'
}

const ACKS = ['Ja, Sir?', 'Zu Diensten, Sir.', 'Wie kann ich helfen, Sir?', 'Ich höre, Sir.', 'Sie wünschen, Sir?']

export function wakeAck(n = Math.floor(Math.random() * ACKS.length)): string {
  return ACKS[n % ACKS.length]
}
