import { completeGeminiVision, geminiReady } from './gemini'
import { getJson, postJson } from './http-json'
import { sanitizePcHost } from './pc-host'
import { parsePcIntent, type PcIntent } from './pc-parse'
import {
  CAP_OFFLINE,
  CLICK_SENT,
  capMissingReply,
  launchArrivedReply,
  needsLaunchConfirm,
  parsePcCaps,
  pcActionVerified,
  pcCan,
  type PcCap,
  type PcCaps,
} from './pc-cap.ts'
import {
  RTC_LIVE_JPEG,
  RTC_NO_SESSION,
  RTC_OFF,
  RTC_STOP,
  parseRtcSession,
  rtcStreamVerified,
  rtcSuccessReply,
} from './pc-rtc.ts'
import { isCommNo, isCommYes } from './places-parse'
import { isPcGround, parseGroundIntent, type GroundIntent } from './ground-parse'
import { loadSettings, saveSettings } from './store'
import { scrubReply } from './guards'
import { packVerified } from './action-fsm.ts'
import type { ToolMeta } from './tools'

export { sanitizePcHost } from './pc-host'
export { parsePcIntent, PC_COPY_PROMPTS } from './pc-parse'
export type { PcIntent } from './pc-parse'
export { parsePcCaps, pcCan, pcActionVerified, needsLaunchConfirm } from './pc-cap.ts'
export { parseRtcSession, rtcStreamVerified } from './pc-rtc.ts'

type PcHit = { handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }

type PendingPc =
  | { kind: 'delete_confirm'; path: string }
  | { kind: 'launch_confirm'; query: string }
type PendingGround = { kind: 'two_step'; a: string; b: string; phase: 'ask1' | 'ask2' }

const VISION_OFF =
  'Sehen am PC ist aus. LocateAnything (JarvisSee auf der RTX) läuft nicht. Nichts eingezeichnet, nichts angeklickt. Gemini-Auge bleibt Opt-in — das Bild ginge dann zu Google.'

function packPc(opts: {
  action: string
  obs: Record<string, unknown>
  success: string
  fail: string
  extra?: Record<string, unknown>
  waiting?: boolean
  cancelled?: boolean
  preOk?: boolean
  preError?: string
  lastTool?: string
}): PcHit {
  const packed = packVerified({
    domain: 'pc',
    intent: opts.action,
    plan: opts.action,
    label: 'PC',
    waiting: opts.waiting,
    cancelled: opts.cancelled,
    preOk: opts.preOk,
    preError: opts.preError,
    observation: opts.obs,
    verify: (obs) => pcActionVerified(obs),
    successReply: opts.success,
    failReply: opts.fail,
    extra: opts.extra,
  })
  return {
    handled: true,
    reply: packed.reply,
    tool: packed.tool,
    lastTool: opts.lastTool || (opts.waiting ? 'pc_confirm' : 'pc'),
  }
}

function packWait(action: string, reply: string): PcHit {
  return packPc({
    action,
    obs: { ask: true, action },
    success: reply,
    fail: reply,
    waiting: true,
    lastTool: 'pc_confirm',
  })
}

function packOffline(action: string, message: string): PcHit {
  const fail = message || CAP_OFFLINE
  return packPc({
    action,
    obs: { action, reached: false, can: false, ok: false },
    success: fail,
    fail,
    preOk: false,
    preError: fail,
  })
}

function packCapMissing(action: PcCap, caps: PcCaps): PcHit {
  const fail = capMissingReply(action)
  return packPc({
    action,
    obs: { action, reached: caps.reached, level: caps.level, can: false, ok: false },
    success: fail,
    fail,
  })
}

function obsBase(action: string, caps: PcCaps, extra?: Record<string, unknown>): Record<string, unknown> {
  return {
    action,
    reached: caps.reached,
    level: caps.level,
    can: pcCan(caps, action as PcCap),
    ...extra,
  }
}

function readPending(): PendingPc | null {
  try {
    const raw = loadSettings().last_pc_json
    if (!raw) return null
    const p = JSON.parse(raw) as PendingPc
    if (p?.kind === 'delete_confirm' && p.path) return p
    if (p?.kind === 'launch_confirm' && p.query) return p
    return null
  } catch {
    return null
  }
}

