import { redactSecrets } from './guards.ts'
import {
  addNote as storeAddNote,
  listConversations as storeListConversations,
  listMessages as storeListMessages,
  loadSettings as storeLoadSettings,
  type Message,
} from './store.ts'
import { PRESENCE_PORT, presenceWriteAllowed, readPresenceToken } from './presence-lan.ts'

export type PresenceStore = {
  loadSettings: () => { presence_enabled?: boolean; presence_token?: string }
  listConversations: () => Promise<Array<{ id: string }>>
  listMessages: (id: string) => Promise<Message[]>
  addNote: (text: string) => Promise<{ id: string }>
}

const defaultStore: PresenceStore = {
  loadSettings: storeLoadSettings,
  listConversations: storeListConversations,
  listMessages: storeListMessages,
  addNote: storeAddNote,
}

export const PRESENCE_MSG_CAP = 40
export const PRESENCE_DROP_CAP = 2000

export type PresenceHttpReq = {
  method: string
  path: string
  headers: Record<string, string | undefined>
  body?: string
  remoteHost: string
}

export type PresenceHttpRes = {
  status: number
  body: Record<string, unknown>
}

export type PresenceChat = (conversationId: string, text: string) => Promise<{ reply: string; tool?: unknown }>

function json(status: number, body: Record<string, unknown>): PresenceHttpRes {
  return { status, body }
}

function guard(req: PresenceHttpReq, store: PresenceStore): PresenceHttpRes | null {
  const s = store.loadSettings()
  const given = readPresenceToken(req.headers)
  const g = presenceWriteAllowed({
    enabled: Boolean(s.presence_enabled),
    expectedToken: s.presence_token || '',
    givenToken: given,
    remoteHost: req.remoteHost,
  })
  if (!g.ok) return json(g.status, { ok: false, error: g.error })
  return null
}

function stripSecrets<T>(value: T): T {
  return JSON.parse(redactSecrets(JSON.stringify(value))) as T
}

export async function handlePresenceHttp(
  req: PresenceHttpReq,
  chat?: PresenceChat,
  store: PresenceStore = defaultStore,
): Promise<PresenceHttpRes> {
  const path = (req.path || '/').split('?')[0]
  if (req.method === 'GET' && (path === '/v1/presence' || path === '/')) {
    const denied = guard(req, store)
    if (denied) return denied
    const convs = await store.listConversations()
    const conv = convs[0]
    if (!conv) return json(200, { ok: true, conversation_id: null, messages: [] })
    const rows = await store.listMessages(conv.id)
    const messages = rows.slice(-PRESENCE_MSG_CAP).map((m) => stripMessage(m))
    return json(200, stripSecrets({ ok: true, conversation_id: conv.id, messages }))
  }

  if (req.method === 'POST' && path === '/v1/presence') {
    const denied = guard(req, store)
    if (denied) return denied
    let text = ''
    try {
      const o = req.body ? (JSON.parse(req.body) as { text?: string }) : {}
      text = String(o.text || '').trim()
    } catch {
      return json(400, { ok: false, error: 'JSON { text } erwartet.' })
    }
    if (!text) return json(400, { ok: false, error: 'Leere Zeile.' })
    const convs = await store.listConversations()
    const conversationId = convs[0]?.id
    if (!conversationId) return json(409, { ok: false, error: 'Kein offenes Gespräch auf dem Hirn.' })
    if (!chat) return json(503, { ok: false, error: 'Chat-Pfad nicht gebunden.' })
    const out = await chat(conversationId, text)
    return json(200, stripSecrets({ ok: true, conversation_id: conversationId, reply: out.reply, tool: out.tool || null }))
  }

  if (req.method === 'POST' && path === '/v1/presence/drop') {
    const denied = guard(req, store)
    if (denied) return denied
    let text = ''
    let kind = 'note'
    try {
      const o = req.body ? (JSON.parse(req.body) as { text?: string; kind?: string }) : {}
      text = String(o.text || '').trim().slice(0, PRESENCE_DROP_CAP)
      kind = String(o.kind || 'note')
    } catch {
      return json(400, { ok: false, error: 'JSON { text } erwartet.' })
    }
    if (!text) return json(400, { ok: false, error: 'Nichts zu legen.' })
    const note = await store.addNote(`[${kind}] ${text}`)
    return json(200, { ok: true, id: note.id, kind: 'note' })
  }

  return json(404, { ok: false, error: 'Unbekannt.' })
}

function stripMessage(m: Message): { id: string; role: string; content: string; created_at: string } {
  return {
    id: m.id,
    role: m.role,
    content: redactSecrets(m.content || ''),
    created_at: m.created_at,
  }
}

export function presenceListenHint(bindOk: boolean, port = PRESENCE_PORT): string {
  if (bindOk) return `Hirn lauscht :${port} nur LAN.`
  return `Server aus — Bind :${port} fehlgeschlagen. Presence bleibt zu, kein Fake-Chat.`
}
