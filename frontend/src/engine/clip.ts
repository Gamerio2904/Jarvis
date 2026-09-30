/** Handy entscheidet, PC schneidet. Titel gehen nur als JSON an den PC, nie in eine Shell. */

import { completeGeminiVision, geminiReady } from './gemini.ts'
import { completeGroq, groqReady } from './groq.ts'
import { isCommNo, isCommYes } from './places-parse.ts'
import { callPc } from './pc.ts'
import { loadSettings, saveSettings } from './store.ts'
import { confirmReply, parseClipIntent, type ClipCut } from './clip-parse.ts'
import {
  acceptSegments,
  parseRankJson,
  rankPrompt,
  wordsToSentences,
  type ClipWord,
} from './clip-rank.ts'

const TTL_MS = 30 * 60 * 1000

type ClipConfirm = { kind: 'confirm'; urls: string[]; titles: Record<string, string>; at: number }
type ClipJob = { kind: 'job'; id: string; at: number; titles: string[] }
type Pending = ClipConfirm | ClipJob

type Hit = {
  handled: boolean
  reply?: string
  lastTool?: string
  tool?: { tool_status: 'executed'; tool: 'clip'; action: string; label: string }
}

type Ranked = { url: string; start: number; end: number; title: string; words: ClipWord[]; n: number }

function hit(reply: string, action: string): Hit {
  return {
    handled: true,
    reply,
    lastTool: 'clip',
    tool: { tool_status: 'executed', tool: 'clip', action, label: 'YouTube' },
  }
}