function writePending(p: PendingPc | null) {
  saveSettings({ last_pc_json: p ? JSON.stringify(p) : '', last_step_tool: p ? 'pc_confirm' : 'pc' })
}

function writeGroundPending(p: PendingGround | null) {
  saveSettings({ last_ground_json: p ? JSON.stringify(p) : '' })
}

type LiveRtc = { sessionId: string; mode: 'lan-jpeg' | 'webrtc'; webrtc: string }

export function readRtcLive(): LiveRtc | null {
  try {
    const raw = loadSettings().last_rtc_json
    if (!raw) return null
    const p = JSON.parse(raw) as LiveRtc
    return p?.sessionId ? p : null
  } catch {
    return null
  }
}

function writeRtcLive(p: LiveRtc | null) {
  saveSettings({ last_rtc_json: p ? JSON.stringify(p) : '' })
}

function readGroundPending(): PendingGround | null {
  try {
    const raw = loadSettings().last_ground_json
    if (!raw) return null
    const p = JSON.parse(raw) as PendingGround
    return p?.kind === 'two_step' && p.a && p.b ? p : null
  } catch {
    return null
  }
}

function endpoint(): { url: string; token: string } | { error: string } {
  const s = loadSettings()
  const host = sanitizePcHost(s.pc_host || '')
  if (host && host !== (s.pc_host || '').trim()) saveSettings({ pc_host: host })
  const token = (s.pc_token || '').trim()
  if (!s.pc_enabled) {
    if (host && token) saveSettings({ pc_enabled: true })
    else {
      return { error: 'PC-Steuerung aus. Unter Einstellungen → PC anschalten, App auf dem Rechner starten.' }
    }
  }
  if (!host) {
    return {
      error:
        'Keine PC-IP. Auf dem Windows-Rechner JarvisPC.bat starten — die gelbe IP (192.168…), nicht 172…. Dann Einstellungen → PC.',
    }
  }
  const port = s.pc_port > 0 ? s.pc_port : 18790
  if (!token) return { error: 'Kein Token. Den Code aus dem Jarvis-PC-Fenster unter Einstellungen → PC eintragen.' }
  return { url: `http://${host}:${port}`, token }
}

async function callPc(
  path: string,
  body: Record<string, unknown> = {},
  timeoutMs = 12_000,
): Promise<Record<string, unknown>> {
  const ep = endpoint()
  if ('error' in ep) return { ok: false, message: ep.error }
  const headers = {
    'Content-Type': 'application/json',
    'X-Jarvis-Token': ep.token,
    Authorization: `Bearer ${ep.token}`,
  }
  try {
    const { status, json } =
      path === '/v1/status' && Object.keys(body).length === 0
        ? await getJson(`${ep.url}${path}`, headers)
        : await postJson(`${ep.url}${path}`, headers, body, timeoutMs)
    if (!json || typeof json !== 'object') {
      return { ok: false, message: 'PC-App hat nichts Verständliches geliefert.' }
    }
    if (status === 401 || json.ok === false) {
      return {
        ok: false,
        message: String(json.message || 'PC nicht erreicht. Gleiches WLAN, App-Fenster offen, Token prüfen.'),
      }
    }
    return json
  } catch {
    const where = 'error' in ep ? '' : ` (${ep.url})`
    return {
      ok: false,
      message:
        `PC nicht erreicht${where}. Fenster „Jarvis PC“ offen lassen. IP muss 192.168…/10… sein (nicht 172…/WSL). Gleiches WLAN, kein Gäste-Netz. Im PC-Fenster „Firewall erlauben“, dann PC testen.`,
    }
  }
}

async function loadCaps(): Promise<{ caps: PcCaps; message: string }> {
  const raw = await callPc('/v1/status', {}, 8_000)
  return {
    caps: parsePcCaps(raw),
    message: String(raw.message || (raw.ok ? '' : CAP_OFFLINE)),
  }
}

async function requireCap(action: PcCap): Promise<{ caps: PcCaps } | PcHit> {
  const { caps, message } = await loadCaps()
  if (!caps.reached) return packOffline(action, message)
  if (!pcCan(caps, action)) return packCapMissing(action, caps)
  return { caps }
}

