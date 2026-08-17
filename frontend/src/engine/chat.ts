import { completeChat, ensureModel, getDownloadProgress, getLlmError, hasCachedModel, isModelReady, releaseModel } from './llm'
import { completeGemini, geminiReady, GEMINI_LABEL, streamGemini, testGemini } from './gemini'
import { completeGroq, groqReady, testGroq } from './groq'
import { userFacingCloudError } from './cloud-errors'
import { HELP_TEXT, isHelpCommand, scrubReply } from './guards'
import { handleMemory, memoryBlock } from './memory'
import { rewriteFollowUp } from './last-step'
import { splitIntents } from './split-intents'
import { normalizeUtterance } from './utterance.ts'
import { GEMINI_PERSONA, PERSONA, SEARCH_ON_HINT, VOICE_HINT } from './persona'
import {
  formatResearchReply,
  isLiveLookup,
  isProductLookup,
  isSearchRefusal,
  parseEuroPrices,
  RESEARCH_EMPTY,
  RESEARCH_NEEDS_GEMINI,
  RESEARCH_OFF_REPLY,
  researchHasSources,
  researchQuery,
  sourceDigest,
  type ResearchMeta,
} from './research-parse'
import { fillResearchLinks } from './web-search'
import {
  APP_VERSION,
  DEFAULT_MODEL,
  addMessage,
  addResearchAudit,
  createConversation as storeCreate,
  deleteConversation as storeDelete,
  get as storeGet,
  listConversations as storeListConv,
  listMemory,
  listMessages,
  listEvents,
  listReminders,
  listTodos,
  loadSettings,
  readLastList,
  saveSettings,
  touchConversation,
  type Conversation,
  type Message,
  type Settings,
} from './store'
import { handleCalendar } from './calendar'
import { handleReminders } from './reminders'
import { handleAlarms } from './alarms'
import { handleTimers } from './timers'
import { handleTools, type ToolMeta } from './tools'
import { handleTv, tvStatusFromSettings } from './tv'
import { handleFan } from './fan'
import { handleWeather } from './weather'
import { handlePlaces } from './places'
import { handleShopping } from './shopping'
import { handleBirthday } from './birthday'
import { handleHome } from './home'
import { handleLeave } from './leave'
import { handleBrief } from './brief'
import { isBriefAsk } from './brief-parse'
import { handleDrive } from './drive'
import { handleEyeAsk } from './eye'
import { parseEyeIntent } from './eye-parse'
import { handleChatSearch } from './search-chat'
import { parseOrdinalFollowUp, rewriteOrdinal } from './ordinal'

export type StreamHandlers = {
  onMeta?: (meta: {
    user_message: Message
    model: string
    using_fallback: boolean
    research?: ResearchMeta | null
  }) => void
  onToken?: (token: string) => void
  onReplace?: (content: string) => void
  onRetry?: (attempt: number) => void
  onDone?: (payload: {
    assistant_message: Message
    conversation: Conversation
    guarded?: boolean
    research?: ResearchMeta | null
    tool?: ToolMeta | null
  }) => void
  onError?: (detail: string) => void
}

type RouteHit = {
  reply: string
  tool?: ToolMeta | null
  research?: ResearchMeta
  lastTool?: string
}

export async function getHealth() {
  const mem = await listMemory()
  const localReady = isModelReady()
  const cloud = geminiReady()
  const ready = cloud || localReady
  const err = getLlmError()
  const prog = getDownloadProgress()
  const s = loadSettings()
  return {
    ok: ready,
    ollama: false,
    engine: cloud ? 'gemini' : 'on-device',
    model: cloud ? GEMINI_LABEL : DEFAULT_MODEL.label,
    model_ready: localReady,
    gemini_ready: cloud,
    gemini_enabled: s.gemini_enabled,
    configured_model: cloud ? GEMINI_LABEL : DEFAULT_MODEL.label,
    fallback_model: DEFAULT_MODEL.label,
    model_heavy: DEFAULT_MODEL.label,
    heavy_equals_default: !cloud,
    using_fallback: false,
    version: APP_VERSION,
    memory_count: mem.length,
    research_opt_in: s.research_opt_in,
    tv: tvStatusFromSettings(),
    warning: cloud
      ? groqReady()
        ? 'Gemini — bei Limit nächstes Modell, dann Groq. Chat geht ins Netz.'
        : 'Gemini (Google) — bei Limit nächstes Modell. Chat geht ins Netz.'
      : localReady
        ? 'On-Device 0.5B — denkt auf diesem Handy, kein Server.'
        : err || 'Modell noch nicht geladen.',
    error: ready
      ? undefined
      : s.gemini_enabled && !s.gemini_api_key.trim()
        ? 'Gemini an, aber kein API-Key.'
        : err || 'Modell nicht geladen. Unter Einstellungen herunterladen oder Gemini nutzen.',
    download_pct: prog.pct,
  }
}

