import { loadSettings, saveSettings } from './store'
import { packVerified } from './action-fsm.ts'
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
  deviceCanLaunch,
  loadTvRegistry,
  pickTvDevice,
  tvLaunchVerified,
  upsertTvDevice,
  type TvDeviceRec,
} from './tv-registry.ts'
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
import type { ToolMeta } from './tools.ts'

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
  return recentTv() && isFollowUpPhrase(text)
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
  upsertTvDevice({
    id: 'tizen-default',
    name,
    kind: 'tizen',
    host,
    mac: body.mac || s.tv_mac,
    port: res.port || port,
    token: res.token || s.tv_token,
    paired: true,
    enabled: true,
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

function tvPack(ok: boolean, reply: string, action: string, label = 'Fernseher') {
  const packed = packVerified({
    domain: 'tv',
    intent: action,
    plan: action,
    label,
    preOk: true,
    observation: { nativeOk: ok },
    verify: (obs) => obs.nativeOk === true,
    successReply: reply,
    failReply: reply,
  })
  return { handled: true as const, reply: packed.reply, tool: packed.tool, lastTool: 'tv' as const }
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

function tvNativeOk(reply: string): boolean {
  return !/nicht angekommen|nicht erreichbar|fehlgeschlagen|nicht genommen|Fire TV: IP|so nicht\.|aus \(Einstellungen|nicht hinterlegt|nicht gekoppelt|Keine MAC|nicht gestartet/i.test(
    reply,
  )
}

export async function handleTv(text: string): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  const watch =
    parseTvWatch(text) ||
    (recentTv() ? parseTvWatch(text, { followUp: true, lastApp: lastWatchApp }) : null)
  if (watch) return handleTvWatch(watch, text)

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
    const packed = packVerified({
      domain: 'tv',
      intent: intent.action,
      plan: intent.action,
      label: 'Fernseher',
      preOk: false,
      preError: 'Fernseher aus.',
      observation: null,
      successReply: 'Fernseher ist aus (Einstellungen → Fernseher).',
      failReply: 'Fernseher ist aus (Einstellungen → Fernseher).',
    })
    return { handled: true, reply: packed.reply, tool: packed.tool, lastTool: 'tv' }
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
    const joined = bits.filter(Boolean).join(' ')
    return tvPack(tvNativeOk(joined), joined, intent.action)
  }

  if (!s.tv_host) {
    const packed = packVerified({
      domain: 'tv',
      intent: intent.action,
      plan: intent.action,
      label: 'Fernseher',
      preOk: false,
      preError: 'Kein Host.',
      observation: null,
      successReply: 'Kein TV hinterlegt. Unter Einstellungen suchen und koppeln.',
      failReply: 'Kein TV hinterlegt. Unter Einstellungen suchen und koppeln.',
    })
    return { handled: true, reply: packed.reply, tool: packed.tool, lastTool: 'tv' }
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
      return tvPack(
        false,
        wol.message ||
          'WOL fehlgeschlagen. Magic-Packet braucht die Android-App, MAC und oft WOL am TV.',
        'on',
      )
    }
    return tvPack(
      true,
      'Magic-Packet gesendet. Wacht er nicht auf: WOL am TV prüfen, gleiches WLAN, kein Gastnetz.',
      'on',
    )
  }

  if (!s.tv_paired || !s.tv_token) {
    const packed = packVerified({
      domain: 'tv',
      intent: intent.action,
      plan: intent.action,
      label: 'Fernseher',
      preOk: false,
      preError: 'Nicht gekoppelt.',
      observation: null,
      successReply: 'TV noch nicht gekoppelt. Unter Einstellungen koppeln und am Fernseher erlauben.',
      failReply: 'TV noch nicht gekoppelt. Unter Einstellungen koppeln und am Fernseher erlauben.',
    })
    return { handled: true, reply: packed.reply, tool: packed.tool, lastTool: 'tv' }
  }

  const reply = vol ? await applyVolume(intent) : await sendOrExplain(intent.action)
  markTvTurn()
  return tvPack(tvNativeOk(reply), reply, intent.action)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms)
  })
}