function shotFrom(res: Record<string, unknown>): string | undefined {
  const img = typeof res.image === 'string' ? res.image : ''
  const mime = typeof res.mime === 'string' ? res.mime : 'image/jpeg'
  if (!img || img.length < 32) return undefined
  return `data:${mime};base64,${img}`
}

function statusReply(res: Record<string, unknown>, caps: PcCaps): { ok: boolean; reply: string } {
  if (!caps.reached) return { ok: false, reply: String(res.message || CAP_OFFLINE) }
  const ips = Array.isArray(res.ips) ? res.ips.join(', ') : ''
  const screen = res.screen as { width?: number; height?: number } | undefined
  const size = screen?.width ? `${screen.width}×${screen.height}` : ''
  const level = caps.level !== 'status' ? `, Stufe ${caps.level}` : ''
  return {
    ok: true,
    reply: `PC-App erreicht${size ? `, Bildschirm ${size}` : ''}${level}${ips ? `. IP ${ips}` : ''}.`,
  }
}

export async function testPc(opts?: { host?: string; token?: string; port?: number }): Promise<{
  ok: boolean
  reply: string
}> {
  if (opts?.host) {
    saveSettings({
      pc_host: sanitizePcHost(opts.host),
      pc_token: opts.token?.trim() || loadSettings().pc_token,
      pc_port: opts.port || loadSettings().pc_port || 18790,
      pc_enabled: true,
    })
  }
  const res = await callPc('/v1/status', {}, 8_000)
  return statusReply(res, parsePcCaps(res))
}

export async function handlePc(_conversationId: string, text: string): Promise<PcHit> {
  const pending = readPending()
  if (pending) {
    if (isCommNo(text)) {
      writePending(null)
      const cancelled =
        pending.kind === 'launch_confirm' ? 'Nicht gestartet.' : 'Nicht gelöscht.'
      return packPc({
        action: pending.kind === 'launch_confirm' ? 'launch' : 'files',
        obs: { action: pending.kind === 'launch_confirm' ? 'launch' : 'files', ask: true },
        success: cancelled,
        fail: cancelled,
        cancelled: true,
        lastTool: 'pc',
      })
    }
    if (isCommYes(text)) {
      writePending(null)
      if (pending.kind === 'launch_confirm') return doLaunch(pending.query)
      const gated = await requireCap('files')
      if (!('caps' in gated)) return gated
      const res = await callPc('/v1/files', { op: 'delete', path: pending.path })
      const ok = res.ok === true
      return packPc({
        action: 'files',
        obs: obsBase('files', gated.caps, { ok, path: pending.path }),
        success: String(res.message || `Weg: ${pending.path}`),
        fail: String(res.message || 'Nicht gelöscht.'),
      })
    }
    const next = parsePcIntent(text)
    if (next) writePending(null)
    else {
      const ask =
        pending.kind === 'launch_confirm'
          ? `„${pending.query}“ auf dem PC starten? Ja oder nein.`
          : `Ordner/Datei ${pending.path} wirklich löschen? Ja oder nein.`
      return packWait(pending.kind === 'launch_confirm' ? 'launch' : 'files', ask)
    }
  }

  const two = readGroundPending()
  if (two) {
    if (isCommNo(text)) {
      writeGroundPending(null)
      return packPc({
        action: 'ground',
        obs: { action: 'ground', ask: true },
        success: 'Beide Schritte abgebrochen. Nichts geklickt.',
        fail: 'Beide Schritte abgebrochen. Nichts geklickt.',
        cancelled: true,
        lastTool: 'pc',
      })
    }
    if (isCommYes(text)) {
      if (two.phase === 'ask1') {
        const first = await runGround({ kind: 'find', query: two.a, click: true })
        writeGroundPending({ ...two, phase: 'ask2' })
        return {
          handled: true,
          reply: `${first.reply} Zweiter Schritt „${two.b}“? Ja oder nein. Einen dritten mache ich nicht.`,
          tool: first.tool,
          lastTool: 'pc_confirm',
        }
      }
      writeGroundPending(null)
      const second = await runGround({ kind: 'find', query: two.b, click: true })
      return {
        handled: true,
        reply: `${second.reply} Fertig. Kein dritter Schritt.`,
        tool: second.tool,
        lastTool: 'pc',
      }
    }
    const nextPc = parsePcIntent(text)
    const nextG = parseGroundIntent(text)
    if (nextPc || isPcGround(nextG)) writeGroundPending(null)
    else {
      const step = two.phase === 'ask1' ? two.a : two.b
      return packWait('ground', `Nächster GUI-Schritt „${step}“? Ja oder nein. Einen dritten mache ich nicht.`)
    }
  }

  const intent = parsePcIntent(text)
  if (intent) return runIntent(intent)
  const g = parseGroundIntent(text)
  if (isPcGround(g)) return runGround(g)
  return { handled: false }
}

