import { completeGeminiVision, geminiReady } from './gemini'
import { getJson, postJson } from './http-json'
import { sanitizePcHost } from './pc-host'
import { parsePcIntent, type PcIntent } from './pc-parse'
import { isCommNo, isCommYes } from './places-parse'
import { isPcGround, parseGroundIntent, type GroundIntent } from './ground-parse'
import { loadSettings, saveSettings } from './store'
import { scrubReply } from './guards'
import { packVerified } from './action-fsm.ts'
import type { ToolMeta } from './tools'

export { sanitizePcHost } from './pc-host'
export { parsePcIntent, PC_COPY_PROMPTS } from './pc-parse'
export type { PcIntent } from './pc-parse'

type PcHit = { handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }

type PendingPc = { kind: 'delete_confirm'; path: string }
type PendingGround = { kind: 'two_step'; a: string; b: string; phase: 'ask1' | 'ask2' }

const VISION_OFF =
  'Sehen am PC ist aus. LocateAnything (JarvisSee auf der RTX) läuft nicht. Nichts eingezeichnet, nichts angeklickt. Gemini-Auge bleibt Opt-in — das Bild ginge dann zu Google.'

function pcTool(action: string, label: string, extra?: Record<string, unknown>): ToolMeta {
  const ok = extra?.ok
  if (ok === false) {
    return packVerified({
      domain: 'pc',
      intent: action,
      plan: action,
      label,
      observation: extra ?? { ok: false },
      verify: () => false,
      successReply: '',
      failReply: '',
      extra,
    }).tool
  }
  if (ok === true) {
    return packVerified({
      domain: 'pc',
      intent: action,
      plan: action,
      label,
      observation: extra ?? { ok: false },
      verify: (obs) => obs.ok === true,
      successReply: '',
      failReply: '',
      extra,
    }).tool
  }
  return packVerified({
    domain: 'pc',
    intent: action,
    plan: action,
    label,
    waiting: true,
    observation: extra || { ask: true },
    successReply: '',
    failReply: '',
    extra,
  }).tool
}