export function getSettings(): Settings {
  return loadSettings()
}

export function patchSettings(patch: Partial<Settings>): Settings {
  return saveSettings(patch)
}

export { ensureModel, getDownloadProgress, hasCachedModel, isModelReady, releaseModel, testGemini, testGroq, geminiReady }

async function routeDeterministic(conversationId: string, content: string): Promise<RouteHit | null> {
  if (isHelpCommand(content)) {
    return { reply: HELP_TEXT, lastTool: 'help' }
  }

  const ord = parseOrdinalFollowUp(content)
  if (ord) {
    const titles = readLastList()
    if (!titles.length) {
      return {
        reply: 'Welche Liste? Sagen Sie zum Beispiel was fehlt oder was kommt diese Woche raus.',
        lastTool: 'ordinal',
      }
    }
    const title = titles[ord.index]
    if (!title) {
      return { reply: `Es gibt nur ${titles.length} Einträge.`, lastTool: 'ordinal' }
    }
    const rewritten = rewriteOrdinal(content, loadSettings().last_step_tool, titles)
    if (rewritten) return routeDeterministic(conversationId, rewritten)
    const label = ord.index === 1 ? 'zweite' : `${ord.index + 1}.`
    return { reply: `Das ${label}: ${title}.`, lastTool: loadSettings().last_step_tool || 'ordinal' }
  }

  const tvHit = await handleTv(content)
  if (tvHit.handled && tvHit.reply) {
    return {
      reply: tvHit.reply,
      tool: { tool_status: 'executed', tool: 'tv', action: 'command', label: 'TV' },
      lastTool: 'tv',
    }
  }

  const fanHit = await handleFan(content)
  if (fanHit.handled && fanHit.reply) {
    return {
      reply: fanHit.reply,
      tool: { tool_status: 'executed', tool: 'fan', action: 'command', label: 'Ventilator' },
      lastTool: 'fan',
    }
  }

  const driveHit = await handleDrive(conversationId, content)
  if (driveHit.handled && driveHit.reply) {
    return {
      reply: driveHit.reply,
      tool: driveHit.tool,
      lastTool: driveHit.lastTool || 'drive',
    }
  }

  const placeHit = await handlePlaces(conversationId, content)
  if (placeHit.handled && placeHit.reply) {
    return {
      reply: placeHit.reply,
      tool: placeHit.tool,
      lastTool: placeHit.lastTool || 'maps',
    }
  }

  const memHit = await handleMemory(conversationId, content)
  if (memHit.handled && memHit.reply) {
    return { reply: memHit.reply, lastTool: 'memory' }
  }

  const shopHit = await handleShopping(conversationId, content)
  if (shopHit.handled && shopHit.reply) {
    return { reply: shopHit.reply, tool: shopHit.tool, lastTool: shopHit.lastTool || 'shopping' }
  }

  const bdayHit = await handleBirthday(conversationId, content)
  if (bdayHit.handled && bdayHit.reply) {
    return { reply: bdayHit.reply, tool: bdayHit.tool, lastTool: bdayHit.lastTool || 'birthday' }
  }

  const homeHit = await handleHome(conversationId, content)
  if (homeHit.handled && homeHit.reply) {
    return { reply: homeHit.reply, tool: homeHit.tool, lastTool: homeHit.lastTool || 'home' }
  }

  const leaveHit = await handleLeave(conversationId, content)
  if (leaveHit.handled && leaveHit.reply) {
    return { reply: leaveHit.reply, tool: leaveHit.tool, lastTool: leaveHit.lastTool || 'leave' }
  }

  if (isBriefAsk(content)) {
    const briefHit = await handleBrief()
    if (briefHit.handled && briefHit.reply) {
      return { reply: briefHit.reply, tool: briefHit.tool, lastTool: briefHit.lastTool || 'brief' }
    }
  }

  const calHit = await handleCalendar(conversationId, content)
  if (calHit.handled && calHit.reply) {
    return { reply: calHit.reply, tool: calHit.tool, lastTool: 'calendar' }
  }

  const alarmHit = await handleAlarms(conversationId, content)
  if (alarmHit.handled && alarmHit.reply) {
    return { reply: alarmHit.reply, tool: alarmHit.tool, lastTool: 'alarm' }
  }

  const timerHit = await handleTimers(conversationId, content)
  if (timerHit.handled && timerHit.reply) {
    return { reply: timerHit.reply, tool: timerHit.tool, lastTool: 'timer' }
  }

  const remindHit = await handleReminders(conversationId, content)
  if (remindHit.handled && remindHit.reply) {
    return { reply: remindHit.reply, tool: remindHit.tool, lastTool: 'reminder' }
  }

  const toolHit = await handleTools(conversationId, content)
  if (toolHit.handled && toolHit.reply) {
    return { reply: toolHit.reply, tool: toolHit.tool, lastTool: toolHit.tool?.tool || 'todo' }
  }

  if (parseEyeIntent(content)) {
    const eyeHit = await handleEyeAsk()
    if (eyeHit.handled && eyeHit.reply) {
      return { reply: eyeHit.reply, tool: eyeHit.tool, lastTool: eyeHit.lastTool || 'eye' }
    }
  }

  const weatherHit = await handleWeather(content)
  if (weatherHit.handled && weatherHit.reply) {
    return {
      reply: weatherHit.reply,
      tool: weatherHit.tool,
      research: weatherHit.research,
      lastTool: 'weather',
    }
  }

  const searchHit = await handleChatSearch(content)
  if (searchHit.handled && searchHit.reply) {
    return { reply: searchHit.reply, tool: searchHit.tool, lastTool: searchHit.lastTool || 'search' }
  }

  return null
}

