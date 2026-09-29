import { postForm } from './http-json.ts'
import { loadSettings, saveSettings } from './store.ts'

const TOKEN_URL =
  'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token'
const SKEW_MS = 60_000

/** Optionaler Bearer. Leer = anonym. Token-Fehler wirft nicht — Schicht bleibt anonym. */
export async function openskyAuthHeader(): Promise<Record<string, string>> {
  const s = loadSettings()
  const id = s.opensky_client_id.trim()
  const secret = s.opensky_client_secret.trim()
  if (!id || !secret) return {}
  const exp = Date.parse(s.opensky_expires_at || '')
  if (s.opensky_access.trim() && Number.isFinite(exp) && exp - SKEW_MS > Date.now()) {
    return { Authorization: `Bearer ${s.opensky_access.trim()}` }
  }
  try {
    const { status, json } = await postForm(TOKEN_URL, {
      grant_type: 'client_credentials',
      client_id: id,
      client_secret: secret,
    })
    const token = typeof json.access_token === 'string' ? json.access_token.trim() : ''
    const seconds = Number(json.expires_in)
    if (status >= 200 && status < 300 && token) {
      const ttl = Number.isFinite(seconds) && seconds > 30 ? seconds : 1800
      saveSettings({
        opensky_access: token,
        opensky_expires_at: new Date(Date.now() + ttl * 1000).toISOString(),
      })
      return { Authorization: `Bearer ${token}` }
    }
  } catch {
    /* anonym */
  }
  return {}
}
