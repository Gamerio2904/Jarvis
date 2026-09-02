import { listMemory, listReminders, loadSettings, getPending } from './store.ts'
import { geminiReady } from './gemini.ts'
import { groqReady } from './groq.ts'
import { isModelReady } from './llm.ts'
import { organLabel, type BodyOrgan } from './hud-parse.ts'
import { sanitizePcHost } from './pc-host.ts'

export type BodySnap = Record<BodyOrgan, { live: boolean; line: string }>

export async function fetchBodySnap(opts: { busy: boolean; conversationId: string | null }): Promise<BodySnap> {
  const s = loadSettings()
  const mem = await listMemory()
  const rems = await listReminders()
  const nextRem = rems
    .filter((r) => r.status !== 'done' && r.due_at)
    .sort((a, b) => String(a.due_at).localeCompare(String(b.due_at)))[0]
  const pending = opts.conversationId ? await getPending(opts.conversationId) : undefined
  const taxi = Boolean(s.last_taxi_json)
  const pcHost = sanitizePcHost(s.pc_host || '')
  const pcOn = Boolean(s.pc_enabled && pcHost && s.pc_token)
  const local = isModelReady()
  const gemini = geminiReady()
  const groq = groqReady()
  const brainLine = gemini
    ? `Gemini zuerst · Face ${s.face === 'friday' ? 'Friday' : 'Jarvis'}${opts.busy ? ' · denkt' : ''}.`
    : groq
      ? `Groq-Backup · Face ${s.face === 'friday' ? 'Friday' : 'Jarvis'}${opts.busy ? ' · denkt' : ''}.`
      : local
        ? `Lokal 0,5B · Face ${s.face === 'friday' ? 'Friday' : 'Jarvis'}${opts.busy ? ' · denkt' : ''}.`
        : 'Hirn nicht bereit. Gemini-Key, Groq oder Modell laden.'
  const eyeLine = s.last_eye_line || (gemini ? 'Kein Foto gelesen.' : 'Auge braucht Gemini oder ein Foto.')
  const write = s.last_step_tool || ''
  const handLine = pending
    ? `Nachfrage offen (${pending.tool}). Bestellt habe ich nicht.`
    : taxi && /taxi/i.test(s.last_taxi_json)
      ? 'Letzte Taxi-Kette: Bestellt habe ich nicht, bis Sie Ja sagen.'
      : write
        ? `Zuletzt: ${write}.`
        : 'Noch keine Schreib-Aktion.'
  const earLine = s.wake_word ? 'Wake an.' : 'Wake aus.'
  const mouthLine =
    s.voice_tts === 'system' || s.voice_tts === 'native'
      ? 'Mund: System-TTS.'
      : s.voice_tts === 'gemini'
        ? `Mund: ${s.face === 'friday' ? 'Kore' : 'Algieba'} (Gemini), Edge wenn Gemini fehlt.`
        : `Mund: Edge ${s.face === 'friday' ? 'Katja' : 'Conrad'} im Rennen mit ${s.face === 'friday' ? 'Kore' : 'Algieba'}.`
  const memLine = `${mem.length} gemerkt` + (nextRem ? ` · nächste Erinnerung ${nextRem.title || ''}`.trim() : '.')
  const pcEye = pcOn ? 'PC verbunden. Screenshot auf Nachfrage.' : 'PC nicht verbunden.'
  const pcHand = pcOn ? 'PC-Hand bereit (Klick, FIFA, Ordner).' : 'PC nicht verbunden.'
  return {
    brain: { live: opts.busy || local || gemini || groq, line: brainLine },
    eye: { live: Boolean(s.last_eye_line), line: eyeLine },
    hand: { live: Boolean(pending || write), line: handLine },
    ear: { live: Boolean(s.wake_word), line: earLine },
    mouth: { live: true, line: mouthLine },
    memory: { live: mem.length > 0, line: memLine },
    pc_eye: { live: pcOn, line: pcEye },
    pc_hand: { live: pcOn, line: pcHand },
  }
}

export { organLabel }