function lastStepHint(): string {
  const s = loadSettings()
  const tool = (s.last_step_tool || '').trim()
  if (!tool) return ''
  const title = (s.last_step_title || '').trim()
  return `Letzter Tool-Schritt: ${tool}${title ? ` (${title})` : ''}. Wenn der Nutzer „das“, „lauter“, „stopp“ oder „nochmal“ sagt, bezieht sich das darauf. Keine Ausführung erfinden.`
}

function persistLastStep(tool: string, title = '', when = '', utterance = ''): void {
  const medium =
    tool === 'tv' ? 'tv' : tool === 'drive' && /spotify/i.test(title) ? 'spotify' : tool === 'drive' ? 'drive' : loadSettings().last_medium
  saveSettings({
    last_step_tool: tool,
    last_step_title: title,
    last_step_when: when,
    last_step_utterance: utterance || loadSettings().last_step_utterance,
    last_medium: medium || '',
  })
}

function newest<T extends { created_at: string }>(rows: T[]): T | undefined {
  return [...rows].sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0]
}

function clockOf(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

async function rememberToolFromStore(tool: string): Promise<void> {
  if (tool === 'calendar') {
    const ev = newest(await listEvents())
    persistLastStep('calendar', ev?.title ?? '', ev?.start_at ?? '')
    return
  }
  if (tool === 'alarm') {
    const a = newest((await listReminders()).filter((r) => r.kind === 'alarm'))
    persistLastStep('alarm', a?.title ?? 'Wecker', clockOf(a?.due_at))
    return
  }
  if (tool === 'timer') {
    const t = newest((await listReminders()).filter((r) => r.kind === 'timer'))
    persistLastStep('timer', t?.title ?? 'Timer', t?.due_at ?? '')
    return
  }
  if (tool === 'reminder') {
    const r = newest((await listReminders()).filter((x) => x.kind !== 'timer' && x.kind !== 'alarm'))
    persistLastStep('reminder', r?.title ?? '', r?.due_at ?? '')
    return
  }
  if (tool === 'todo') {
    const td = newest(await listTodos())
    persistLastStep('todo', td?.title ?? '', '')
    return
  }
  if (tool === 'shopping' || tool === 'birthday' || tool === 'home' || tool === 'leave' || tool === 'fan') {
    persistLastStep(tool)
    return
  }
  persistLastStep(tool)
}

async function rememberHit(hit: RouteHit, utterance = ''): Promise<void> {
  const tool = hit.lastTool
  if (!tool || tool === 'help' || tool === 'memory') return
  const preview = (hit.tool?.preview || '').trim()
  const medium =
    tool === 'tv'
      ? 'tv'
      : hit.tool?.action === 'music' || /spotify/i.test(preview)
        ? 'spotify'
        : tool === 'drive'
          ? 'drive'
          : ''
  if (preview) {
    const title = preview.split('·')[0].replace(/^Todo anlegen:\s*/i, '').trim()
    persistLastStep(tool, title, '', utterance)
    if (medium) saveSettings({ last_medium: medium })
    return
  }
  await rememberToolFromStore(tool)
  if (utterance) saveSettings({ last_step_utterance: utterance.slice(0, 160) })
  if (medium) saveSettings({ last_medium: medium })
}

async function attachResearchAudit(research: ResearchMeta | undefined, query: string): Promise<ResearchMeta | undefined> {
  if (!research) return undefined
  const audit = await addResearchAudit({
    id: crypto.randomUUID(),
    query: research.query || query.slice(0, 120),
    status: research.status || (research.used ? 'ok' : 'empty'),
    sources: (research.sources || []).map((s) => ({
      title: s.title,
      url: s.url,
      snippet: s.snippet,
      provider: s.provider,
    })),
    created_at: new Date().toISOString(),
  })
  return { ...research, audit_id: audit.id }
}

export async function streamChat(
  conversationId: string,
  content: string,
  handlers: StreamHandlers,
  opts?: { voice?: boolean },
): Promise<void> {
  const conv = await storeGet<Conversation>('conversations', conversationId)
  if (!conv) throw new Error('Gespräch nicht gefunden.')

  const userMessage = await addMessage(conversationId, 'user', content)
  const usingGemini = geminiReady()
  handlers.onMeta?.({
    user_message: userMessage,
    model: usingGemini ? GEMINI_LABEL : DEFAULT_MODEL.label,
    using_fallback: false,
    research: null,
  })

  try {
    const parts = splitIntents(normalizeUtterance(content))
    const texts = parts.map((p) => rewriteFollowUp(p, loadSettings()) ?? p)
    const routed: Array<RouteHit | null> = []
    for (const text of texts) {
      routed.push(await routeDeterministic(conversationId, text))
    }
    const found = routed.filter((h): h is RouteHit => Boolean(h))
    if (found.length && (found.length === routed.length || routed.length > 1)) {
      const replies = routed.map((h, i) =>
        h ? h.reply : `„${parts[i]}“ habe ich nicht als Befehl erkannt.`,
      )
      for (const hit of found) await rememberHit(hit, content)
      const last = found[found.length - 1]
      let research = last.research
      if (research) research = await attachResearchAudit(research, content)
      const joined = replies.join('\n\n')
      handlers.onToken?.(joined)
      const assistant = await addMessage(conversationId, 'assistant', joined, {
        tool: last.tool,
        research,
      })
      const updated = (await touchConversation(conversationId)) || conv
      handlers.onDone?.({
        assistant_message: assistant,
        conversation: updated,
        research: research || null,
        tool: last.tool || null,
      })
      return
    }

    if (opts?.voice && !geminiReady()) {
      if (groqReady()) {
        const history = await listMessages(conversationId)
        const mem = await listMemory()
        const system = [GEMINI_PERSONA, VOICE_HINT, memoryBlock(mem), lastStepHint()].filter(Boolean).join('\n\n')
        const llmMessages = [
          { role: 'system', content: system },
          ...history.slice(-16).map((m) => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content,
          })),
        ]
        let acc = ''
        const raw = await completeGroq(llmMessages, (_piece, full) => {
          acc = full
          handlers.onToken?.(_piece)
        })
        const final = scrubReply((raw || acc).trim())
        if (final !== (raw || acc)) handlers.onReplace?.(final)
        const assistant = await addMessage(conversationId, 'assistant', final)
        const updated = (await touchConversation(conversationId)) || conv
        handlers.onDone?.({ assistant_message: assistant, conversation: updated, tool: null })
        return
      }
      const reply =
        'Sprachmodus braucht Gemini. Unter Einstellungen an — das Handy-Modell ist dafür zu langsam.'
      handlers.onToken?.(reply)
      const assistant = await addMessage(conversationId, 'assistant', reply)
      const updated = (await touchConversation(conversationId)) || conv
      handlers.onDone?.({ assistant_message: assistant, conversation: updated, tool: null })
      return
    }

    if (!geminiReady()) {
      if (!isModelReady()) {
        throw new Error(
          'Lokales Modell ist aus. Unter Einstellungen starten — oder Gemini einschalten.',
        )
      }
    }

    const s = loadSettings()
    if (isLiveLookup(content)) {
      if (!s.research_opt_in) {
        const assistant = await addMessage(conversationId, 'assistant', RESEARCH_OFF_REPLY)
        const updated = (await touchConversation(conversationId)) || conv
        handlers.onDone?.({ assistant_message: assistant, conversation: updated, tool: null })
        return
      }
      if (!geminiReady()) {
        const filled = await fillResearchLinks(content, '', undefined)
        const research = (await attachResearchAudit(filled, researchQuery(content))) || filled
        persistLastStep('research')
        if (researchHasSources(research)) {
          const reply = formatResearchReply(
            researchQuery(content),
            research.sources || [],
            isProductLookup(content),
          )
          handlers.onReplace?.(reply)
          const assistant = await addMessage(conversationId, 'assistant', reply, { research })
          const updated = (await touchConversation(conversationId)) || conv
          handlers.onDone?.({ assistant_message: assistant, conversation: updated, research, tool: null })
          return
        }
        const assistant = await addMessage(conversationId, 'assistant', RESEARCH_NEEDS_GEMINI)
        const updated = (await touchConversation(conversationId)) || conv
        handlers.onDone?.({ assistant_message: assistant, conversation: updated, tool: null })
        return
      }
    }

    const history = await listMessages(conversationId)
    const mem = await listMemory()
    const wantSearch = Boolean(s.research_opt_in && isLiveLookup(content))
    let research: ResearchMeta | undefined
    if (wantSearch) {
      research = await fillResearchLinks(content, '', undefined)
    }
    const digest = wantSearch && researchHasSources(research) ? sourceDigest(research?.sources || []) : ''
    const system = geminiReady()
      ? [GEMINI_PERSONA, wantSearch ? SEARCH_ON_HINT : '', opts?.voice ? VOICE_HINT : '', memoryBlock(mem), lastStepHint()]
          .filter(Boolean)
          .join('\n\n')
      : [PERSONA, opts?.voice ? VOICE_HINT : '', memoryBlock(mem), lastStepHint()].filter(Boolean).join('\n\n')
    const llmMessages = [
      { role: 'system', content: system },
      ...history.slice(geminiReady() || opts?.voice ? -24 : -12).map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
    ]
    if (digest) {
      const last = llmMessages[llmMessages.length - 1]
      if (last && last.role === 'user') {
        last.content = `${last.content}\n\nTreffer (für die Antwort, nicht vorlesen):\n${digest}`
      }
    }

    let acc = ''
    const raw = geminiReady()
      ? await (opts?.voice ? streamGemini : completeGemini)(
          llmMessages,
          (_piece, full) => {
            acc = full
            handlers.onToken?.(_piece)
          },
          {
            search: wantSearch,
            maxOutputTokens: opts?.voice ? 220 : wantSearch ? 900 : undefined,
          },
        ).then((r) => {
          if (r.research?.sources?.length) {
            research = {
              ...(research || r.research),
              ...r.research,
              sources: [...(research?.sources || []), ...r.research.sources],
            }
          }
          return r.text
        })
      : await completeChat(llmMessages, (_piece, full) => {
          acc = full
          handlers.onToken?.(_piece)
        })

    let text = (raw || acc).trim()
    if (wantSearch) {
      const filled = await fillResearchLinks(content, text, research)
      research = (await attachResearchAudit(filled, researchQuery(content))) || filled
      persistLastStep('research')
      const product = isProductLookup(content)
      const sources = research.sources || []
      const weak = !text || isSearchRefusal(text)
      if (weak && researchHasSources(research)) {
        text = formatResearchReply(researchQuery(content), sources, product)
        handlers.onReplace?.(text)
      } else if (!text && !researchHasSources(research)) {
        const empty = RESEARCH_EMPTY
        handlers.onReplace?.(empty)
        const assistant = await addMessage(conversationId, 'assistant', empty, { research })
        const updated = (await touchConversation(conversationId)) || conv
        handlers.onDone?.({
          assistant_message: assistant,
          conversation: updated,
          research,
          tool: null,
        })
        return
      } else if (product && researchHasSources(research) && text && !parseEuroPrices(text).length) {
        const extra = formatResearchReply(researchQuery(content), sources, true)
        if (/€/.test(extra) && extra !== text) {
          text = `${text.replace(/\s+$/, '')} ${extra}`
          handlers.onReplace?.(text)
        }
      }
    }

    const final = scrubReply(text, { searched: Boolean(researchHasSources(research) || wantSearch) })
    if (final !== text) handlers.onReplace?.(final)
    if (research && !research.audit_id) research = await attachResearchAudit(research, content)
    if (isLiveLookup(content) && !wantSearch) persistLastStep('research')
    const assistant = await addMessage(conversationId, 'assistant', final, research ? { research } : undefined)
    const updated = (await touchConversation(conversationId)) || conv
    handlers.onDone?.({
      assistant_message: assistant,
      conversation: updated,
      guarded: final !== (raw || acc),
      research: research || null,
      tool: null,
    })
  } catch (err) {
    const raw = err instanceof Error ? err.message : 'Chat fehlgeschlagen'
    const detail = geminiReady() ? userFacingCloudError(raw, groqReady()) : raw
    handlers.onError?.(detail)
    throw new Error(detail)
  }
}

export const conversations = {
  list: storeListConv,
  create: storeCreate,
  delete: storeDelete,
}
