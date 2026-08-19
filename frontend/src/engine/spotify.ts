import { loadSettings, saveSettings } from './store'
import type { SpotifyIntent, SpotifySource } from './spotify-parse'

export { parseSpotifyIntent, spotifySourceLabel } from './spotify-parse'
export type { SpotifyIntent, SpotifySource }

const SCOPES = [
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'streaming',
  'user-read-email',
  'user-read-private',
].join(' ')

const VERIFIER_KEY = 'jarvis_spotify_verifier'
const SDK_SRC = 'https://sdk.scdn.co/spotify-player.js'
const PLAYER_NAME = 'Jarvis'

export type SpotifyTrack = {
  uri: string
  name: string
  artist: string
  preview?: string
  art?: string
}

export type SpotifyNow = {
  name: string
  artist: string
  playing: boolean
  source: SpotifySource
  art?: string
}

export type SpotifyPlayerStatus = 'idle' | 'loading' | 'ready' | 'unavailable'

type SdkPlayer = {
  connect: () => Promise<boolean>
  disconnect: () => void
  addListener: (event: string, cb: (arg: unknown) => void) => boolean
  pause: () => Promise<void>
  resume: () => Promise<void>
  nextTrack: () => Promise<void>
  previousTrack: () => Promise<void>
  activateElement: () => Promise<void>
  setVolume?: (volume: number) => Promise<void>
}

type SpotifySdk = {
  Player: new (opts: {
    name: string
    getOAuthToken: (cb: (token: string) => void) => void
    volume?: number
  }) => SdkPlayer
}

function spotifyGlobal(): SpotifySdk | undefined {
  return (window as unknown as { Spotify?: SpotifySdk }).Spotify
}

let preview: HTMLAudioElement | null = null
let lastNow: SpotifyNow | null = null
let playerStatus: SpotifyPlayerStatus = 'idle'
let sdkPlayer: SdkPlayer | null = null
let deviceId: string | null = null
let bootPromise: Promise<string | null> | null = null
let spotifyVol = 0.85
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

export function getSpotifyPlayerStatus(): SpotifyPlayerStatus {
  return playerStatus
}

export function internalSpotifyReady(): boolean {
  return Boolean(deviceId)
}

export function spotifyRedirect(): string {
  return `${window.location.origin.replace(/\/$/, '')}/`
}

export function spotifyConfigured(s = loadSettings()): boolean {
  return Boolean(s.spotify_client_id?.trim())
}

