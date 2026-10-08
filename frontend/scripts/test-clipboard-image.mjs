// @ts-nocheck — Test-Skript mit losen Literalen/Mocks; Laufzeit wird vom Test selbst geprüft.
import assert from 'node:assert/strict'
import 'fake-indexeddb/auto'

const mem = Object.create(null)
globalThis.localStorage = {
  getItem: (k) => (k in mem ? mem[k] : null),
  setItem: (k, v) => {
    mem[k] = String(v)
  },
  removeItem: (k) => {
    delete mem[k]
  },
  clear: () => {
    for (const k of Object.keys(mem)) delete mem[k]
  },
}

const { clipboardImageFile } = await import('../src/engine/clipboard-image.ts')
const { parseChatBlocks } = await import('../src/engine/chat-blocks.ts')
const { createConversation, listMessages } = await import('../src/engine/store.ts')
const { streamChat } = await import('../src/engine/chat.ts')

const png = new File([Uint8Array.from([1, 2, 3, 4])], 'clip.png', { type: 'image/png' })
const text = { kind: 'string', type: 'text/plain', getAsFile: () => null }
const image = { kind: 'file', type: 'image/png', getAsFile: () => png }
assert.equal(clipboardImageFile(null), null)
assert.equal(clipboardImageFile({ items: [text] }), null)
assert.equal(clipboardImageFile({ items: [text, image] }), png)
assert.equal(clipboardImageFile({ files: [png] }), png)
assert.equal(clipboardImageFile({ items: [{ kind: 'file', type: 'application/pdf', getAsFile: () => png }] }), null)

const conv = await createConversation('Bild')
const src = 'data:image/jpeg;base64,abc'
await new Promise((resolve, reject) => {
  streamChat(
    conv.id,
    'Portfolio',
    { onDone: () => resolve(undefined), onError: (err) => reject(new Error(err)) },
    { blocks: [{ kind: 'image', src, alt: 'Eingefügtes Bild', source: 'Zwischenablage' }] },
  ).catch(reject)
})
const rows = await listMessages(conv.id)
const user = rows.find((row) => row.role === 'user')
const blocks = parseChatBlocks(user?.meta?.blocks)
assert.equal(user?.content, 'Portfolio')
assert.equal(blocks[0]?.kind, 'image')
assert.equal(blocks[0]?.source, 'Zwischenablage')
assert.match(blocks[0]?.src || '', /^data:image\/jpeg/)

console.log('test-clipboard-image ok')
