import { loadSettings, saveSettings } from './store'
import {
  tvDiscoverNative,
  tvFireKeyNative,
  tvFireTestNative,
  tvLaunchAppNative,
  tvPairNative,
  tvSendKeyNative,
  tvTestNative,
  tvWakeNative,
  type TvDevice,
  type TvResult,
} from '../native/tv'
import { TV_APP_IDS, TV_APP_LABEL, type TvAppId } from './tv-apps.ts'
import {
  FIRE_ANCHOR,
  TV_ANCHOR,
  TV_FOLLOWUP_MS,
  isFollowUpPhrase,
  parseTvIntent,
  parseTvWatch,
  type TvAction,
  type TvWatchIntent,
} from './tv-parse.ts'
import { lookupWatch, youtubeDeepLink, youtubeSearch, youtubeSearchLink, youtubeVideoId, type WatchHit, type WatchOffer } from './tv-watch.ts'

export { parseTvIntent, parseTvWatch } from './tv-parse.ts'
export type { TvAction, TvIntent, TvWatchIntent } from './tv-parse.ts'

let lastTvAt = 0
let lastVia: 'tv' | 'fire' = 'tv'
let lastWatchApp: TvAppId | undefined

const KEYS: Record<TvAction, string | null> = {
  on: null,
  off: 'KEY_POWER',
  volume_up: 'KEY_VOLUP',
  volume_down: 'KEY_VOLDOWN',
  volume_set: null,
  mute: 'KEY_MUTE',
  hdmi1: 'KEY_HDMI1',
  hdmi2: 'KEY_HDMI2',
  hdmi3: 'KEY_HDMI3',
  hdmi4: 'KEY_HDMI4',
  play: 'KEY_PLAY',
  pause: 'KEY_PAUSE',
  next: 'KEY_FF',
  prev: 'KEY_REWIND',
  home: 'KEY_HOME',
  back: 'KEY_RETURN',
  ok: 'KEY_ENTER',
  up: 'KEY_UP',
  down: 'KEY_DOWN',
  left: 'KEY_LEFT',
  right: 'KEY_RIGHT',
}

const FIRE_CODE: Partial<Record<TvAction, number>> = {
  on: 224,
  off: 223,
  play: 126,
  pause: 127,
  next: 87,
  prev: 88,
  home: 3,
  back: 4,
  ok: 23,
  up: 19,
  down: 20,
  left: 21,
  right: 22,
  mute: 91,
}

const REPLIES: Record<TvAction, string> = {
  on: 'Fernseher an — Magic-Packet ist raus.',
  off: 'Fernseher aus.',
  volume_up: 'Lauter.',
  volume_down: 'Leiser.',
  volume_set: 'Lautstärke gesetzt.',
  mute: 'Stumm umgeschaltet.',
  hdmi1: 'HDMI 1.',
  hdmi2: 'HDMI 2.',
  hdmi3: 'HDMI 3.',
  hdmi4: 'HDMI 4.',
  play: 'Play.',
  pause: 'Pause.',
  next: 'Weiter.',
  prev: 'Zurück.',
  home: 'Home.',
  back: 'Zurück.',
  ok: 'OK.',
  up: 'Hoch.',
  down: 'Runter.',
  left: 'Links.',
  right: 'Rechts.',
}

function recentTv(): boolean {
  return Date.now() - lastTvAt <= TV_FOLLOWUP_MS
}

export function isTvFollowUp(text: string): boolean {
  const t = text.trim()
  if (/^(ja|jo|yes|nein|no)\s*[.!?]*$/i.test(t)) return false
  return recentTv() && isFollowUpPhrase(t)
}

function markTvTurn(via: 'tv' | 'fire' = 'tv', app?: TvAppId) {
  lastTvAt = Date.now()
  lastVia = via
  if (app) lastWatchApp = app
}

export function tvStatusFromSettings() {
  const s = loadSettings()
  return {
    enabled: s.tv_enabled,
    name: s.tv_name,
    host: s.tv_host,
    mac: s.tv_mac,
    port: s.tv_port,
    paired: s.tv_paired,
    reachable: Boolean(s.tv_paired && s.tv_host),
  }
}

