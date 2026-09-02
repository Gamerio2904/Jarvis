/** WebRTC-Signaling + Live-Verify. JPEG ist kein Peer. Kein TURN, kein Cloud-Signaling. */

export type RtcMode = 'webrtc' | 'lan-jpeg'
export type RtcWebrtc = 'ready' | 'off' | 'missing' | 'error'

export type RtcSession = {
  sessionId: string
  webrtc: RtcWebrtc
  mode: RtcMode
  connected?: boolean
  track?: boolean
  frame?: boolean
  ice?: 'host' | 'none'
  sdp?: string
}

export type RtcStreamObs = {
  action?: string
  reached?: boolean
  can?: boolean
  ok?: boolean
  sessionId?: string
  webrtc?: string
  mode?: string
  connected?: boolean
  track?: boolean
  frame?: boolean
  ice?: string
}

export const RTC_LIVE_WEBRTC = 'Live-Bild läuft (WebRTC).'
export const RTC_LIVE_JPEG =
  'Live-Bilder vom PC. WebRTC-Peer ist nicht aufgebaut — nur LAN-Einzelbilder.'
export const RTC_OFF = 'Live-Bild nicht verbunden. JarvisPC.bat muss laufen.'
export const RTC_STOP = 'Live-Bild aus.'
export const RTC_NO_SESSION = 'Kein Live-Bild offen.'

export function sdpLooksLikeOffer(sdp: string): boolean {
  const t = String(sdp || '')
  return /\bv=0\b/.test(t) && /\bm=/.test(t)
}

export function sdpLooksLikeAnswer(sdp: string): boolean {
  const t = String(sdp || '')
  return /\bv=0\b/.test(t) && /\bm=/.test(t) && /\ba=answer\b/i.test(t)
}

export function iceKind(candidate: string): 'host' | 'srflx' | 'relay' | 'unknown' {
  const t = String(candidate || '').toLowerCase()
  if (/\btyp\s+relay\b|\bturn:/.test(t)) return 'relay'
  if (/\btyp\s+srflx\b|\bstun:/.test(t)) return 'srflx'
  if (/\btyp\s+host\b/.test(t)) return 'host'
  return 'unknown'
}

export function isLanIce(candidate: string): boolean {
  return iceKind(candidate) === 'host'
}

function asWebrtc(raw: unknown): RtcWebrtc | undefined {
  const v = String(raw || '')
  if (v === 'ready' || v === 'off' || v === 'missing' || v === 'error') return v
  return undefined
}

export function parseRtcSession(json: Record<string, unknown> | null | undefined): RtcSession | null {
  if (!json || json.ok === false) return null
  const sessionId = String(json.sessionId || json.session || '').trim()
  if (!sessionId) return null
  const mode = json.mode === 'webrtc' ? 'webrtc' : 'lan-jpeg'
  const webrtc = asWebrtc(json.webrtc) || (mode === 'webrtc' ? 'ready' : 'off')
  return {
    sessionId,
    webrtc,
    mode,
    connected: json.connected === true,
    track: json.track === true,
    frame: json.frame === true || Boolean(json.image),
    ice: json.ice === 'host' ? 'host' : json.ice === 'none' ? 'none' : undefined,
    sdp: typeof json.sdp === 'string' || typeof json.answer === 'string' ? String(json.sdp || json.answer) : undefined,
  }
}

export function rtcStreamVerified(obs: RtcStreamObs): { ok: boolean; error?: string } {
  if (!obs || obs.reached === false) return { ok: false, error: 'PC nicht erreicht.' }
  if (obs.can === false) return { ok: false, error: 'Live-Bild hat der Agent nicht.' }
  const action = String(obs.action || 'stream')
  if (action === 'stream_stop') return { ok: true }
  const sessionId = String(obs.sessionId || '').trim()
  if (!sessionId) return { ok: false, error: 'Keine Live-Sitzung.' }
  if (obs.webrtc === 'ready') {
    if (obs.connected !== true) return { ok: false, error: 'WebRTC nicht verbunden.' }
    if (obs.track !== true) return { ok: false, error: 'Kein Video-Track.' }
    if (obs.ice === 'relay') return { ok: false, error: 'TURN ist aus. Nur LAN-Host.' }
    return { ok: true }
  }
  if (obs.mode === 'lan-jpeg') {
    if (obs.frame !== true) return { ok: false, error: 'Kein Live-Einzelbild.' }
    return { ok: true }
  }
  return { ok: false, error: 'Live-Bild nicht verbunden.' }
}

export function rtcSuccessReply(obs: RtcStreamObs): string {
  if (obs.webrtc === 'ready' && obs.connected && obs.track) return RTC_LIVE_WEBRTC
  if (obs.mode === 'lan-jpeg' && obs.frame) return RTC_LIVE_JPEG
  return RTC_OFF
}