function readPending(): PendingPc | null {
  try {
    const raw = loadSettings().last_pc_json
    if (!raw) return null
    const p = JSON.parse(raw) as PendingPc
    return p?.kind === 'delete_confirm' && p.path ? p : null
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

function shotFrom(res: Record<string, unknown>): string | undefined {
  const img = typeof res.image === 'string' ? res.image : ''
  const mime = typeof res.mime === 'string' ? res.mime : 'image/jpeg'
  if (!img || img.length < 32) return undefined
  return `data:${mime};base64,${img}`
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
  if (!res.ok) return { ok: false, reply: String(res.message || 'PC nicht erreicht.') }
  const ips = Array.isArray(res.ips) ? res.ips.join(', ') : ''
  const screen = res.screen as { width?: number; height?: number } | undefined
  const size = screen?.width ? `${screen.width}×${screen.height}` : ''
  return {
    ok: true,
    reply: `PC-App erreicht${size ? `, Bildschirm ${size}` : ''}${ips ? `. IP ${ips}` : ''}.`,
  }
}

export async function handlePc(_conversationId: string, text: string): Promise<PcHit> {
  const pending = readPending()
  if (pending) {
    if (isCommNo(text)) {
      writePending(null)
      return {
        handled: true,
        reply: 'Nicht gelöscht.',
        tool: pcTool('ask', 'PC'),
        lastTool: 'pc',
      }
    }
    if (isCommYes(text)) {
      writePending(null)
      const res = await callPc('/v1/files', { op: 'delete', path: pending.path })
      return {
        handled: true,
        reply: res.ok
          ? String(res.message || `Weg: ${pending.path}`)
          : String(res.message || 'Nicht gelöscht.'),
        tool: pcTool('files', 'PC', res),
        lastTool: 'pc',
      }
    }
    const next = parsePcIntent(text)
    if (next) writePending(null)
    else {
      return {
        handled: true,
        reply: `Ordner/Datei ${pending.path} wirklich löschen? Ja oder nein.`,
        tool: pcTool('ask', 'PC'),
        lastTool: 'pc_confirm',
      }
    }
  }

  const two = readGroundPending()
  if (two) {
    if (isCommNo(text)) {
      writeGroundPending(null)
      return {
        handled: true,
        reply: 'Beide Schritte abgebrochen. Nichts geklickt.',
        tool: pcTool('ask', 'PC'),
        lastTool: 'pc',
      }
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
      return {
        handled: true,
        reply: `Nächster GUI-Schritt „${step}“? Ja oder nein. Einen dritten mache ich nicht.`,
        tool: pcTool('ask', 'PC'),
        lastTool: 'pc_confirm',
      }
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
    const t = await testPc()
    return {
      handled: true,
      reply: t.reply,
      tool: pcTool('status', 'PC', { ok: t.ok }),
      lastTool: 'pc',
    }
  }

  if (intent.kind === 'screen') return seeScreen()

  if (intent.kind === 'launch') {
    const res = await callPc('/v1/launch', { query: intent.query }, 15_000)
    return {
      handled: true,
      reply: res.ok
        ? String(res.message || `${intent.query} gestartet.`)
        : String(res.message || `„${intent.query}“ nicht gestartet.`),
      tool: pcTool('launch', 'PC', res),
      lastTool: 'pc',
    }
  }

  if (intent.kind === 'move') {
    const res = await callPc('/v1/input', {
      kind: 'move',
      dx: intent.dx,
      dy: intent.dy,
      nx: intent.nx,
      ny: intent.ny,
      x: intent.x,
      y: intent.y,
    })
    return {
      handled: true,
      reply: res.ok ? String(res.message || 'Maus bewegt.') : String(res.message || 'Maus nicht bewegt.'),
      tool: pcTool('move', 'PC', res),
      lastTool: 'pc',
    }
  }

  if (intent.kind === 'click') return doClick(intent)

  if (intent.kind === 'type') {
    const res = await callPc('/v1/input', { kind: 'type', text: intent.text })
    return {
      handled: true,
      reply: res.ok ? 'Getippt.' : String(res.message || 'Nicht getippt.'),
      tool: pcTool('type', 'PC', res),
      lastTool: 'pc',
    }
  }

  if (intent.kind === 'key') {
    const res = await callPc('/v1/input', { kind: 'key', key: intent.key })
    return {
      handled: true,
      reply: res.ok ? String(res.message || `Taste ${intent.key}.`) : String(res.message || 'Taste nicht.'),
      tool: pcTool('key', 'PC', res),
      lastTool: 'pc',
    }
  }

  if (intent.kind === 'files') {
    if (intent.op === 'delete') {
      writePending({ kind: 'delete_confirm', path: intent.path })
      return {
        handled: true,
        reply: `${intent.path} wirklich löschen? Ja oder nein.`,
        tool: pcTool('ask', 'PC'),
        lastTool: 'pc_confirm',
      }
    }
    const res = await callPc('/v1/files', { op: intent.op, path: intent.path, dest: intent.dest })
    return {
      handled: true,
      reply: String(res.message || (res.ok ? 'Erledigt.' : 'Nicht erledigt.')),
      tool: pcTool('files', 'PC', res),
      lastTool: 'pc',
    }
  }

  return { handled: false }
}

async function seeScreen(): Promise<PcHit> {
  const res = await callPc('/v1/screenshot', {}, 20_000)
  const image = shotFrom(res)
  if (!res.ok || !image) {
    return {
      handled: true,
      reply: String(res.message || 'Kein Bildschirm. JarvisPC.bat muss laufen.'),
      tool: pcTool('screen', 'PC', { ok: false }),
      lastTool: 'pc',
    }
  }
  if (!geminiReady()) {
    return {
      handled: true,
      reply: 'Bildschirm unten — so wie er jetzt ist. Zum Vorlesen Gemini an (Bild geht dann zu Google).',
      tool: pcTool('screen', 'PC', { ok: true, image }),
      lastTool: 'pc',
    }
  }
  const m = /^data:(image\/[a-zA-Z0+.-]+);base64,(.+)$/.exec(image)
  try {
    const text = await completeGeminiVision(
      'Das ist ein echter PC-Screenshot. Sagen Sie nur, was sichtbar ist. Keine erfundenen Fenster, Scores oder Namen. 2–4 Sätze, Siezen.',
      m?.[2] || '',
      m?.[1] || 'image/jpeg',
    )
    return {
      handled: true,
      reply: scrubReply(text || 'Bild unten. Nichts Lesbares erkannt.'),
      tool: pcTool('screen', 'PC', { ok: true, image }),
      lastTool: 'pc',
    }
  } catch (err) {
    return {
      handled: true,
      reply:
        (err instanceof Error ? err.message : 'Bild ist da, Beschreibung nicht.') + ' Screenshot unten.',
      tool: pcTool('screen', 'PC', { ok: true, image }),
      lastTool: 'pc',
    }
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
  return {
    handled: true,
    reply: VISION_OFF,
    tool: pcTool('ground', 'PC', { ok: false, vision: 'off' }),
    lastTool: 'pc',
  }
}

async function runGround(intent: Extract<GroundIntent, { kind: 'find' | 'count' | 'type_into' | 'two_step' }>): Promise<PcHit> {
  if (intent.kind === 'two_step') {
    writeGroundPending({ kind: 'two_step', a: intent.a, b: intent.b, phase: 'ask1' })
    return {
      handled: true,
      reply: `Zwei Schritte, jeder mit Ja: zuerst „${intent.a}“, dann „${intent.b}“. Ersten Schritt jetzt? Ja oder nein. Einen dritten mache ich nicht.`,
      tool: pcTool('ask', 'PC'),
      lastTool: 'pc_confirm',
    }
  }

  const hit = await lookupGround(intent.kind === 'type_into' ? intent.field : intent.query)
  if (hit.vision === 'missing' || hit.vision === 'off' || hit.vision === 'loading' || hit.vision === 'error') {
    if (intent.kind === 'count') {
      return {
        handled: true,
        reply: `${VISION_OFF} Eine Zahl erfinde ich nicht.`,
        tool: pcTool('ground', 'PC', { ok: false, vision: hit.vision }),
        lastTool: 'pc',
      }
    }
    return visionOffHit()
  }

  const sure = typeof hit.nx === 'number' && typeof hit.ny === 'number' && (hit.score || 1) >= 0.65

  if (intent.kind === 'count') {
    return {
      handled: true,
      reply: sure
        ? `Mindestens ein Treffer für ${intent.query} (Box ${hit.label || intent.query}). Eine genaue Fensterzahl ohne Sidecar-Liste nenne ich nicht.`
        : `Keine klare Menge für ${intent.query}. Eine Zahl erfinde ich nicht.`,
      tool: pcTool('ground', 'PC', { ok: true, vision: 'ready' }),
      lastTool: 'pc',
    }
  }

  if (intent.kind === 'type_into') {
    if (!sure) {
      return {
        handled: true,
        reply: `Feld „${intent.field}“ nicht eindeutig. Nichts getippt.`,
        tool: pcTool('ground', 'PC', { ok: true, vision: 'ready' }),
        lastTool: 'pc',
      }
    }
    await callPc('/v1/input', { kind: 'click', nx: hit.nx, ny: hit.ny })
    const typed = await callPc('/v1/input', { kind: 'type', text: intent.text })
    return {
      handled: true,
      reply: typed.ok ? `In „${hit.label || intent.field}“ getippt.` : String(typed.message || 'Nicht getippt.'),
      tool: pcTool('type', 'PC', typed),
      lastTool: 'pc',
    }
  }

  if (!intent.click) {
    return {
      handled: true,
      reply: sure
        ? `„${hit.label || intent.query}“ liegt ungefähr bei ${Math.round((hit.nx || 0) * 100)} % / ${Math.round((hit.ny || 0) * 100)} %. Maus bleibt.`
        : `„${intent.query}“ nicht eindeutig. Nichts eingezeichnet.`,
      tool: pcTool('ground', 'PC', { ok: true, vision: 'ready', image: undefined }),
      lastTool: 'pc',
    }
  }

  if (!sure) {
    return {
      handled: true,
      reply: `„${intent.query}“ nicht eindeutig. Nichts angeklickt.`,
      tool: pcTool('ground', 'PC', { ok: true, vision: 'ready' }),
      lastTool: 'pc',
    }
  }
  const click = await callPc('/v1/input', {
    kind: 'click',
    nx: Math.min(1, Math.max(0, hit.nx || 0)),
    ny: Math.min(1, Math.max(0, hit.ny || 0)),
  })
  return {
    handled: true,
    reply: click.ok
      ? `Klick auf ${hit.label || intent.query}. Ob der Zug gilt, sehe ich erst auf dem nächsten Bild.`
      : String(click.message || 'Nicht geklickt.'),
    tool: pcTool('click', 'PC', click),
    lastTool: 'pc',
  }
}

async function doClick(intent: Extract<PcIntent, { kind: 'click' }>): Promise<PcHit> {
  if (intent.target) {
    const local = await lookupGround(intent.target)
    if (local.vision === 'ready') {
      const sure = typeof local.nx === 'number' && typeof local.ny === 'number' && (local.score || 1) >= 0.65
      if (!sure) {
        return {
          handled: true,
          reply: `„${intent.target}“ nicht eindeutig. Nichts angeklickt.`,
          tool: pcTool('ground', 'PC', { ok: true, vision: 'ready' }),
          lastTool: 'pc',
        }
      }
      const click = await callPc('/v1/input', {
        kind: 'click',
        nx: Math.min(1, Math.max(0, local.nx || 0)),
        ny: Math.min(1, Math.max(0, local.ny || 0)),
        button: intent.button || 'left',
        times: intent.times || 1,
      })
      return {
        handled: true,
        reply: click.ok
          ? `Klick auf ${local.label || intent.target}. Ob der Zug gilt, sehe ich erst auf dem nächsten Bild.`
          : String(click.message || 'Nicht geklickt.'),
        tool: pcTool('click', 'PC', click),
        lastTool: 'pc',
      }
    }
    const shot = await callPc('/v1/screenshot', {}, 20_000)
    const image = shotFrom(shot)
    if (!shot.ok || !image) {
      return {
        handled: true,
        reply: local.vision === 'missing' || local.vision === 'off'
          ? `${VISION_OFF} ${String(shot.message || 'Kein Bildschirm.')}`
          : String(shot.message || 'Ohne Bildschirm kann ich den Zug nicht sehen.'),
        tool: pcTool('click', 'PC', { ok: false }),
        lastTool: 'pc',
      }
    }
    if (!geminiReady()) {
      return {
        handled: true,
        reply: `${VISION_OFF} Bild unten. Zum Anklicken über Google Gemini an. Oder „klick Mitte“.`,
        tool: pcTool('click', 'PC', { ok: true, image }),
        lastTool: 'pc',
      }
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
      return {
        handled: true,
        reply: `LocateAnything aus. Gemini fand „${intent.target}“ nicht eindeutig. Screenshot unten — nichts angeklickt.`,
        tool: pcTool('click', 'PC', { ok: true, image }),
        lastTool: 'pc',
      }
    }
    const click = await callPc('/v1/input', {
      kind: 'click',
      nx: Math.min(1, Math.max(0, nx)),
      ny: Math.min(1, Math.max(0, ny)),
      button: intent.button || 'left',
      times: intent.times || 1,
    })
    return {
      handled: true,
      reply: click.ok
        ? `LocateAnything aus — Gemini-Klick auf ${parsed.label || intent.target} (Bild zu Google). Ob der Zug gilt, sehe ich erst auf dem nächsten Bild.`
        : String(click.message || 'Nicht geklickt.'),
      tool: pcTool('click', 'PC', { ...click, image }),
      lastTool: 'pc',
    }
  }

  const res = await callPc('/v1/input', {
    kind: 'click',
    nx: intent.nx,
    ny: intent.ny,
    button: intent.button || 'left',
    times: intent.times || 1,
  })
  return {
    handled: true,
    reply: res.ok ? String(res.message || 'Klick ausgeführt.') : String(res.message || 'Nicht geklickt.'),
    tool: pcTool('click', 'PC', res),
    lastTool: 'pc',
  }
}