export async function discoverTvs(): Promise<{ items: TvDevice[]; message?: string }> {
  const res = await tvDiscoverNative()
  const items = res.items || []
  if (!items.length) {
    return {
      items,
      message:
        res.message ||
        'Nichts gefunden. Gleiches WLAN wie der TV? Gastnetz/AP-Isolation blockiert oft Geräte.',
    }
  }
  return { items, message: res.message }
}

export async function pairTv(body: {
  host?: string
  mac?: string
  name?: string
  port?: number
}): Promise<{ ok: boolean; message: string }> {
  const s = loadSettings()
  const host = (body.host || s.tv_host).trim()
  if (!host) return { ok: false, message: 'Keine TV-Adresse. Erst suchen oder Host eintragen.' }
  const name = body.name || s.tv_name || 'Wohnzimmer'
  const port = body.port || s.tv_port || 8001
  const res = await tvPairNative({
    host,
    port,
    name: 'Jarvis',
    token: s.tv_token || undefined,
  })
  if (!res.ok) {
    saveSettings({
      tv_host: host,
      tv_name: name,
      tv_mac: body.mac || s.tv_mac,
      tv_port: port,
      tv_paired: false,
    })
    return {
      ok: false,
      message:
        res.message ||
        'Koppeln fehlgeschlagen. Am TV erlauben, gleiches WLAN, kein Gastnetz.',
    }
  }
  saveSettings({
    tv_enabled: true,
    tv_host: host,
    tv_name: name,
    tv_mac: body.mac || s.tv_mac,
    tv_port: res.port || port,
    tv_token: res.token || s.tv_token,
    tv_paired: true,
  })
  return { ok: true, message: res.message || 'Gekoppelt. Token liegt auf dem Handy.' }
}

export async function testFireTv(opts?: { host?: string; port?: number }): Promise<{ ok: boolean; reply: string }> {
  const s = loadSettings()
  const host = (opts?.host || s.tv_fire_host || '').trim()
  const port = opts?.port || s.tv_fire_port || 5555
  if (!host) {
    return {
      ok: false,
      reply:
        'Keine Fire-TV-Adresse. IP unter Info → Netzwerk am Fire TV, dann hier eintragen und testen.',
    }
  }
  const res = await tvFireTestNative({ host, port })
  if (!res.ok) return { ok: false, reply: res.message || 'Fire TV nicht erreichbar.' }
  return { ok: true, reply: res.message || 'Fire TV per ADB da.' }
}

function fireHdmiAction(): TvAction {
  const n = Math.max(1, Math.min(4, Number(loadSettings().tv_fire_hdmi) || 3))
  return `hdmi${n}` as TvAction
}

async function sendFire(action: TvAction): Promise<string> {
  const s = loadSettings()
  const host = s.tv_fire_host.trim()
  const code = FIRE_CODE[action]
  if (!host) {
    return 'Fire TV: IP unter Einstellungen → Fernseher eintragen. ADB über Netzwerk, sonst nur HDMI am Samsung.'
  }
  if (code == null) {
    return 'Diese Taste gibt es am Fire TV so nicht. HDMI am Samsung oder andere Taste.'
  }
  const res = await tvFireKeyNative({ host, port: s.tv_fire_port || 5555, code })
  if (!res.ok) return res.message || 'Fire TV hat die Taste nicht genommen.'
  return REPLIES[action]
}

export async function testTv(): Promise<{ ok: boolean; reply: string }> {
  const s = loadSettings()
  if (!s.tv_host) return { ok: false, reply: 'Kein Host. Unter Einstellungen suchen oder eintragen.' }
  const res = await tvTestNative({
    host: s.tv_host,
    port: s.tv_port || 8002,
    token: s.tv_token || undefined,
  })
  if (!res.ok) {
    return {
      ok: false,
      reply: res.message || 'TV nicht erreichbar. An, gleiches WLAN, gekoppelt?',
    }
  }
  return { ok: true, reply: res.message || `Erreichbar: ${s.tv_name || s.tv_host}` }
}

async function sendOrExplain(action: TvAction, count = 1): Promise<string> {
  const s = loadSettings()
  const key = KEYS[action]
  if (!key) return REPLIES[action]
  const n = Math.max(1, Math.min(100, count))
  const res = await tvSendKeyNative({
    host: s.tv_host,
    port: s.tv_port || 8002,
    token: s.tv_token || undefined,
    key,
    count: n,
  })
  if (!res.ok) {
    return res.message || 'Taste nicht angekommen. TV an, gekoppelt, gleiches WLAN?'
  }
  return REPLIES[action]
}

