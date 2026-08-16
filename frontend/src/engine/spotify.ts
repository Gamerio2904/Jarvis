import { loadSettings, saveSettings } from './store'
import type { SpotifyIntent } from './spotify-parse'

export { parseSpotifyIntent } from './spotify-parse'
export type { SpotifyIntent }

const SCOPES = [
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'streaming',
  'user-read-email',
].join(' ')

const VERIFIER_KEY = 'jarvis_spotify_verifier'

export type SpotifyTrack = {
  uri: string
  name: string
  artist: string
  preview?: string
}

export type SpotifyNow = {
  name: string
  artist: string
  playing: boolean
  source: 'connect' | 'preview'
}

let preview: HTMLAudioElement | null = null
let lastNow: SpotifyNow | null = null
const listeners = new Set<() => void>()

function emit() {
  for (const cb of listeners) cb()
}

export function subscribeSpotify(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function getSpotifyNow(): SpotifyNow | null {
  return lastNow
}

export function spotifyRedirect(): string {
  return `${window.location.origin.replace(/\/$/, '')}/`
}

export function spotifyConfigured(s = loadSettings()): boolean {
  return Boolean(s.spotify_client_id?.trim())
}

export function spotifyLoggedIn(s = loadSettings()): boolean {
  return Boolean(s.spotify_refresh?.trim() || s.spotify_access?.trim())
}

function b64url(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function randomVerifier(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return b64url(bytes)
}

async function challenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return b64url(new Uint8Array(hash))
}

export async function startSpotifyLogin(): Promise<{ ok: boolean; message: string }> {
  const id = loadSettings().spotify_client_id.trim()
  if (!id) {
    return { ok: false, message: 'Zuerst Client-ID unter Einstellungen → Musik.' }
  }
  const verifier = randomVerifier()
  sessionStorage.setItem(VERIFIER_KEY, verifier)
  const ch = await challenge(verifier)
  const q = new URLSearchParams({
    client_id: id,
    response_type: 'code',
    redirect_uri: spotifyRedirect(),
    code_challenge_method: 'S256',
    code_challenge: ch,
    scope: SCOPES,
    state: 'jarvis',
  })
  window.location.href = `https://accounts.spotify.com/authorize?${q}`
  return { ok: true, message: 'Spotify-Login…' }
}

export function spotifyLogout(): void {
  stopPreview()
  lastNow = null
  saveSettings({ spotify_access: '', spotify_refresh: '', spotify_expires_at: '' })
  emit()
}

async function tokenRequest(body: Record<string, string>): Promise<{ ok: boolean; message: string }> {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body).toString(),
  })
  const json = (await res.json().catch(() => ({}))) as {
    access_token?: string
    refresh_token?: string
    expires_in?: number
    error_description?: string
    error?: string
  }
  if (!res.ok || !json.access_token) {
    return {
      ok: false,
      message: json.error_description || json.error || 'Spotify-Token fehlgeschlagen. Redirect-URI prüfen.',
    }
  }
  const exp = Date.now() + Math.max(60, Number(json.expires_in) || 3600) * 1000
  saveSettings({
    spotify_access: json.access_token,
    spotify_refresh: json.refresh_token || loadSettings().spotify_refresh,
    spotify_expires_at: String(exp),
  })
  return { ok: true, message: 'Spotify verbunden.' }
}

export async function completeSpotifyLogin(url: string): Promise<{ ok: boolean; message: string }> {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return { ok: false, message: 'Ungültige Spotify-Antwort.' }
  }
  const err = parsed.searchParams.get('error')
  if (err) return { ok: false, message: `Spotify: ${err}` }
  const code = parsed.searchParams.get('code')
  if (!code) return { ok: false, message: 'Kein Code von Spotify.' }
  const verifier = sessionStorage.getItem(VERIFIER_KEY) || ''
  sessionStorage.removeItem(VERIFIER_KEY)
  if (!verifier) return { ok: false, message: 'Login abgelaufen. Nochmal anmelden.' }
  return tokenRequest({
    grant_type: 'authorization_code',
    code,
    redirect_uri: spotifyRedirect(),
    client_id: loadSettings().spotify_client_id.trim(),
    code_verifier: verifier,
  })
}

async function accessToken(): Promise<string | null> {
  const s = loadSettings()
  const exp = Number(s.spotify_expires_at) || 0
  if (s.spotify_access && exp - 30_000 > Date.now()) return s.spotify_access
  if (!s.spotify_refresh || !s.spotify_client_id.trim()) return s.spotify_access || null
  const res = await tokenRequest({
    grant_type: 'refresh_token',
    refresh_token: s.spotify_refresh,
    client_id: s.spotify_client_id.trim(),
  })
  return res.ok ? loadSettings().spotify_access : null
}

async function api(
  method: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; json: Record<string, unknown> }> {
  const token = await accessToken()
  if (!token) return { status: 401, json: { error: { message: 'Nicht bei Spotify angemeldet.' } } }
  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
  return { status: res.status, json }
}

function stopPreview() {
  if (!preview) return
  try {
    preview.pause()
    preview.src = ''
  } catch {
    /* ignore */
  }
  preview = null
}

function playPreview(url: string, name: string, artist: string): string {
  stopPreview()
  preview = new Audio(url)
  preview.play().catch(() => undefined)
  lastNow = { name, artist, playing: true, source: 'preview' }
  emit()
  return `Vorschau: ${name} — ${artist}. Volle Titel brauchen Spotify Premium und ein aktives Gerät.`
}