async function runIntent(intent: PcIntent): Promise<PcHit> {
  if (intent.kind === 'status') {
    const res = await callPc('/v1/status', {}, 8_000)
    const caps = parsePcCaps(res)
    const t = statusReply(res, caps)
    return packPc({
      action: 'status',
      obs: obsBase('status', caps, { ok: t.ok }),
      success: t.reply,
      fail: t.reply,
    })
  }

  if (intent.kind === 'screen') return seeScreen()

  if (intent.kind === 'stream') return startLive()

  if (intent.kind === 'stream_stop') return stopLive()

  if (intent.kind === 'launch') {
    if (needsLaunchConfirm(intent.query)) {
      writePending({ kind: 'launch_confirm', query: intent.query })
      return packWait('launch', `„${intent.query}“ auf dem PC starten? Ja oder nein.`)
    }
    return doLaunch(intent.query)
  }

  if (intent.kind === 'move') {
    const gated = await requireCap('move')
    if (!('caps' in gated)) return gated
    const res = await callPc('/v1/input', {
      kind: 'move',
      dx: intent.dx,
      dy: intent.dy,
      nx: intent.nx,
      ny: intent.ny,
      x: intent.x,
      y: intent.y,
    })
    const ok = res.ok === true
    return packPc({
      action: 'move',
      obs: obsBase('move', gated.caps, { ok, sent: ok }),
      success: String(res.message || 'Maus bewegt.'),
      fail: String(res.message || 'Maus nicht bewegt.'),
    })
  }

  if (intent.kind === 'click') return doClick(intent)

  if (intent.kind === 'type') {
    const gated = await requireCap('type')
    if (!('caps' in gated)) return gated
    const res = await callPc('/v1/input', { kind: 'type', text: intent.text })
    const ok = res.ok === true
    return packPc({
      action: 'type',
      obs: obsBase('type', gated.caps, { ok, sent: ok }),
      success: ok ? 'Getippt.' : String(res.message || 'Nicht getippt.'),
      fail: String(res.message || 'Nicht getippt.'),
    })
  }

  if (intent.kind === 'key') {
    const gated = await requireCap('key')
    if (!('caps' in gated)) return gated
    const res = await callPc('/v1/input', { kind: 'key', key: intent.key })
    const ok = res.ok === true
    return packPc({
      action: 'key',
      obs: obsBase('key', gated.caps, { ok, sent: ok }),
      success: String(res.message || `Taste ${intent.key}.`),
      fail: String(res.message || 'Taste nicht.'),
    })
  }

  if (intent.kind === 'files') {
    if (intent.op === 'delete') {
      writePending({ kind: 'delete_confirm', path: intent.path })
      return packWait('files', `${intent.path} wirklich löschen? Ja oder nein.`)
    }
    const gated = await requireCap('files')
    if (!('caps' in gated)) return gated
    const res = await callPc('/v1/files', { op: intent.op, path: intent.path, dest: intent.dest })
    const ok = res.ok === true
    return packPc({
      action: 'files',
      obs: obsBase('files', gated.caps, { ok, path: res.path || intent.path, entries: res.entries }),
      success: String(res.message || 'Erledigt.'),
      fail: String(res.message || 'Nicht erledigt.'),
    })
  }

  return { handled: false }
}

