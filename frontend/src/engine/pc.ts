import { completeGeminiVision, geminiReady } from './gemini'
import { getJson, postJson } from './http-json'
import { parsePcIntent, type PcIntent } from './pc-parse'
import { isCommNo, isCommYes } from './places-parse'
import { loadSettings, saveSettings } from './store'
import { scrubReply } from './guards'
import type { ToolMeta } from './tools'

export { parsePcIntent } from './pc-parse'
export type { PcIntent } from './pc-parse'

type PcHit = { handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }

type PendingPc = { kind: 'delete_confirm'; path: string }

function pcTool(action: string, label: string, extra?: Record<string, unknown>): ToolMeta {
  return {
    tool_status: extra?.ok === false ? 'error' : 'executed',
    tool: 'pc',
    action,
    label,
    preview: label,
    result: extra,
  }
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

function endpoint(): { url: string; token: string } | { error: string } {
  const s = loadSettings()
  const host = (s.pc_host || '').trim()
  if (!s.pc_enabled) {
    return { error: 'PC-Steuerung aus. Unter Einstellungen → PC anschalten, App auf dem Rechner starten.' }
  }
  if (!host) {
    return {
      error:
        'Keine PC-IP. Auf dem Windows-Rechner JarvisPC.bat starten — IP und Token stehen im Fenster. Dann Einstellungen → PC.',
    }
  }
  const port = s.pc_port > 0 ? s.pc_port : 18790
  const token = (s.pc_token || '').trim()
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
    return {
      ok: false,
      message: 'PC nicht erreicht. JarvisPC.bat muss laufen, gleiches WLAN, Firewall Port 18790.',
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
      pc_host: opts.host.trim(),
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

  const intent = parsePcIntent(text)
  if (!intent) return { handled: false }
  return runIntent(intent)
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

async function doClick(intent: Extract<PcIntent, { kind: 'click' }>): Promise<PcHit> {
  if (intent.target) {
    const shot = await callPc('/v1/screenshot', {}, 20_000)
    const image = shotFrom(shot)
    if (!shot.ok || !image) {
      return {
        handled: true,
        reply: String(shot.message || 'Ohne Bildschirm kann ich den Zug nicht sehen.'),
        tool: pcTool('click', 'PC', { ok: false }),
        lastTool: 'pc',
      }
    }
    if (!geminiReady()) {
      return {
        handled: true,
        reply:
          'Bild unten. Zum Anklicken eines Elements Gemini an. Oder „klick Mitte“ / Maus nach links.',
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
        reply: `„${intent.target}“ auf dem Bild nicht eindeutig. Screenshot unten — nichts angeklickt.`,
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
        ? `Klick auf ${parsed.label || intent.target}. Ob der Zug gilt, sehe ich erst auf dem nächsten Bild.`
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
