import { ensureModel, getDownloadProgress, getLlmError, hasCachedModel, isModelReady, releaseModel } from './llm'
import { completeGemini, geminiReady, streamGemini, testGemini } from './gemini'
import { groqReady, testGroq } from './groq'
import { brainKind, brainLabel, completeBrain, noBrainLine } from './brain'
import { userFacingCloudError } from './cloud-errors'
import { HELP_TEXT, isHelpCommand, isPersonaAsk, PERSONA_ASK_TEXT, scrubReply } from './guards'
import { memoryBlock } from './memory'
import { rewriteFollowUp } from './last-step'
import { promoteSplitPart, splitIntents } from './split-intents'
import { normalizeUtterance } from './utterance.ts'
import { SEARCH_ON_HINT, VOICE_HINT, personaPack } from './persona'
import { loadFace } from './face.ts'
import {
  formatResearchReply,
  guardResearchReply,
  isKnowledgeGap,
  isLiveLookup,
  isProductLookup,
  parseEuroPrices,
  parseShopDiscountIntent,
  RESEARCH_EMPTY,
  RESEARCH_NEEDS_GEMINI,
  RESEARCH_OFF_REPLY,
  researchHasSources,
  researchQuery,
  shouldRetrySearch,
  sourceDigest,
  type ResearchMeta,
} from './research-parse'
import { fillResearchLinks } from './web-search'
import { debugPayload } from './chat-debug'
import {
  APP_VERSION,
  DEFAULT_MODEL,
  SHARP_MODEL,
  activeModel,
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
import { handlePlaces } from './places'
import { handlePc } from './pc'
import { handleTaxi } from './taxi'
import { handleInterrupt } from './interrupt'
import { clearChain, partitionChain, popChain, writeChain } from './chain'
import { isCommNo, isCommYes } from './places-parse'
import { handleTvOrdinal, tvStatusFromSettings } from './tv'
import { handleFuelOrdinal } from './fuel'
import { handlePoiOrdinal } from './poi'
import { parseOrdinalFollowUp, rewriteOrdinal } from './ordinal'
import { type ToolMeta } from './tools'
import { routeRegistry, type RouteHit } from './registry'

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

export async function getHealth() {
  const mem = await listMemory()
  const kind = brainKind()
  const localReady = isModelReady()
  const cloud = kind === 'gemini'
  const ready = kind !== 'none'
  const err = getLlmError()
  const prog = getDownloadProgress()
  const s = loadSettings()
  const active = activeModel()
  const reason = blockedReason(localReady)
  const online = isOnline()
  const block = blockedCopy(reason, online)
  return {
    ok: ready,
    ollama: false,
    engine: kind === 'gemini' ? 'gemini' : kind === 'groq' ? 'groq' : 'on-device',
    model: brainLabel(kind),
    model_ready: localReady,
    gemini_ready: cloud,
    gemini_enabled: s.gemini_enabled,
    configured_model: brainLabel(kind),
    fallback_model: groqReady() ? 'Groq, dann 0.5B' : DEFAULT_MODEL.label,
    model_heavy: DEFAULT_MODEL.label,
    heavy_equals_default: kind !== 'gemini',
    using_fallback: kind === 'groq' || kind === 'local',
    version: APP_VERSION,
    memory_count: mem.length,
    research_opt_in: s.research_opt_in,
    blocked_reason: !online ? 'offline' : reason,
    tv: tvStatusFromSettings(),
    warning:
      kind === 'gemini'
        ? groqReady()
          ? 'Gemini zuerst — bei Limit Groq, sonst 0,5B. Chat geht ins Netz.'
          : 'Gemini (Google) zuerst. Chat geht ins Netz.'
        : kind === 'groq'
          ? 'Groq-Backup. Gemini aus oder ohne Key.'
          : kind === 'local'
            ? 'On-Device 0,5B — Backup, kein Server.'
            : err || 'Kein Hirn. Gemini-Key, Groq-Key oder Modell laden.',
    error: ready
      ? undefined
      : s.gemini_enabled && !s.gemini_api_key.trim()
        ? 'Gemini an, aber kein API-Key. Groq oder lokales Modell als Backup.'
        : err || noBrainLine(),
    download_pct: prog.pct,
    n_threads: getThreadCount(),
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
  if (isHelpCommand(content) || isHelpCommand(normalizeUtterance(content))) {
    return {
      reply: HELP_TEXT,
      lastTool: 'help',
      tool: { tool_status: 'executed', tool: 'help', action: 'catalog', label: 'Hilfe' },
    }
  }

  if (isPersonaAsk(content) || isPersonaAsk(normalizeUtterance(content))) {
    return {
      reply: PERSONA_ASK_TEXT,
      lastTool: 'identity',
      tool: { tool_status: 'executed', tool: 'identity', action: 'who', label: 'Jarvis' },
    }
  }

  const refuse = hardRefuse(content)
  if (refuse) return { reply: refuse, lastTool: 'refuse' }

  const homeHitEarly = await handleHome(conversationId, content)
  if (homeHitEarly.handled && homeHitEarly.reply) {
    return { reply: homeHitEarly.reply, tool: homeHitEarly.tool, lastTool: homeHitEarly.lastTool || 'home' }
  }

  const speakerHit = await handleSpeaker(conversationId, content)
  if (speakerHit.handled && speakerHit.reply) {
    return { reply: speakerHit.reply, tool: speakerHit.tool, lastTool: 'speaker' }
  }

  const step = loadSettings().last_step_tool
  if (step === 'leave_ask' || step === 'leave_ask_city') {
    const leavePending = await handleLeave(conversationId, content)
    if (leavePending.handled && leavePending.reply) {
      return { reply: leavePending.reply, tool: leavePending.tool, lastTool: leavePending.lastTool || 'leave' }
    }
  }
  if (step === 'drive_ask_city' || step === 'drive_ask_far') {
    const drivePending = await handleDrive(conversationId, content)
    if (drivePending.handled && drivePending.reply) {
      return { reply: drivePending.reply, tool: drivePending.tool, lastTool: drivePending.lastTool || 'drive' }
    }
  }

  if (loadSettings().last_comm_json) {
    const pendingHit = await handlePlaces(conversationId, content)
    if (pendingHit.handled && pendingHit.reply) {
      return {
        reply: pendingHit.reply,
        tool: pendingHit.tool,
        lastTool: pendingHit.lastTool || 'maps',
      }
    }
  }

  if (loadSettings().last_cal_json) {
    const calPending = await handleCalendar(conversationId, content)
    if (calPending.handled && calPending.reply) {
      return {
        reply: calPending.reply,
        tool: calPending.tool,
        lastTool: 'calendar',
      }
    }
  }

  if (loadSettings().last_pc_json) {
    const pcPending = await handlePc(conversationId, content)
    if (pcPending.handled && pcPending.reply) {
      return {
        reply: pcPending.reply,
        tool: pcPending.tool,
        lastTool: pcPending.lastTool || 'pc',
      }
    }
  }

  if (loadSettings().last_taxi_json) {
    const taxiPending = await handleTaxi(conversationId, content)
    if (taxiPending.handled && taxiPending.reply) {
      return {
        reply: taxiPending.reply,
        tool: taxiPending.tool,
        lastTool: taxiPending.lastTool || 'taxi',
      }
    }
  }

  if (loadSettings().last_interrupt_json) {
    const interruptHit = await handleInterrupt(conversationId, content)
    if (interruptHit.handled && interruptHit.reply) {
      return {
        reply: interruptHit.reply,
        tool: interruptHit.tool,
        lastTool: interruptHit.lastTool || 'interrupt',
      }
    }
  }

  if (loadSettings().last_step_tool === 'chain_ask') {
    if (isCommNo(content)) {
      clearChain()
      saveSettings({ last_step_tool: '' })
      return { reply: 'Kette verworfen.', lastTool: 'taxi' }
    }
    if (isCommYes(content)) {
      saveSettings({ last_step_tool: '' })
      const next = popChain()
      if (next) return routeDeterministic(conversationId, next)
      return { reply: 'Nichts mehr in der Kette.', lastTool: 'taxi' }
    }
  }

  const discountToggle = parseShopDiscountIntent(content)
  if (discountToggle) {
    saveSettings({ shop_discount: discountToggle.on })
    return {
      reply: discountToggle.on
        ? 'Rabatt-Suche an. Bei Produktsuche extra Gutscheine (mydealz/Sparwelt). Internet-Research muss an sein. Keine erfundenen Codes.'
        : 'Rabatt-Suche aus. Produktsuche bleibt Preisvergleich ohne extra Gutschein-Jagd.',
      lastTool: 'research',
    }
  }

  const ord = parseOrdinalFollowUp(content)
  if (ord) {
    const s = loadSettings()
    if (s.last_step_tool === 'tv') {
      const tvPick = await handleTvOrdinal(ord.index)
      if (tvPick.handled && tvPick.reply) {
        return {
          reply: tvPick.reply,
          tool: { tool_status: 'executed', tool: 'tv', action: 'ok', label: 'TV' },
          lastTool: 'tv',
        }
      }
    }
    if (s.last_step_tool === 'fuel') {
      const fuelPick = await handleFuelOrdinal(ord.index)
      if (fuelPick.handled && fuelPick.reply) {
        return {
          reply: fuelPick.reply,
          tool: fuelPick.tool,
          lastTool: 'fuel',
          research: fuelPick.research,
        }
      }
    }
    if (s.last_step_tool === 'poi') {
      const poiPick = await handlePoiOrdinal(ord.index)
      if (poiPick.handled && poiPick.reply) {
        return {
          reply: poiPick.reply,
          tool: poiPick.tool,
          lastTool: 'poi',
        }
      }
    }
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

  return routeRegistry(conversationId, content)
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
  if (tool === 'shopping' || tool === 'birthday' || tool === 'home' || tool === 'leave' || tool === 'fan' || tool === 'plug') {
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
        : tool === 'drive' || tool === 'fuel' || tool === 'poi'
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
  const kind = brainKind()
  handlers.onMeta?.({
    user_message: userMessage,
    model: brainLabel(kind),
    using_fallback: kind === 'groq' || kind === 'local',
    research: null,
  })

  try {
    const rawParts = splitIntents(normalizeUtterance(content))
    const parts = rawParts.length > 1 ? rawParts.map(promoteSplitPart) : rawParts
    let queue = parts
    if (parts.length > 1) {
      const { reads, writes } = partitionChain(parts)
      writeChain(writes.slice(1))
      queue = writes.length ? [...reads, writes[0]] : reads
    }
    const texts = queue.map((p) => rewriteFollowUp(p, loadSettings()) ?? p)
    const routed: Array<RouteHit | null> = []
    for (const text of texts) {
      routed.push(await routeDeterministic(conversationId, text))
    }
    const found = routed.filter((h): h is RouteHit => Boolean(h))
    if (found.length && (found.length === routed.length || routed.length > 1)) {
      const replies = routed.map((h, i) =>
        h ? h.reply : `„${queue[i]}“ habe ich nicht als Befehl erkannt.`,
      )
      for (const hit of found) await rememberHit(hit, content)
      const last = found[found.length - 1]
      let research = last.research
      if (research) research = await attachResearchAudit(research, content)
      const joined = replies.join('\n\n')
      handlers.onToken?.(joined)
      const assistant = await addMessage(
        conversationId,
        'assistant',
        joined,
        debugPayload({
          route: last.lastTool || 'tool',
          model: 'deterministic',
          gemini: false,
          tool: last.tool,
          research,
          final: joined,
          routes: found.map((h) => h.lastTool || ''),
          missed: routed.map((h, i) => (h ? '' : parts[i])).filter(Boolean),
        }),
      )
      const updated = (await touchConversation(conversationId)) || conv
      handlers.onDone?.({
        assistant_message: assistant,
        conversation: updated,
        research: research || null,
        tool: last.tool || null,
      })
      return
    }

    if (opts?.voice && kind === 'none') {
      const reply =
        'Befehl nicht erkannt. Smalltalk braucht Gemini, Groq oder das lokale Modell. Wetter, Timer, Route, Einkauf gehen ohne.'
      handlers.onToken?.(reply)
      const assistant = await addMessage(
        conversationId,
        'assistant',
        reply,
        debugPayload({
          route: 'voice-fallback',
          model: 'none',
          gemini: false,
          voice: true,
          final: reply,
        }),
      )
      const updated = (await touchConversation(conversationId)) || conv
      handlers.onDone?.({ assistant_message: assistant, conversation: updated, tool: null })
      return
    }

    if (kind === 'none') {
      throw new Error(noBrainLine())
    }

    const s = loadSettings()
    const discount = Boolean(s.shop_discount)
    const live = isLiveLookup(content, discount)
    if (live && !geminiReady()) {
      if (!s.research_opt_in) {
        const assistant = await addMessage(
          conversationId,
          'assistant',
          RESEARCH_OFF_REPLY,
          debugPayload({
            route: 'research',
            model: 'deterministic',
            gemini: false,
            final: RESEARCH_OFF_REPLY,
          }),
        )
        const updated = (await touchConversation(conversationId)) || conv
        handlers.onDone?.({ assistant_message: assistant, conversation: updated, tool: null })
        return
      }
      const filled = await fillResearchLinks(content, '', undefined)
      const research = (await attachResearchAudit(filled, researchQuery(content))) || filled
      persistLastStep('research')
      if (researchHasSources(research)) {
        const reply = formatResearchReply(
          researchQuery(content),
          research.sources || [],
          isProductLookup(content, discount),
          discount,
        )
        handlers.onReplace?.(reply)
        const assistant = await addMessage(
          conversationId,
          'assistant',
          reply,
          debugPayload({
            route: 'research',
            model: 'deterministic',
            gemini: false,
            research,
            final: reply,
          }),
        )
        const updated = (await touchConversation(conversationId)) || conv
        handlers.onDone?.({ assistant_message: assistant, conversation: updated, research, tool: null })
        return
      }
      const assistant = await addMessage(
        conversationId,
        'assistant',
        RESEARCH_NEEDS_GEMINI,
        debugPayload({
          route: 'research',
          model: 'deterministic',
          gemini: false,
          research,
          final: RESEARCH_NEEDS_GEMINI,
        }),
      )
      const updated = (await touchConversation(conversationId)) || conv
      handlers.onDone?.({ assistant_message: assistant, conversation: updated, tool: null })
      return
    }

    const history = await listMessages(conversationId)
    const mem = await listMemory()
    let wantSearch = Boolean(geminiReady() && live)
    let research: ResearchMeta | undefined
    let acc = ''
    let raw = ''
    let text = ''

    for (let pass = 0; pass < 2; pass++) {
      if (wantSearch && !researchHasSources(research)) {
        research = await fillResearchLinks(content, '', research)
      }
      const digest = wantSearch && researchHasSources(research) ? sourceDigest(research?.sources || []) : ''
      const pack = personaPack(loadFace())
      const cloud = kind === 'gemini' || kind === 'groq'
      const system = cloud
        ? [pack.gemini, wantSearch ? SEARCH_ON_HINT : '', opts?.voice ? VOICE_HINT : '', memoryBlock(mem, content), lastStepHint()]
            .filter(Boolean)
            .join('\n\n')
        : [pack.local, opts?.voice ? VOICE_HINT : '', memoryBlock(mem, content), lastStepHint()].filter(Boolean).join('\n\n')
      const llmMessages = [
        { role: 'system', content: system },
        ...history.slice(cloud || opts?.voice ? -12 : -8).map((m) => ({
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

      acc = ''
      raw = ''
      try {
        raw = kind === 'gemini'
          ? await (opts?.voice || !wantSearch ? streamGemini : completeGemini)(
              llmMessages,
              (_piece, full) => {
                acc = full
                handlers.onToken?.(_piece)
              },
              {
                search: wantSearch,
                maxOutputTokens: opts?.voice ? 420 : wantSearch ? 900 : 420,
                timeoutMs: wantSearch ? 12_000 : 8_000,
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
          : (
              await completeBrain(
                llmMessages,
                (_piece, full) => {
                  acc = full
                  handlers.onToken?.(_piece)
                },
                {
                  search: wantSearch,
                  maxOutputTokens: opts?.voice ? 420 : 420,
                  timeoutMs: 8_000,
                  voice: opts?.voice,
                },
              )
            ).text
      } catch (err) {
        if (!wantSearch || !researchHasSources(research)) throw err
        raw = ''
      }

      text = (raw || acc).trim()
      if (wantSearch) {
        const filled = await fillResearchLinks(content, text, research)
        research = (await attachResearchAudit(filled, researchQuery(content))) || filled
        persistLastStep('research')
        const product = isProductLookup(content, discount)
        const sources = research.sources || []
        const weak = !text || isKnowledgeGap(text)
        if (weak && researchHasSources(research)) {
          text = formatResearchReply(researchQuery(content), sources, product, discount)
          handlers.onReplace?.(text)
        } else if (!text && !researchHasSources(research)) {
          const empty = RESEARCH_EMPTY
          handlers.onReplace?.(empty)
          const assistant = await addMessage(
            conversationId,
            'assistant',
            empty,
            debugPayload({
              route: 'research',
              model: geminiReady() ? GEMINI_LABEL : DEFAULT_MODEL.label,
              gemini: geminiReady(),
              research,
              final: empty,
            }),
          )
          const updated = (await touchConversation(conversationId)) || conv
          handlers.onDone?.({
            assistant_message: assistant,
            conversation: updated,
            research,
            tool: null,
          })
          return
        } else if (product && researchHasSources(research) && text && !parseEuroPrices(text).length) {
          const extra = formatResearchReply(researchQuery(content), sources, true, discount)
          if (/€/.test(extra) && extra !== text) {
            text = `${text.replace(/\s+$/, '')} ${extra}`
            handlers.onReplace?.(text)
          }
        } else if (!product && text) {
          const guarded = guardResearchReply(researchQuery(content), text, sources)
          if (guarded !== text) {
            text = guarded
            handlers.onReplace?.(text)
          }
        }
      }

      if (pass === 0 && kind === 'gemini' && !wantSearch && shouldRetrySearch(content, text, discount)) {
        wantSearch = true
        continue
      }
      if (pass === 1 && text) handlers.onReplace?.(text)
      break
    }

    const final = scrubReply(text, { searched: Boolean(researchHasSources(research) || wantSearch) })
    if (final !== text) handlers.onReplace?.(final)
    if (research && !research.audit_id) research = await attachResearchAudit(research, content)
    if (isLiveLookup(content, discount) && !wantSearch) persistLastStep('research')
    const assistant = await addMessage(
      conversationId,
      'assistant',
      final,
      debugPayload({
        route: 'llm',
        model: geminiReady() ? GEMINI_LABEL : DEFAULT_MODEL.label,
        gemini: geminiReady(),
        voice: Boolean(opts?.voice),
        research,
        raw: text,
        final,
      }),
    )
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
    const detail = kind === 'gemini' || kind === 'groq' ? userFacingCloudError(raw, groqReady()) : raw
    handlers.onError?.(detail)
    throw new Error(detail)
  }
}

export const conversations = {
  list: storeListConv,
  create: storeCreate,
  delete: storeDelete,
}