async function startLive(): Promise<PcHit> {
  const gated = await requireCap('stream')
  if (!('caps' in gated)) return gated
  const start = await callPc('/v1/webrtc', { action: 'start' }, 8_000)
  const session = parseRtcSession(start)
  if (!session) {
    return packPc({
      action: 'stream',
      obs: obsBase('stream', gated.caps, { ok: false, webrtc: 'off' }),
      success: String(start.message || RTC_OFF),
      fail: String(start.message || RTC_OFF),
    })
  }
  const frame = await callPc('/v1/webrtc', { action: 'frame', sessionId: session.sessionId }, 20_000)
  const image = shotFrom(frame)
  const hasFrame = Boolean(image)
  const webrtc = session.webrtc === 'ready' ? 'ready' : 'off'
  const connected = start.connected === true
  const track = start.track === true
  const mode = webrtc === 'ready' && connected && track ? 'webrtc' : 'lan-jpeg'
  if (hasFrame) {
    writeRtcLive({ sessionId: session.sessionId, mode, webrtc })
  } else {
    writeRtcLive(null)
  }
  const obs = obsBase('stream', gated.caps, {
    sessionId: session.sessionId,
    webrtc,
    mode,
    connected,
    track,
    frame: hasFrame,
    ice: session.ice || 'host',
    image: image || '',
  })
  const reply = rtcSuccessReply(obs)
  return packPc({
    action: 'stream',
    obs,
    success: reply,
    fail: String(frame.message || start.message || RTC_OFF),
    extra: image ? { image } : undefined,
  })
}

export async function pullRtcFrame(): Promise<{ ok: boolean; image?: string; reply: string }> {
  const live = readRtcLive()
  if (!live) return { ok: false, reply: RTC_NO_SESSION }
  const frame = await callPc('/v1/webrtc', { action: 'frame', sessionId: live.sessionId }, 20_000)
  const image = shotFrom(frame)
  if (!image) {
    if (frame.ok === false) writeRtcLive(null)
    return { ok: false, reply: String(frame.message || RTC_OFF) }
  }
  return { ok: true, image, reply: live.webrtc === 'ready' ? 'WebRTC' : RTC_LIVE_JPEG }
}

export async function stopRtcLive(): Promise<{ ok: boolean; reply: string }> {
  const live = readRtcLive()
  writeRtcLive(null)
  if (!live) return { ok: true, reply: RTC_NO_SESSION }
  await callPc('/v1/webrtc', { action: 'hangup', sessionId: live.sessionId }, 8_000)
  return { ok: true, reply: RTC_STOP }
}

async function stopLive(): Promise<PcHit> {
  const live = readRtcLive()
  const stopped = await stopRtcLive()
  return packPc({
    action: 'stream_stop',
    obs: {
      action: 'stream_stop',
      reached: true,
      can: true,
      sessionId: live?.sessionId || '',
      ok: true,
    },
    success: stopped.reply,
    fail: stopped.reply,
  })
}

async function doLaunch(query: string): Promise<PcHit> {
  const gated = await requireCap('launch')
  if (!('caps' in gated)) return gated
  const res = await callPc('/v1/launch', { query }, 15_000)
  const name = String(res.name || '')
  const started = res.started === true || Boolean(name) || Number(res.pid) > 0
  const ok = res.ok === true
  return packPc({
    action: 'launch',
    obs: obsBase('launch', gated.caps, { ok, started: ok && started, name, pid: res.pid }),
    success: launchArrivedReply(name || query),
    fail: String(res.message || `„${query}“ nicht gestartet.`),
  })
}

