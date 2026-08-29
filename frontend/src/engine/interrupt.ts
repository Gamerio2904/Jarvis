import { loadSettings, saveSettings } from './store.ts'
import type { ToolMeta } from './tools.ts'
import { isCommNo, isCommYes } from './places-parse.ts'
import { parseDriveIntent } from './drive-parse.ts'
import { parseFuelIntent } from './fuel-parse.ts'
import { parsePoiIntent } from './poi-parse.ts'

export type InterruptKind = 'plug' | 'calendar' | 'outlook'

export type PendingInterrupt = {
  id: string
  kind: InterruptKind
  question: string
  fingerprint: string
  at: number
}

type InterruptHit = {
  handled: boolean
  reply?: string
  tool?: ToolMeta
  lastTool?: string
}

const listeners = new Set<() => void>()

export function subscribeInterrupt(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function emit() {
  for (const cb of listeners) {
    try {
      cb()
    } catch {
      /* */
    }
  }
}

export function digitsTel(raw: string): string {
  return (raw || '').replace(/\D+/g, '')
}

/** Call the second phone only when opt-in, number set, and not this device. Never self-call. */
export function shouldCallSecondPhone(opts?: {
  mode?: string
  second?: string
  own?: string
}): boolean {
  const s = loadSettings()
  const mode = ((opts?.mode ?? s.drive_interrupt) || 'hud').toLowerCase()
  if (mode !== 'call') return false
  const second = digitsTel(opts?.second ?? s.drive_second_tel)
  const own = digitsTel(opts?.own ?? s.own_tel)
  if (second.length < 6) return false
  if (!own) return false
  if (second === own) return false
  return true
}

export function readInterrupt(): PendingInterrupt | null {
  try {
    const raw = loadSettings().last_interrupt_json
    if (!raw) return null
    const p = JSON.parse(raw) as PendingInterrupt
    if (!p?.question) return null
    return p
  } catch {
    return null
  }
}

export function clearInterrupt() {
  saveSettings({ last_interrupt_json: '', last_step_tool: '' })
  emit()
}

export async function raiseInterrupt(opts: {
  kind: InterruptKind
  question: string
  fingerprint: string
}): Promise<PendingInterrupt> {
  const pending: PendingInterrupt = {
    id: `int-${Date.now()}`,
    kind: opts.kind,
    question: opts.question.slice(0, 220),
    fingerprint: opts.fingerprint,
    at: Date.now(),
  }
  saveSettings({
    last_interrupt_json: JSON.stringify(pending),
    last_step_tool: 'interrupt',
  })
  emit()
  const { notifyIdFromKey, requestNotifyPermission, scheduleNotify } = await import('../native/notify.ts')
  const ok = await requestNotifyPermission()
  if (ok) {
    await scheduleNotify({
      id: notifyIdFromKey('drive-interrupt'),
      title: 'Jarvis',
      body: pending.question,
      at: new Date(Date.now() + 400),
      alarm: true,
      mode: 'speak',
      say: pending.question,
    })
  }
  if (shouldCallSecondPhone()) {
    const tel = loadSettings().drive_second_tel
    const { placeCall } = await import('../native/device.ts')
    await placeCall(tel)
  }
  return pending
}

export async function handleInterrupt(_conversationId: string, text: string): Promise<InterruptHit> {
  const pending = readInterrupt()
  if (!pending) return { handled: false }
  if (isCommNo(text)) {
    clearInterrupt()
    return pack('Unverändert. Kein Anruf-Schauspiel.')
  }
  if (isCommYes(text, 'call') || isCommYes(text)) {
    clearInterrupt()
    if (pending.kind === 'calendar') {
      return pack('Ich lösche keinen Termin. Sagen Sie den Titel, den ich anpassen soll.')
    }
    if (pending.kind === 'plug') {
      return pack('Steckdose bleibt tot, bis sie wieder im WLAN ist. Nicht an lügen.')
    }
    return pack('Verstanden.')
  }
  if (parseDriveIntent(text, true) || parseFuelIntent(text) || parsePoiIntent(text)) {
    return { handled: false }
  }
  return pack(pending.question)
}

function pack(reply: string): InterruptHit {
  return {
    handled: true,
    reply,
    tool: { tool_status: 'executed', tool: 'interrupt', action: 'ask', label: 'Hinweis' },
    lastTool: 'interrupt',
  }
}