/** Liste auf dem TV: erstes = OK, zweites = einmal runter + OK. Kein Live-Bild. */
export async function handleTvOrdinal(index: number): Promise<{ handled: boolean; reply?: string }> {
  if (!recentTv() && loadSettings().last_step_tool !== 'tv') {
    return { handled: false }
  }
  const n = Math.max(0, Math.min(8, Math.floor(index)))
  const fire = lastVia === 'fire'
  if (n > 0) {
    if (fire) {
      for (let i = 0; i < n; i += 1) {
        const step = await sendFire('down')
        if (step.includes('nicht') && i === 0) return { handled: true, reply: step }
      }
    } else {
      const step = await sendOrExplain('down', n)
      if (step.includes('nicht')) return { handled: true, reply: step }
    }
  }
  const ok = fire ? await sendFire('ok') : await sendOrExplain('ok')
  markTvTurn(lastVia)
  if (ok.includes('nicht') || ok.includes('Fire TV: IP')) return { handled: true, reply: ok }
  const which = n === 0 ? 'erste' : n === 1 ? 'zweite' : `${n + 1}.`
  const how = n === 0 ? 'OK' : 'Runter/OK'
  return {
    handled: true,
    reply: `Das ${which}: ${how}. Ich sehe den Schirm nicht — Falsches: „zurück“.`,
  }
}

function rememberedVolume(): number | null {
  const n = Number(loadSettings().tv_volume)
  return Number.isFinite(n) && n >= 1 && n <= 100 ? n : null
}

async function applyVolume(intent: { action: TvAction; steps?: number; level?: number }): Promise<string> {
  const steps = intent.steps || 1
  if (intent.action === 'volume_set') {
    const target = Math.max(1, Math.min(100, intent.level || 1))
    const from = rememberedVolume() ?? 30
    const delta = target - from
    if (delta === 0) {
      saveSettings({ tv_volume: String(target) })
      return `Lautstärke bleibt bei etwa ${target}.`
    }
    const reply = await sendOrExplain(delta > 0 ? 'volume_up' : 'volume_down', Math.abs(delta))
    if (reply.includes('nicht')) return reply
    saveSettings({ tv_volume: String(target) })
    return `Lautstärke etwa ${target}. Tasten, keine exakte Skala vom TV.`
  }
  if (intent.action === 'volume_up') {
    const reply = await sendOrExplain('volume_up', steps)
    if (reply.includes('nicht')) return reply
    const from = rememberedVolume() ?? 0
    const next = Math.min(100, from + steps)
    saveSettings({ tv_volume: String(next || steps) })
    return steps > 1 ? `Lauter um ${steps} — etwa ${next || steps}.` : 'Lauter.'
  }
  if (intent.action === 'volume_down') {
    const reply = await sendOrExplain('volume_down', steps)
    if (reply.includes('nicht')) return reply
    const from = rememberedVolume() ?? 0
    const next = Math.max(1, from - steps)
    saveSettings({ tv_volume: String(next) })
    return steps > 1 ? `Leiser um ${steps} — etwa ${next}.` : 'Leiser.'
  }
  return sendOrExplain(intent.action)
}

