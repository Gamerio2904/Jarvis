import { getJson, postJson } from './http-json.ts'
import { loadSettings, saveSettings } from './store.ts'
import {
  PRESENCE_PORT,
  isPresenceLan,
  newPresenceToken,
  presenceUrl,
  sanitizePresenceHost,
} from './presence-lan.ts'
import { presenceListenHint } from './presence-http.ts'

export {
  PRESENCE_PORT,
  PRESENCE_HEADER,
  isPresenceLan,
  newPresenceToken,
  presenceUrl,
  presenceWriteAllowed,
  sanitizePresenceHost,
  tokensMatch,
} from './presence-lan.ts'
export { handlePresenceHttp, presenceListenHint, PRESENCE_DROP_CAP } from './presence-http.ts'

export const ROLE_COPY =
  'Tablet allein = Hirn. Tablet + Handy = Fenster braucht Token. PC ist Werkzeug (:18790) oder Fenster (:18791).'

export const WONT_COPY =
  'Kein Cloud-Account, kein Quest-Must, kein zweites IndexedDB als Wahrheit.'

export const VR_PARKING =
  'VR / WebXR / Quest bleibt Parking — kein Helm, kein „kommt als Nächstes“.'

export function isPresenceWindow(s = loadSettingsSafe()): boolean {
  return s.presence_role === 'window'
}

export function isPresenceBrain(s = loadSettingsSafe()): boolean {
  return s.presence_role !== 'window'
}

export function rotatePresenceToken(): string {
  const token = newPresenceToken()
  try {
    saveSettings({ presence_token: token })
  } catch {
    /* */
  }
  return token
}

export function brainPresenceCard(host: string, port = PRESENCE_PORT, token = ''): {
  url: string
  host: string
  port: number
  token: string
} {
  const h = sanitizePresenceHost(host)
  return { url: presenceUrl(h, port, token), host: h, port, token }
}

export async function pingPresencePeer(
  host: string,
  token: string,
  port = PRESENCE_PORT,
): Promise<{ ok: boolean; reply: string }> {
  const h = sanitizePresenceHost(host)
  if (!h || !isPresenceLan(h)) return { ok: false, reply: 'IP nur 192.168… oder 10….' }
  if (!token.trim()) return { ok: false, reply: 'Token fehlt.' }
  try {
    const { status, json } = await getJson(`http://${h}:${port}/v1/presence`, {
      Accept: 'application/json',
      'X-Jarvis-Token': token.trim(),
      Authorization: `Bearer ${token.trim()}`,
    })
    if (status >= 200 && status < 300 && json && (json as { ok?: boolean }).ok) {
      return { ok: true, reply: 'Hirn erreicht. Gleiches Gespräch.' }
    }
    const err = (json as { error?: string } | null)?.error
    return { ok: false, reply: err || `Hirn nicht im WLAN / Presence aus (${status}).` }
  } catch {
    return { ok: false, reply: 'Handy nicht im WLAN / Presence aus. Kein Fake-Smalltalk.' }
  }
}

export async function postPresenceLine(
  text: string,
  host?: string,
  token?: string,
  port = PRESENCE_PORT,
): Promise<{ ok: boolean; reply: string }> {
  const s = loadSettingsSafe()
  const h = sanitizePresenceHost(host || s.presence_peer_host || '')
  const t = (token || s.presence_token || '').trim()
  if (!h || !isPresenceLan(h) || !t) {
    return { ok: false, reply: 'Fenster ohne Token/IP. Kein lokales Gedächtnis.' }
  }
  try {
    const { status, json } = await postJson(
      `http://${h}:${port}/v1/presence`,
      {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Jarvis-Token': t,
        Authorization: `Bearer ${t}`,
      },
      { text },
    )
    const o = json as { ok?: boolean; reply?: string; error?: string } | null
    if (status >= 200 && status < 300 && o?.ok) return { ok: true, reply: o.reply || '' }
    return { ok: false, reply: o?.error || 'Hirn nicht erreicht.' }
  } catch {
    return { ok: false, reply: 'Handy nicht im WLAN / Presence aus. Kein Fake-Smalltalk.' }
  }
}

export function bindStatusLine(enabled: boolean, bindOk = false, port = PRESENCE_PORT): string {
  if (!enabled) return 'Presence aus. Zweites Gerät schreibt nicht ins Handy-Gedächtnis.'
  return presenceListenHint(bindOk, port)
}

function loadSettingsSafe(): ReturnType<typeof loadSettings> {
  try {
    return loadSettings()
  } catch {
    return {
      presence_role: 'brain',
      presence_peer_host: '',
      presence_token: '',
    } as ReturnType<typeof loadSettings>
  }
}