async function seeScreen(): Promise<PcHit> {
  const gated = await requireCap('screen')
  if (!('caps' in gated)) return gated
  const res = await callPc('/v1/screenshot', {}, 20_000)
  const image = shotFrom(res)
  if (!res.ok || !image) {
    return packPc({
      action: 'screen',
      obs: obsBase('screen', gated.caps, { ok: false, image: '' }),
      success: String(res.message || 'Kein Bildschirm. JarvisPC.bat muss laufen.'),
      fail: String(res.message || 'Kein Bildschirm. JarvisPC.bat muss laufen.'),
    })
  }
  if (!geminiReady()) {
    return packPc({
      action: 'screen',
      obs: obsBase('screen', gated.caps, { ok: true, image }),
      success: 'Bildschirm unten — so wie er jetzt ist. Zum Vorlesen Gemini an (Bild geht dann zu Google).',
      fail: 'Kein Bildschirm. JarvisPC.bat muss laufen.',
    })
  }
  const m = /^data:(image\/[a-zA-Z0+.-]+);base64,(.+)$/.exec(image)
  try {
    const text = await completeGeminiVision(
      'Das ist ein echter PC-Screenshot. Sagen Sie nur, was sichtbar ist. Keine erfundenen Fenster, Scores oder Namen. 2–4 Sätze, Siezen.',
      m?.[2] || '',
      m?.[1] || 'image/jpeg',
    )
    return packPc({
      action: 'screen',
      obs: obsBase('screen', gated.caps, { ok: true, image }),
      success: scrubReply(text || 'Bild unten. Nichts Lesbares erkannt.'),
      fail: 'Kein Bildschirm. JarvisPC.bat muss laufen.',
    })
  } catch (err) {
    return packPc({
      action: 'screen',
      obs: obsBase('screen', gated.caps, { ok: true, image }),
      success:
        (err instanceof Error ? err.message : 'Bild ist da, Beschreibung nicht.') + ' Screenshot unten.',
      fail: 'Kein Bildschirm. JarvisPC.bat muss laufen.',
    })
  }
}

async function lookupGround(query: string): Promise<{
  vision: 'off' | 'loading' | 'ready' | 'error' | 'missing'
  nx?: number
  ny?: number
  label?: string
  score?: number
  message?: string
}> {
  const res = await callPc('/v1/ground', { query }, 20_000)
  const msg = String(res.message || '')
  if (!res.ok && /nicht erreicht|404|unknown|kein endpoint|not found/i.test(msg)) {
    return { vision: 'missing', message: msg }
  }
  const visionRaw = String(res.vision || '')
  const vision =
    visionRaw === 'ready' || visionRaw === 'off' || visionRaw === 'loading' || visionRaw === 'error'
      ? visionRaw
      : res.ok
        ? 'ready'
        : 'error'
  const boxes = Array.isArray(res.boxes) ? res.boxes : []
  const first = boxes[0] as { nx?: number; ny?: number; x?: number; y?: number; label?: string; score?: number } | undefined
  const nx = Number(first?.nx ?? res.nx)
  const ny = Number(first?.ny ?? res.ny)
  return {
    vision,
    nx: Number.isFinite(nx) ? nx : undefined,
    ny: Number.isFinite(ny) ? ny : undefined,
    label: typeof first?.label === 'string' ? first.label : typeof res.label === 'string' ? res.label : undefined,
    score: Number(first?.score ?? res.score),
    message: msg,
  }
}

function visionOffHit(): PcHit {
  return packPc({
    action: 'ground',
    obs: { action: 'ground', reached: true, can: false, vision: 'off', ok: false },
    success: VISION_OFF,
    fail: VISION_OFF,
  })
}