function readPending(): Pending | null {
  try {
    const raw = loadSettings().last_clip_json
    if (!raw) return null
    const parsed = JSON.parse(raw) as Pending
    if (!parsed || (parsed.kind !== 'confirm' && parsed.kind !== 'job')) return null
    if (Date.now() - Number(parsed.at || 0) > TTL_MS) {
      saveSettings({ last_clip_json: '' })
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function writePending(pending: Pending | null): void {
  saveSettings({ last_clip_json: pending ? JSON.stringify(pending) : '', last_step_tool: pending ? 'clip' : '' })
}

export function cleanVisionTitle(raw: string, index: number): string {
  const words = String(raw || '')
    .replace(/[#*_`"]/g, ' ')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5)
  if (words.length < 2) return `Abschnitt ${index}`
  return words.join(' ')
}

function pcLine(raw: Record<string, unknown>): string {
  const tool = String(raw.tool || '')
  const message = String(raw.message || '')
  if (tool) return message || `${tool} fehlt.`
  if (/nicht erreicht|PC-Steuerung aus|Keine PC-IP|Kein Token|Firewall|Gäste-Netz/i.test(message)) {
    return 'PC-Fenster ist zu.'
  }
  return message || 'PC-Fenster ist zu.'
}

function asWords(raw: unknown): ClipWord[] {
  if (!Array.isArray(raw)) return []
  const out: ClipWord[] = []
  for (const row of raw) {
    if (!Array.isArray(row)) continue
    const word: ClipWord = { t: Number(row[0]), d: Number(row[1]), w: String(row[2] || '') }
    if (Number.isFinite(word.t) && Number.isFinite(word.d) && word.w) out.push(word)
  }
  return out
}

function givenTitle(titles: Record<string, string>, n: number): string {
  return String(titles[n] || titles[String(n)] || '').trim().slice(0, 80)
}

async function sayStatus(pending: Pending | null): Promise<Hit> {
  const raw = await callPc('/v1/clip', { action: 'status' }, 8_000)
  if (raw.ok === false) return hit(pcLine(raw), 'status')
  const phase = String(raw.phase || 'idle')
  const jobId = String(raw.jobId || '')
  if (pending?.kind === 'job' && (phase === 'idle' || (jobId && jobId !== pending.id))) {
    writePending(null)
    return hit('PC neu gestartet, Job weg.', 'status')
  }
  if (phase === 'idle') return hit('Kein Schnitt läuft.', 'status')
  if (phase === 'done') {
    writePending(null)
    const file = String(raw.path || raw.message || '')
    return hit(file ? `Liegt unter ${file}.` : 'Schnitt fertig.', 'status')
  }
  if (phase === 'error') {
    writePending(null)
    return hit(pcLine(raw), 'status')
  }
  const titles = Array.isArray(raw.titles) ? raw.titles.filter(Boolean).join(', ') : ''
  return hit(titles ? `Schneide ${titles}.` : String(raw.message || 'Schneide.'), 'status')
}

async function runCut(pending: ClipConfirm): Promise<Hit> {
  if (!groqReady()) return hit('Kein Groq-Schlüssel. Ohne den wähle ich die Stellen nicht.', 'rank')
  const probe = await callPc('/v1/clip', { action: 'probe', urls: pending.urls }, 50_000)
  if (probe.ok === false) return hit(pcLine(probe), 'probe')
  const videos = Array.isArray(probe.videos) ? probe.videos : []
  if (!videos.length) return hit('Dazu fehlen Wortzeiten.', 'probe')

  const blocks: Array<{ title: string; sentences: ReturnType<typeof wordsToSentences> }> = []
  const packed: Array<{ url: string; title: string; duration: number; words: ClipWord[] }> = []
  for (const row of videos) {
    const video = row as { url?: string; title?: string; duration?: number; words?: unknown }
    const words = asWords(video.words)
    const sentences = wordsToSentences(words)
    if (!sentences.length) return hit('Dazu fehlen Wortzeiten.', 'probe')
    const title = String(video.title || 'Highlights').slice(0, 80)
    blocks.push({ title, sentences })
    packed.push({ url: String(video.url || ''), title, duration: Number(video.duration) || 0, words })
  }

  let ranked: Array<{ url: number; start: number; end: number; quote: string }> = []
  try {
    const text = await completeGroq([{ role: 'user', content: rankPrompt(blocks) }])
    ranked = parseRankJson(text)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Groq antwortet nicht.'
    return hit(message, 'rank')
  }

  const oneBased = ranked.length > 0 && ranked.every((row) => row.url >= 1 && row.url <= packed.length)
  const chosen: Ranked[] = []
  for (let i = 0; i < packed.length; i += 1) {
    const video = packed[i]
    const idx = oneBased ? i + 1 : i
    const rows = ranked.filter((row) => row.url === idx)
    const accepted = acceptSegments(rows, video.words, video.duration)
    for (const range of accepted) {
      if (chosen.length >= 3) break
      chosen.push({
        url: video.url,
        start: range.start,
        end: range.end,
        title: '',
        n: chosen.length + 1,
        words: video.words.filter((word) => word.t >= range.start - 0.05 && word.t < range.end + 0.05),
      })
    }
  }
  if (!chosen.length) return hit('Keine Stelle im erlaubten Fenster.', 'rank')

  for (const seg of chosen) seg.title = givenTitle(pending.titles, seg.n)
  const missing = chosen.filter((seg) => !seg.title)
  if (missing.length && geminiReady()) {
    const frames = await callPc(
      '/v1/clip',
      { action: 'frames', shots: missing.map((seg) => ({ url: seg.url, t: seg.start + 2 })) },
      120_000,
    )
    if (frames.ok === false && frames.tool) return hit(pcLine(frames), 'frames')
    const shots = Array.isArray(frames.frames) ? frames.frames : []
    for (let i = 0; i < missing.length; i += 1) {
      const shot = shots[i] as { image?: string; mime?: string } | undefined
      if (!shot?.image) {
        missing[i].title = `Abschnitt ${missing[i].n}`
        continue
      }
      try {
        const text = await completeGeminiVision(
          'Benenne nur das Sichtbare in zwei bis fünf deutschen Wörtern. Kein Satz, keine Hashtags.',
          shot.image,
          String(shot.mime || 'image/jpeg'),
        )
        missing[i].title = cleanVisionTitle(text, missing[i].n)
      } catch {
        missing[i].title = `Abschnitt ${missing[i].n}`
      }
    }
  }
  for (const seg of chosen) {
    if (!seg.title) seg.title = `Abschnitt ${seg.n}`
  }

  const render = await callPc(
    '/v1/clip',
    {
      action: 'render',
      theme: packed[0]?.title || 'Highlights',
      segments: chosen.map((seg) => ({
        url: seg.url,
        start: seg.start,
        end: seg.end,
        title: seg.title,
        words: seg.words.map((word) => [word.t, word.d, word.w]),
      })),
    },
    12_000,
  )
  if (render.ok === false) return hit(pcLine(render), 'render')
  const jobId = String(render.jobId || '')
  if (!jobId) return hit('Schnitt hat keine Nummer.', 'render')
  const titles = chosen.map((seg) => seg.title)
  writePending({ kind: 'job', id: jobId, at: Date.now(), titles })
  return hit(`Schneide ${titles.join(', ')}. Sag Clip-Status.`, 'render')
}

export async function handleClip(_conversationId: string, text: string): Promise<Hit> {
  const pending = readPending()
  const intent = parseClipIntent(text)
  if (intent?.kind === 'status') return sayStatus(pending)
  if (pending?.kind === 'confirm' && isCommNo(text)) {
    writePending(null)
    return hit('Abgebrochen.', 'confirm')
  }
  if (pending?.kind === 'confirm' && isCommYes(text)) return runCut(pending)
  if (intent?.kind === 'cut') return arm(intent)
  return { handled: false }
}

function arm(intent: ClipCut): Hit {
  writePending({ kind: 'confirm', urls: intent.urls, titles: intent.titles, at: Date.now() })
  return hit(confirmReply(intent.urls.length), 'confirm')
}