export function spotifyLoggedIn(s = loadSettings()): boolean {
  const refresh = Boolean(s.spotify_refresh?.trim())
  const access = Boolean(s.spotify_access?.trim())
  if (!refresh && !access) return false
  if (refresh) return true
  const exp = Number(s.spotify_expires_at) || 0
  return exp > Date.now() + 5_000
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

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' ? (v as Record<string, unknown>) : {}
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

function resetPlayer() {
  try {
    sdkPlayer?.disconnect()
  } catch {
    /* ignore */
  }
  sdkPlayer = null
  deviceId = null
  bootPromise = null
  playerStatus = 'idle'
}

export function spotifyLogout(): void {
  stopPreview()
  lastNow = null
  resetPlayer()
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

function playPreview(url: string, name: string, artist: string, art?: string): string {
  stopPreview()
  preview = new Audio(url)
  preview.play().catch(() => undefined)
  lastNow = { name, artist, playing: true, source: 'preview', art }
  emit()
  return `Vorschau: ${name} — ${artist}. Volle Titel in Jarvis brauchen Spotify Premium.`
}

function loadSdk(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false)
  if (spotifyGlobal()?.Player) return Promise.resolve(true)
  return new Promise((resolve) => {
    let done = false
    const finish = (ok: boolean) => {
      if (done) return
      done = true
      resolve(ok)
    }
    const w = window as unknown as { onSpotifyWebPlaybackSDKReady?: () => void }
    const prev = w.onSpotifyWebPlaybackSDKReady
    w.onSpotifyWebPlaybackSDKReady = () => {
      try {
        prev?.()
      } catch {
        /* ignore */
      }
      finish(Boolean(spotifyGlobal()?.Player))
    }
    if (!document.querySelector(`script[src="${SDK_SRC}"]`)) {
      const s = document.createElement('script')
      s.src = SDK_SRC
      s.async = true
      s.onerror = () => finish(false)
      document.head.appendChild(s)
    }
    window.setTimeout(() => finish(Boolean(spotifyGlobal()?.Player)), 12_000)
  })
}

function applySdkState(state: unknown) {
  const rec = asRecord(state)
  if (!rec.track_window) return
  const windowRec = asRecord(rec.track_window)
  const track = asRecord(windowRec.current_track)
  const name = String(track.name || '')
  if (!name) return
  const artists = Array.isArray(track.artists) ? track.artists : []
  const artist = artists
    .map((a) => asRecord(a).name)
    .filter(Boolean)
    .join(', ')
  const album = asRecord(track.album)
  const images = Array.isArray(album.images) ? album.images : []
  const art = String(asRecord(images[0]).url || '') || undefined
  lastNow = {
    name,
    artist,
    playing: !rec.paused,
    source: 'internal',
    art,
  }
  emit()
}

async function transferTo(id: string): Promise<boolean> {
  for (let i = 0; i < 6; i += 1) {
    const { status } = await api('PUT', '/me/player', { device_ids: [id], play: false })
    if (status === 204 || status === 202 || status === 200) return true
    await wait(400)
  }
  return false
}

async function bootPlayer(): Promise<string | null> {
  playerStatus = 'loading'
  emit()
  const loaded = await loadSdk()
  const Sdk = spotifyGlobal()
  if (!loaded || !Sdk) {
    playerStatus = 'unavailable'
    emit()
    return null
  }
  const token = await accessToken()
  if (!token) {
    playerStatus = 'unavailable'
    emit()
    return null
  }
  return new Promise((resolve) => {
    let settled = false
    const finish = (id: string | null) => {
      if (settled) return
      settled = true
      if (!id) {
        playerStatus = 'unavailable'
        emit()
      }
      resolve(id)
    }
    const player = new Sdk.Player({
      name: PLAYER_NAME,
      getOAuthToken: (cb) => {
        void accessToken().then((t) => cb(t || ''))
      },
      volume: 0.85,
    })
    sdkPlayer = player
    player.addListener('ready', (arg) => {
      const id = String(asRecord(arg).device_id || '')
      if (!id) {
        finish(null)
        return
      }
      deviceId = id
      playerStatus = 'ready'
      emit()
      void transferTo(id)
      finish(id)
    })
    player.addListener('not_ready', () => {
      deviceId = null
      playerStatus = 'unavailable'
      emit()
    })
    player.addListener('initialization_error', () => finish(null))
    player.addListener('authentication_error', () => finish(null))
    player.addListener('account_error', () => finish(null))
    player.addListener('player_state_changed', applySdkState)
    window.setTimeout(() => finish(deviceId), 10_000)
    void player.connect().then((ok) => {
      if (!ok) finish(null)
    })
  })
}

export async function ensureInternalPlayer(): Promise<string | null> {
  if (deviceId) return deviceId
  if (!spotifyLoggedIn()) return null
  if (!bootPromise) {
    bootPromise = bootPlayer().then((id) => {
      if (!id) bootPromise = null
      return id
    })
  }
  return bootPromise
}

export async function activateSpotifyElement(): Promise<void> {
  await ensureInternalPlayer()
  try {
    await sdkPlayer?.activateElement()
  } catch {
    /* autoplay lock */
  }
}

async function connectPlay(uri: string, onDevice?: string): Promise<boolean> {
  const qs = onDevice ? `?device_id=${encodeURIComponent(onDevice)}` : ''
  const { status } = await api('PUT', `/me/player/play${qs}`, { uris: [uri] })
  if (status === 204 || status === 202 || status === 200) return true
  if (status === 404) {
    const devices = await api('GET', '/me/player/devices')
    const list = ((devices.json.devices as Array<{ id?: string }> | undefined) || []).filter((d) => d.id)
    const pick = onDevice || list[0]?.id
    if (!pick) return false
    await api('PUT', '/me/player', { device_ids: [pick], play: true })
    const again = await api('PUT', `/me/player/play?device_id=${encodeURIComponent(pick)}`, { uris: [uri] })
    return again.status === 204 || again.status === 202 || again.status === 200
  }
  return false
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
    album?: { images?: Array<{ url?: string }> }
  }>
  const tracks = items
    .filter((t) => t.uri)
    .map((t) => ({
      uri: String(t.uri),
      name: String(t.name || 'Titel'),
      artist: (t.artists || []).map((a) => a.name).filter(Boolean).join(', ') || 'Unbekannt',
      preview: t.preview_url || undefined,
      art: t.album?.images?.[0]?.url,
    }))
  if (!tracks.length) return { ok: false, message: `Nichts zu „${q}“.` }
  return { ok: true, tracks }
}