async function runGround(intent: Extract<GroundIntent, { kind: 'find' | 'count' | 'type_into' | 'two_step' }>): Promise<PcHit> {
  if (intent.kind === 'two_step') {
    writeGroundPending({ kind: 'two_step', a: intent.a, b: intent.b, phase: 'ask1' })
    return packWait(
      'ground',
      `Zwei Schritte, jeder mit Ja: zuerst „${intent.a}“, dann „${intent.b}“. Ersten Schritt jetzt? Ja oder nein. Einen dritten mache ich nicht.`,
    )
  }

  const hit = await lookupGround(intent.kind === 'type_into' ? intent.field : intent.query)
  if (hit.vision === 'missing' || hit.vision === 'off' || hit.vision === 'loading' || hit.vision === 'error') {
    if (intent.kind === 'count') {
      return packPc({
        action: 'ground',
        obs: { action: 'ground', reached: true, can: false, vision: hit.vision, ok: false },
        success: `${VISION_OFF} Eine Zahl erfinde ich nicht.`,
        fail: `${VISION_OFF} Eine Zahl erfinde ich nicht.`,
      })
    }
    return visionOffHit()
  }

  const sure = typeof hit.nx === 'number' && typeof hit.ny === 'number' && (hit.score || 1) >= 0.65
  const groundObs = { action: 'ground', reached: true, can: true, vision: 'ready' as const, ok: true }

  if (intent.kind === 'count') {
    return packPc({
      action: 'ground',
      obs: groundObs,
      success: sure
        ? `Mindestens ein Treffer für ${intent.query} (Box ${hit.label || intent.query}). Eine genaue Fensterzahl ohne Sidecar-Liste nenne ich nicht.`
        : `Keine klare Menge für ${intent.query}. Eine Zahl erfinde ich nicht.`,
      fail: `Keine klare Menge für ${intent.query}. Eine Zahl erfinde ich nicht.`,
    })
  }

  if (intent.kind === 'type_into') {
    if (!sure) {
      return packPc({
        action: 'ground',
        obs: groundObs,
        success: `Feld „${intent.field}“ nicht eindeutig. Nichts getippt.`,
        fail: `Feld „${intent.field}“ nicht eindeutig. Nichts getippt.`,
      })
    }
    const gated = await requireCap('type')
    if (!('caps' in gated)) return gated
    await callPc('/v1/input', { kind: 'click', nx: hit.nx, ny: hit.ny })
    const typed = await callPc('/v1/input', { kind: 'type', text: intent.text })
    const ok = typed.ok === true
    return packPc({
      action: 'type',
      obs: obsBase('type', gated.caps, { ok, sent: ok }),
      success: ok ? `In „${hit.label || intent.field}“ getippt.` : String(typed.message || 'Nicht getippt.'),
      fail: String(typed.message || 'Nicht getippt.'),
    })
  }

  if (!intent.click) {
    return packPc({
      action: 'ground',
      obs: { ...groundObs, image: undefined },
      success: sure
        ? `„${hit.label || intent.query}“ liegt ungefähr bei ${Math.round((hit.nx || 0) * 100)} % / ${Math.round((hit.ny || 0) * 100)} %. Maus bleibt.`
        : `„${intent.query}“ nicht eindeutig. Nichts eingezeichnet.`,
      fail: `„${intent.query}“ nicht eindeutig. Nichts eingezeichnet.`,
    })
  }

  if (!sure) {
    return packPc({
      action: 'ground',
      obs: groundObs,
      success: `„${intent.query}“ nicht eindeutig. Nichts angeklickt.`,
      fail: `„${intent.query}“ nicht eindeutig. Nichts angeklickt.`,
    })
  }
  const gated = await requireCap('click')
  if (!('caps' in gated)) return gated
  const click = await callPc('/v1/input', {
    kind: 'click',
    nx: Math.min(1, Math.max(0, hit.nx || 0)),
    ny: Math.min(1, Math.max(0, hit.ny || 0)),
  })
  const ok = click.ok === true
  return packPc({
    action: 'click',
    obs: obsBase('click', gated.caps, { ok, sent: ok, proved: false }),
    success: CLICK_SENT,
    fail: String(click.message || 'Nicht geklickt.'),
  })
}