export async function handleTv(text: string): Promise<{ handled: boolean; reply?: string }> {
  const watch =
    parseTvWatch(text) ||
    (recentTv() ? parseTvWatch(text, { followUp: true, lastApp: lastWatchApp }) : null)
  if (watch) return handleTvWatch(watch)

  const follow = isTvFollowUp(text)
  let intent = parseTvIntent(text, follow)
  if (!intent && follow && lastVia === 'fire') {
    intent = parseTvIntent(`Fire TV ${text.trim()}`, false)
  }
  if (!intent) return { handled: false }

  const s = loadSettings()
  const volish =
    intent.action === 'volume_up' || intent.action === 'volume_down' || intent.action === 'volume_set'
  if (
    volish &&
    s.last_medium !== 'tv' &&
    (s.drive_mode || s.last_medium === 'spotify' || s.last_medium === 'drive') &&
    !TV_ANCHOR.test(text) &&
    !FIRE_ANCHOR.test(text)
  ) {
    return { handled: false }
  }
  if (!s.tv_enabled) {
    return { handled: true, reply: 'Fernseher ist aus (Einstellungen → Fernseher).' }
  }

  const fire = intent.via === 'fire'
  const vol =
    intent.action === 'volume_up' || intent.action === 'volume_down' || intent.action === 'volume_set'

  if (fire && !vol) {
    const bits: string[] = []
    if (intent.action === 'on' || intent.action.startsWith('hdmi')) {
      const hdmiAct = intent.action.startsWith('hdmi') ? intent.action : fireHdmiAction()
      if (s.tv_paired && s.tv_host) {
        bits.push(await sendOrExplain(hdmiAct))
      } else {
        bits.push(`Quelle ${hdmiAct.replace('hdmi', 'HDMI ')} am Samsung, wenn gekoppelt.`)
      }
      if (intent.action === 'on') bits.push(await sendFire('on'))
    } else {
      bits.push(await sendFire(intent.action))
    }
    markTvTurn('fire')
    return { handled: true, reply: bits.filter(Boolean).join(' ') }
  }

  if (!s.tv_host) {
    return { handled: true, reply: 'Kein TV hinterlegt. Unter Einstellungen suchen und koppeln.' }
  }

  if (intent.action === 'on') {
    if (!s.tv_mac) {
      return {
        handled: true,
        reply: 'Keine MAC für Wake-on-LAN. Unter Einstellungen eintragen oder neu suchen.',
      }
    }
    const wol = await tvWakeNative(s.tv_mac)
    markTvTurn(intent.via || 'tv')
    if (!wol.ok) {
      return {
        handled: true,
        reply:
          wol.message ||
          'WOL fehlgeschlagen. Magic-Packet braucht die Android-App, MAC und oft WOL am TV.',
      }
    }
    return {
      handled: true,
      reply:
        'Magic-Packet gesendet. Wacht er nicht auf: WOL am TV prüfen, gleiches WLAN, kein Gastnetz.',
    }
  }

  if (!s.tv_paired || !s.tv_token) {
    return {
      handled: true,
      reply: 'TV noch nicht gekoppelt. Unter Einstellungen koppeln und am Fernseher erlauben.',
    }
  }

  const reply = vol ? await applyVolume(intent) : await sendOrExplain(intent.action)
  markTvTurn()
  return { handled: true, reply }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms)
  })
}

function gateTv(): { ok: true; host: string; port: number; token?: string; mac: string } | { ok: false; reply: string } {
  const s = loadSettings()
  if (!s.tv_enabled) return { ok: false, reply: 'Fernseher ist aus (Einstellungen → Fernseher).' }
  if (!s.tv_host) return { ok: false, reply: 'Kein TV hinterlegt. Unter Einstellungen suchen und koppeln.' }
  if (!s.tv_paired || !s.tv_token) {
    return { ok: false, reply: 'TV noch nicht gekoppelt. Unter Einstellungen koppeln und am Fernseher erlauben.' }
  }
  return {
    ok: true,
    host: s.tv_host,
    port: s.tv_port || 8002,
    token: s.tv_token || undefined,
    mac: s.tv_mac || '',
  }
}

async function launchSamsungApp(app: TvAppId, meta?: string): Promise<{ ok: boolean; message: string }> {
  const gate = gateTv()
  if (!gate.ok) return { ok: false, message: gate.reply }
  const tryOnce = async () => {
    let last = 'App nicht gestartet.'
    for (const appId of TV_APP_IDS[app]) {
      const res = await tvLaunchAppNative({
        host: gate.host,
        port: gate.port,
        token: gate.token,
        appId,
        meta,
      })
      if (res.ok) return { ok: true, message: res.message || 'App gestartet.' }
      last = res.message || last
    }
    return { ok: false, message: last }
  }
  let res = await tryOnce()
  if (res.ok) return res
  if (gate.mac) {
    await tvWakeNative(gate.mac)
    await sleep(5000)
    res = await tryOnce()
    if (res.ok) return { ok: true, message: 'Fernseher geweckt. ' + (res.message || 'App gestartet.') }
    return {
      ok: false,
      message:
        (res.message || 'App nicht gestartet.') +
        ' Magic-Packet ist raus — wenn der TV noch aus ist, nochmal sagen.',
    }
  }
  return res
}