function gateTv(
  text = '',
  via?: 'tv' | 'fire',
): { ok: true; device: TvDeviceRec } | { ok: false; reply: string } {
  const s = loadSettings()
  if (!s.tv_enabled) return { ok: false, reply: 'Fernseher ist aus (Einstellungen → Fernseher).' }
  const devices = loadTvRegistry()
  const device = pickTvDevice(devices, text, via)
  if (!device) return { ok: false, reply: 'Kein TV in der Registry. Unter Einstellungen suchen und koppeln.' }
  if (device.kind === 'tizen' && (!device.paired || !device.token)) {
    return { ok: false, reply: 'TV noch nicht gekoppelt. Unter Einstellungen koppeln und am Fernseher erlauben.' }
  }
  return { ok: true, device }
}

async function launchSamsungApp(
  device: TvDeviceRec,
  app: TvAppId,
  meta?: string,
): Promise<{ ok: boolean; message: string; appId?: string }> {
  if (!deviceCanLaunch(device, app)) {
    return {
      ok: false,
      message:
        device.kind === 'fire'
          ? 'Fire TV startet hier keine Apps. Samsung oder HDMI.'
          : `${TV_APP_LABEL[app]} steht nicht in der Registry für ${device.name}.`,
    }
  }
  const tryOnce = async () => {
    let last = 'App nicht gestartet.'
    for (const appId of TV_APP_IDS[app]) {
      const res = await tvLaunchAppNative({
        host: device.host,
        port: device.port,
        token: device.token || undefined,
        appId,
        meta,
      })
      if (res.ok) return { ok: true, message: res.message || 'Start angekommen.', appId }
      last = res.message || last
    }
    return { ok: false, message: last }
  }
  let res = await tryOnce()
  if (res.ok) return res
  if (device.mac) {
    await tvWakeNative(device.mac)
    await sleep(5000)
    res = await tryOnce()
    if (res.ok) return { ok: true, message: 'Fernseher geweckt. ' + (res.message || 'Start angekommen.'), appId: res.appId }
    return {
      ok: false,
      message:
        (res.message || 'App nicht gestartet.') +
        ' Magic-Packet ist raus — wenn der TV noch aus ist, nochmal sagen.',
    }
  }
  return res
}

function watchReply(hit: WatchHit, launched: boolean, namedApp?: TvAppId, deviceName = 'Fernseher'): string {
  const label = (app: TvAppId) => TV_APP_LABEL[app]
  const title = hit.title
  const elsewhere = (hit.freeWhere || [])
    .map((f) => f.name)
    .filter((n) => !namedApp || n.toLowerCase() !== (TV_APP_LABEL[namedApp] || '').toLowerCase())
  const extraNames = (elsewhere.length ? elsewhere : hit.alsoFree).slice(0, 3)
  const extra = extraNames.length
    ? ` Kostenlos außerdem: ${extraNames.join(', ')} — die starte ich nicht, außer YouTube/Netflix/Disney+/Prime.`
    : ''
  const seen = ` Den Schirm an ${deviceName} sehe ich nicht.`
  if (!launched) {
    return hit.target
      ? `${title} wäre bei ${hit.target.provider}, aber der Start ist nicht angekommen.`
      : `${title} finde ich in DE nicht kostenlos bei YouTube, Netflix, Disney+ oder Prime.${extra}`
  }
  const t = hit.target
  if (!t) return `${label(namedApp || 'youtube')} — Start angekommen am ${deviceName}.${seen}`
  if (t.app === 'youtube' && (t.monetization === 'free' || t.monetization === 'ads')) {
    const unsure = t.url ? ' Nicht sicher, ob das der ganze Film ist.' : ''
    return `${title} — Start angekommen, YouTube am ${deviceName}.${unsure}${seen}`
  }
  if (t.monetization === 'free') return `${title} — Start angekommen, kostenlos auf ${label(t.app)}.${seen}`
  if (t.monetization === 'ads') return `${title} — Start angekommen, mit Werbung auf ${label(t.app)}.${seen}`
  if (t.monetization === 'flatrate') {
    return `${title} ist nicht gratis, aber im Abo auf ${label(t.app)}. Start angekommen am ${deviceName}.${seen}`
  }
  if (t.monetization === 'rent' || t.monetization === 'buy') {
    return `Start angekommen am ${deviceName}. ${title} ist dort zum Leihen oder Kaufen, nicht gratis.${seen}`
  }
  return `Start angekommen am ${deviceName}. Suchen Sie dort nach ${title}.${extra}${seen}`
}