async function doClick(intent: Extract<PcIntent, { kind: 'click' }>): Promise<PcHit> {
  if (intent.target) {
    const local = await lookupGround(intent.target)
    if (local.vision === 'ready') {
      const sure = typeof local.nx === 'number' && typeof local.ny === 'number' && (local.score || 1) >= 0.65
      if (!sure) {
        return packPc({
          action: 'ground',
          obs: { action: 'ground', reached: true, can: true, vision: 'ready', ok: true },
          success: `„${intent.target}“ nicht eindeutig. Nichts angeklickt.`,
          fail: `„${intent.target}“ nicht eindeutig. Nichts angeklickt.`,
        })
      }
      const gated = await requireCap('click')
      if (!('caps' in gated)) return gated
      const click = await callPc('/v1/input', {
        kind: 'click',
        nx: Math.min(1, Math.max(0, local.nx || 0)),
        ny: Math.min(1, Math.max(0, local.ny || 0)),
        button: intent.button || 'left',
        times: intent.times || 1,
      })
      const ok = click.ok === true
      return packPc({
        action: 'click',
        obs: obsBase('click', gated.caps, { ok, sent: ok, proved: false }),
        success: `Klick auf ${local.label || intent.target}. Ob der Zug gilt, sehe ich erst auf dem nächsten Bild.`,
        fail: String(click.message || 'Nicht geklickt.'),
      })
    }
    const shot = await callPc('/v1/screenshot', {}, 20_000)
    const image = shotFrom(shot)
    if (!shot.ok || !image) {
      return packPc({
        action: 'click',
        obs: { action: 'click', reached: true, can: false, ok: false },
        success:
          local.vision === 'missing' || local.vision === 'off'
            ? `${VISION_OFF} ${String(shot.message || 'Kein Bildschirm.')}`
            : String(shot.message || 'Ohne Bildschirm kann ich den Zug nicht sehen.'),
        fail:
          local.vision === 'missing' || local.vision === 'off'
            ? `${VISION_OFF} ${String(shot.message || 'Kein Bildschirm.')}`
            : String(shot.message || 'Ohne Bildschirm kann ich den Zug nicht sehen.'),
      })
    }
    if (!geminiReady()) {
      return packPc({
        action: 'screen',
        obs: { action: 'screen', reached: true, can: true, ok: true, image },
        success: `${VISION_OFF} Bild unten. Zum Anklicken über Google Gemini an. Oder „klick Mitte“.`,
        fail: `${VISION_OFF} Bild unten. Zum Anklicken über Google Gemini an. Oder „klick Mitte“.`,
      })
    }
    const m = /^data:(image\/[a-zA-Z0+.-]+);base64,(.+)$/.exec(image)
    let parsed: { found?: boolean; nx?: number; ny?: number; label?: string } = {}
    try {
      const raw = await completeGeminiVision(
        `PC-Screenshot. Nutzer will klicken: „${intent.target}“. Antwort NUR JSON, nichts sonst: {"found":true,"nx":0.0,"ny":0.0,"label":"kurz"} mit nx/ny 0–1 (links/oben = 0). Wenn das Element nicht klar sichtbar: {"found":false}. Nichts erfinden.`,
        m?.[2] || '',
        m?.[1] || 'image/jpeg',
      )
      const json = raw.match(/\{[\s\S]*\}/)
      if (json) parsed = JSON.parse(json[0]) as typeof parsed
    } catch {
      parsed = { found: false }
    }
    const nx = Number(parsed.nx)
    const ny = Number(parsed.ny)
    if (!parsed.found || !Number.isFinite(nx) || !Number.isFinite(ny)) {
      return packPc({
        action: 'screen',
        obs: { action: 'screen', reached: true, can: true, ok: true, image },
        success: `LocateAnything aus. Gemini fand „${intent.target}“ nicht eindeutig. Screenshot unten — nichts angeklickt.`,
        fail: `LocateAnything aus. Gemini fand „${intent.target}“ nicht eindeutig. Screenshot unten — nichts angeklickt.`,
      })
    }
    const gated = await requireCap('click')
    if (!('caps' in gated)) return gated
    const click = await callPc('/v1/input', {
      kind: 'click',
      nx: Math.min(1, Math.max(0, nx)),
      ny: Math.min(1, Math.max(0, ny)),
      button: intent.button || 'left',
      times: intent.times || 1,
    })
    const ok = click.ok === true
    return packPc({
      action: 'click',
      obs: obsBase('click', gated.caps, { ok, sent: ok, proved: false, image }),
      success: `LocateAnything aus — Gemini-Klick auf ${parsed.label || intent.target} (Bild zu Google). Ob der Zug gilt, sehe ich erst auf dem nächsten Bild.`,
      fail: String(click.message || 'Nicht geklickt.'),
    })
  }

  const gated = await requireCap('click')
  if (!('caps' in gated)) return gated
  const res = await callPc('/v1/input', {
    kind: 'click',
    nx: intent.nx,
    ny: intent.ny,
    button: intent.button || 'left',
    times: intent.times || 1,
  })
  const ok = res.ok === true
  return packPc({
    action: 'click',
    obs: obsBase('click', gated.caps, { ok, sent: ok, proved: false }),
    success: CLICK_SENT,
    fail: String(res.message || 'Nicht geklickt.'),
  })
}