export async function searchTracks(query: string): Promise<{ ok: true; tracks: SpotifyTrack[] } | { ok: false; message: string }> {
  const q = query.trim()
  if (!q) return { ok: false, message: 'Was soll ich spielen?' }
  const { status, json } = await api('GET', `/search?${new URLSearchParams({ q, type: 'track', limit: '8' })}`)
  if (status === 401) return { ok: false, message: 'Spotify-Login abgelaufen. Unter Einstellungen → Musik anmelden.' }
  if (status < 200 || status >= 300) {
    return { ok: false, message: 'Spotify-Suche fehlgeschlagen. Netz und Login prüfen.' }
  }
  const items = ((json.tracks as { items?: Array<Record<string, unknown>> } | undefined)?.items || []) as Array<{
    name?: string
    uri?: string
    preview_url?: string
    artists?: Array<{ name?: string }>
  }>
  const tracks = items
    .filter((t) => t.uri)
    .map((t) => ({
      uri: String(t.uri),
      name: String(t.name || 'Titel'),
      artist: (t.artists || []).map((a) => a.name).filter(Boolean).join(', ') || 'Unbekannt',
      preview: t.preview_url || undefined,
    }))
  if (!tracks.length) return { ok: false, message: `Nichts zu „${q}“.` }
  return { ok: true, tracks }
}

async function connectPlay(uri: string): Promise<boolean> {
  const { status } = await api('PUT', '/me/player/play', { uris: [uri] })
  if (status === 204 || status === 202 || status === 200) return true
  if (status === 404) {
    const devices = await api('GET', '/me/player/devices')
    const list = ((devices.json.devices as Array<{ id?: string }> | undefined) || []).filter((d) => d.id)
    if (!list[0]?.id) return false
    await api('PUT', '/me/player', { device_ids: [list[0].id], play: true })
    const again = await api('PUT', `/me/player/play?device_id=${encodeURIComponent(list[0].id)}`, { uris: [uri] })
    return again.status === 204 || again.status === 202 || again.status === 200
  }
  return false
}

export async function playTrack(track: SpotifyTrack): Promise<string> {
  const ok = await connectPlay(track.uri)
  if (ok) {
    stopPreview()
    lastNow = { name: track.name, artist: track.artist, playing: true, source: 'connect' }
    emit()
    return `${track.name} — ${track.artist}.`
  }
  if (track.preview) return playPreview(track.preview, track.name, track.artist)
  return `${track.name} gefunden, aber kein Gerät. Spotify-App auf dem Handy öffnen (Premium) oder Vorschau fehlt.`
}

export async function playQuery(query: string): Promise<string> {
  if (!spotifyLoggedIn()) {
    return 'Spotify nicht verbunden. Einstellungen → Musik: Client-ID, dann anmelden.'
  }
  const found = await searchTracks(query)
  if (!found.ok) return found.message
  return playTrack(found.tracks[0])
}

export async function pauseSpotify(): Promise<string> {
  stopPreview()
  await api('PUT', '/me/player/pause')
  if (lastNow) lastNow = { ...lastNow, playing: false }
  emit()
  return 'Pause.'
}

export async function resumeSpotify(): Promise<string> {
  const { status } = await api('PUT', '/me/player/play')
  if (status === 204 || status === 202 || status === 200) {
    if (lastNow) lastNow = { ...lastNow, playing: true, source: 'connect' }
    emit()
    return 'Weiter.'
  }
  return 'Kein aktives Spotify-Gerät. App öffnen oder einen Titel sagen.'
}

export async function nextSpotify(): Promise<string> {
  stopPreview()
  await api('POST', '/me/player/next')
  return 'Nächster.'
}

export async function prevSpotify(): Promise<string> {
  stopPreview()
  await api('POST', '/me/player/previous')
  return 'Zurück.'
}

export async function refreshNow(): Promise<SpotifyNow | null> {
  if (lastNow?.source === 'preview' && preview && !preview.paused) return lastNow
  const { status, json } = await api('GET', '/me/player/currently-playing')
  if (status < 200 || status >= 300) return lastNow
  const item = json.item as { name?: string; artists?: Array<{ name?: string }> } | undefined
  if (!item?.name) return lastNow
  lastNow = {
    name: item.name,
    artist: (item.artists || []).map((a) => a.name).filter(Boolean).join(', ') || '',
    playing: Boolean(json.is_playing),
    source: 'connect',
  }
  emit()
  return lastNow
}

export async function handleSpotifyCommand(intent: SpotifyIntent): Promise<{
  handled: true
  reply: string
}> {
  if (intent.kind === 'pause') return { handled: true, reply: await pauseSpotify() }
  if (intent.kind === 'resume') return { handled: true, reply: await resumeSpotify() }
  if (intent.kind === 'next') return { handled: true, reply: await nextSpotify() }
  if (intent.kind === 'prev') return { handled: true, reply: await prevSpotify() }
  return { handled: true, reply: await playQuery(intent.query) }
}

export function pendingSpotifyCode(): string | null {
  try {
    const u = new URL(window.location.href)
    if (u.searchParams.get('error') && u.searchParams.get('state') === 'jarvis') return window.location.href
    if (u.searchParams.get('code') && u.searchParams.get('state') === 'jarvis') return window.location.href
  } catch {
    /* ignore */
  }
  return null
}