function watchReply(hit: WatchHit, launched: boolean, namedApp?: TvAppId): string {
  const label = (app: TvAppId) => TV_APP_LABEL[app]
  const title = hit.title
  const elsewhere = (hit.freeWhere || [])
    .map((f) => f.name)
    .filter((n) => !namedApp || n.toLowerCase() !== (TV_APP_LABEL[namedApp] || '').toLowerCase())
  const extraNames = (elsewhere.length ? elsewhere : hit.alsoFree).slice(0, 3)
  const extra = extraNames.length
    ? ` Kostenlos außerdem: ${extraNames.join(', ')} — die starte ich nicht, außer YouTube/Netflix/Disney+/Prime.`
    : ''
  if (!launched) {
    return hit.target
      ? `${title} wäre bei ${hit.target.provider}, aber die App ist nicht aufgegangen.`
      : `${title} finde ich in DE nicht kostenlos bei YouTube, Netflix, Disney+ oder Prime.${extra}`
  }
  const t = hit.target
  if (!t) return `${label(namedApp || 'youtube')} ist offen.`
  if (t.app === 'youtube' && (t.monetization === 'free' || t.monetization === 'ads')) {
    const unsure = t.url ? ' Nicht sicher, ob das der ganze Film ist.' : ''
    return `${title} — auf YouTube.${unsure}`
  }
  if (t.monetization === 'free') return `${title} — kostenlos auf ${label(t.app)}.`
  if (t.monetization === 'ads') return `${title} — mit Werbung auf ${label(t.app)}.`
  if (t.monetization === 'flatrate') {
    return `${title} ist nicht gratis, aber im Abo auf ${label(t.app)}. App ist offen.`
  }
  if (t.monetization === 'rent' || t.monetization === 'buy') {
    return `${label(t.app)} ist offen. ${title} ist dort zum Leihen oder Kaufen, nicht gratis.`
  }
  return `${label(t.app)} ist offen. Suchen Sie dort nach ${title}.${extra}`
}

function deepLinkFor(offer: WatchOffer | null): string | undefined {
  if (!offer?.url) return undefined
  if (offer.app === 'youtube') return youtubeDeepLink(offer.url) || offer.url
  return offer.url
}

async function handleTvWatch(intent: TvWatchIntent): Promise<{ handled: boolean; reply?: string }> {
  const gate = gateTv()
  if (!gate.ok) return { handled: true, reply: gate.reply }

  if (intent.kind === 'open') {
    const res = await launchSamsungApp(intent.app)
    markTvTurn('tv', intent.app)
    if (!res.ok) return { handled: true, reply: res.message }
    const hint =
      intent.app === 'youtube'
        ? ' Ich sehe den Bildschirm nicht. Anmelden: „OK“. Video: „Spiel … auf YouTube“. Treffer: „das zweite“.'
        : ' Ich sehe den Bildschirm nicht. „OK“ bestätigt, „das zweite“ wählt den zweiten Eintrag.'
    return { handled: true, reply: `${TV_APP_LABEL[intent.app]} ist offen.${hint}` }
  }

  if (intent.content === 'video' || (intent.app === 'youtube' && intent.content !== 'movie' && intent.content !== 'show')) {
    const found = await youtubeSearch(intent.title, 'video')
    const url = found || youtubeSearchLink(intent.title)
    const res = await launchSamsungApp('youtube', youtubeDeepLink(url) || url)
    markTvTurn('tv', 'youtube')
    if (!res.ok) return { handled: true, reply: res.message }
    if (found && youtubeVideoId(found)) {
      return { handled: true, reply: `YouTube: ${intent.title}. Ich sehe den Schirm nicht. Anmelden: „OK“. Andere Treffer: „das zweite“.` }
    }
    return { handled: true, reply: `YouTube sucht nach ${intent.title}. Ich sehe den Schirm nicht. „OK“ oder „das zweite“.` }
  }

  const hit = await lookupWatch(intent.title, {
    app: intent.app,
    kind: intent.content === 'movie' || intent.content === 'show' ? intent.content : undefined,
  })
  const app = hit.target?.app || intent.app
  if (!app) {
    markTvTurn()
    return { handled: true, reply: watchReply(hit, false) }
  }
  const res = await launchSamsungApp(app, deepLinkFor(hit.target))
  markTvTurn('tv', app)
  const spoken = watchReply(hit, res.ok, app)
  return { handled: true, reply: res.ok ? spoken : `${spoken} ${res.message}` }
}

export type { TvDevice, TvResult }