export async function playTrack(track: SpotifyTrack): Promise<string> {
  stopPreview()
  await activateSpotifyElement()
  const internal = deviceId || (await ensureInternalPlayer())
  if (internal) {
    const ok = await connectPlay(track.uri, internal)
    if (ok) {
      lastNow = { name: track.name, artist: track.artist, playing: true, source: 'internal', art: track.art }
      emit()
      return `${track.name} — ${track.artist}.`
    }
  }
  const other = await connectPlay(track.uri)
  if (other) {
    lastNow = { name: track.name, artist: track.artist, playing: true, source: 'connect', art: track.art }
    emit()
    return `${track.name} — ${track.artist} (anderes Gerät).`
  }
  if (track.preview) return playPreview(track.preview, track.name, track.artist, track.art)
  return `${track.name} gefunden. Volle Titel: Premium, dann nochmal anmelden. Sonst fehlt die Vorschau.`
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
  if (sdkPlayer && deviceId) {
    try {
      await sdkPlayer.pause()
    } catch {
      await api('PUT', '/me/player/pause')
    }
  } else {
    await api('PUT', '/me/player/pause')
  }
  if (lastNow) lastNow = { ...lastNow, playing: false }
  emit()
  return 'Pause.'
}

export async function resumeSpotify(): Promise<string> {
  await activateSpotifyElement()
  if (sdkPlayer && deviceId) {
    try {
      await sdkPlayer.resume()
      if (lastNow) lastNow = { ...lastNow, playing: true, source: 'internal' }
      emit()
      return 'Weiter.'
    } catch {
      /* Connect-API */
    }
  }
  const qs = deviceId ? `?device_id=${encodeURIComponent(deviceId)}` : ''
  const { status } = await api('PUT', `/me/player/play${qs}`)
  if (status === 204 || status === 202 || status === 200) {
    if (lastNow) lastNow = { ...lastNow, playing: true, source: deviceId ? 'internal' : 'connect' }
    emit()
    return 'Weiter.'
  }
  return 'Nichts zum Fortsetzen. Sagen Sie einen Titel, z. B. „Spiel Hotel California“.'
}

export async function setSpotifyVolume(level: number): Promise<string> {
  const pct = Math.max(1, Math.min(100, Math.round(level)))
  spotifyVol = pct / 100
  if (preview) preview.volume = spotifyVol
  if (sdkPlayer?.setVolume) {
    try {
      await sdkPlayer.setVolume(spotifyVol)
    } catch {
      /* Connect */
    }
  }
  await api('PUT', `/me/player/volume?volume_percent=${pct}`)
  return `Lautstärke ${pct}.`
}

export async function nudgeSpotifyVolume(delta: number): Promise<string> {
  const next = Math.max(1, Math.min(100, Math.round(spotifyVol * 100 + delta * 8)))
  return setSpotifyVolume(next)
}

export async function nextSpotify(): Promise<string> {
  stopPreview()
  if (sdkPlayer && deviceId) {
    try {
      await sdkPlayer.nextTrack()
      return 'Nächster.'
    } catch {
      /* Connect-API */
    }
  }
  await api('POST', '/me/player/next')
  return 'Nächster.'
}

export async function prevSpotify(): Promise<string> {
  stopPreview()
  if (sdkPlayer && deviceId) {
    try {
      await sdkPlayer.previousTrack()
      return 'Zurück.'
    } catch {
      /* Connect-API */
    }
  }
  await api('POST', '/me/player/previous')
  return 'Zurück.'
}

export async function refreshNow(): Promise<SpotifyNow | null> {
  if (lastNow?.source === 'preview' && preview && !preview.paused) return lastNow
  if (lastNow?.source === 'internal' && lastNow.playing) return lastNow
  const { status, json } = await api('GET', '/me/player/currently-playing')
  if (status < 200 || status >= 300) return lastNow
  const item = json.item as
    | { name?: string; artists?: Array<{ name?: string }>; album?: { images?: Array<{ url?: string }> } }
    | undefined
  if (!item?.name) return lastNow
  lastNow = {
    name: item.name,
    artist: (item.artists || []).map((a) => a.name).filter(Boolean).join(', ') || '',
    playing: Boolean(json.is_playing),
    source: deviceId ? 'internal' : 'connect',
    art: item.album?.images?.[0]?.url,
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
  if (intent.kind === 'volume_set') return { handled: true, reply: await setSpotifyVolume(intent.level) }
  if (intent.kind === 'volume_up') return { handled: true, reply: await nudgeSpotifyVolume(intent.steps) }
  if (intent.kind === 'volume_down') return { handled: true, reply: await nudgeSpotifyVolume(-intent.steps) }
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