function deepLinkFor(offer: WatchOffer | null): string | undefined {
  if (!offer?.url) return undefined
  if (offer.app === 'youtube') return youtubeDeepLink(offer.url) || offer.url
  return offer.url
}

function launchObs(device: TvDeviceRec, app: TvAppId, res: { ok: boolean; appId?: string }) {
  return {
    launched: Boolean(res.ok && res.appId),
    deviceId: device.id,
    paired: device.paired,
    kind: device.kind,
    app,
    appId: res.appId || '',
    apps: device.apps,
  }
}

function packLaunch(
  device: TvDeviceRec,
  app: TvAppId,
  res: { ok: boolean; message: string; appId?: string },
  successReply: string,
  failReply: string,
  action: string,
) {
  const packed = packVerified({
    domain: 'tv',
    intent: `launch:${app}`,
    plan: action,
    label: TV_APP_LABEL[app],
    observation: launchObs(device, app, res),
    verify: (obs) => tvLaunchVerified(obs),
    successReply,
    failReply,
    extra: { device: device.name, app },
  })
  return { handled: true as const, reply: packed.reply, tool: packed.tool, lastTool: 'tv' as const }
}

async function handleTvWatch(
  intent: TvWatchIntent,
  spoken = '',
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  const gate = gateTv(spoken)
  if (!gate.ok) {
    const packed = packVerified({
      domain: 'tv',
      intent: intent.kind,
      plan: 'watch',
      label: 'Fernseher',
      preOk: false,
      preError: gate.reply,
      observation: null,
      successReply: gate.reply,
      failReply: gate.reply,
    })
    return { handled: true, reply: packed.reply, tool: packed.tool, lastTool: 'tv' }
  }
  const device = gate.device

  if (intent.kind === 'open') {
    const res = await launchSamsungApp(device, intent.app)
    markTvTurn('tv', intent.app)
    const hint =
      intent.app === 'youtube'
        ? ' Anmelden: „OK“. Video: „Spiel … auf YouTube“. Treffer: „das zweite“.'
        : ' „OK“ bestätigt, „das zweite“ wählt den zweiten Eintrag.'
    return packLaunch(
      device,
      intent.app,
      res,
      `${TV_APP_LABEL[intent.app]} — Start angekommen am ${device.name}. Den Schirm sehe ich nicht.${hint}`,
      res.message || 'Start nicht angekommen.',
      'open',
    )
  }

  if (intent.content === 'video' || (intent.app === 'youtube' && intent.content !== 'movie' && intent.content !== 'show')) {
    const found = await youtubeSearch(intent.title, 'video')
    const url = found || youtubeSearchLink(intent.title)
    const res = await launchSamsungApp(device, 'youtube', youtubeDeepLink(url) || url)
    markTvTurn('tv', 'youtube')
    const okLine =
      found && youtubeVideoId(found)
        ? `YouTube: ${intent.title}. Start angekommen am ${device.name}. Den Schirm sehe ich nicht. Anmelden: „OK“. Andere Treffer: „das zweite“.`
        : `YouTube sucht nach ${intent.title}. Start angekommen am ${device.name}. Den Schirm sehe ich nicht.`
    return packLaunch(device, 'youtube', res, okLine, res.message || 'Start nicht angekommen.', 'play')
  }

  const hit = await lookupWatch(intent.title, {
    app: intent.app,
    kind: intent.content === 'movie' || intent.content === 'show' ? intent.content : undefined,
  })
  const app = hit.target?.app || intent.app
  if (!app) {
    markTvTurn()
    return { handled: true, reply: watchReply(hit, false, undefined, device.name) }
  }
  const res = await launchSamsungApp(device, app, deepLinkFor(hit.target))
  markTvTurn('tv', app)
  return packLaunch(
    device,
    app,
    res,
    watchReply(hit, true, app, device.name),
    `${watchReply(hit, false, app, device.name)} ${res.message || ''}`.trim(),
    'play',
  )
}

export type { TvDevice, TvResult }
