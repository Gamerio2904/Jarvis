import assert from 'node:assert/strict'
import 'fake-indexeddb/auto'

if (!globalThis.localStorage) {
  const memory = new Map()
  globalThis.localStorage = {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => memory.set(String(key), String(value)),
    removeItem: (key) => memory.delete(key),
    clear: () => memory.clear(),
    key: (index) => [...memory.keys()][index] ?? null,
    get length() { return memory.size },
  }
}

const store = await import('../src/engine/store.ts')
const { streamChat } = await import('../src/engine/chat.ts')
const { handleReminders } = await import('../src/engine/reminders.ts')
const { parseReminderIntent } = await import('../src/engine/remind-parse.ts')
assert.equal(parseReminderIntent('31.12.2099 um 8 Uhr'), null)
const conversation = await store.createConversation('Reminder-Rückfrage')
let reply = ''
const handlers = { onDone: ({ assistant_message }) => { reply = assistant_message.content } }

await streamChat(conversation.id, 'Erinnere mich an Steuer', handlers)
assert.match(reply, /Wann soll ich an Steuer erinnern/)
assert.equal((await store.getPending(conversation.id))?.action, 'ask_time')
assert.equal((await handleReminders('other-conversation', '31.12.2099 um 8 Uhr')).handled, false)
assert.equal((await store.getPending(conversation.id))?.args.title, 'Steuer')

await streamChat(conversation.id, '31.12.2099 um 8 Uhr', handlers)
assert.match(reply, /Steuer/)
assert.equal((await store.getPending(conversation.id)), undefined)
const reminders = await store.listReminders()
assert.equal(reminders.length, 1)
assert.equal(reminders[0].title, 'Steuer')
assert.equal(new Date(reminders[0].due_at).getFullYear(), 2099)

await streamChat(conversation.id, 'Erinnere mich an Abholung', handlers)
assert.equal((await store.getPending(conversation.id))?.args.title, 'Abholung')
await streamChat(conversation.id, 'Zeige Notizen', handlers)
assert.equal((await store.getPending(conversation.id)), undefined)

await streamChat(conversation.id, 'Erinnere mich an Abholung', handlers)
await streamChat(conversation.id, 'nein', handlers)
assert.match(reply, /abgebrochen/i)
assert.equal((await store.getPending(conversation.id)), undefined)
assert.equal((await store.listReminders()).length, 1)

await store.setPending({
  conversation_id: conversation.id,
  tool: 'reminder',
  action: 'ask_time',
  args: { title: 'abgelaufen' },
  preview: 'abgelaufen',
  created_at: new Date(Date.now() - 16 * 60_000).toISOString(),
})
assert.equal((await handleReminders(conversation.id, 'irgendwann')).handled, false)
assert.equal((await store.getPending(conversation.id)), undefined)

console.log('test:reminder-pending ok')
