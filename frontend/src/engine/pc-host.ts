/** Strip paste junk so the phone hits `http://HOST:PORT`, not a doubled URL. */

export const PC_HOST_HINT =
  'PC-IP nur 192.168… oder 10…. Nicht 172 (WSL), nicht Internet, nicht Hostname.'

export function sanitizePcHost(raw: string): string {
  let t = (raw || '').trim()
  if (!t) return ''
  t = t.replace(/^https?:\/\//i, '')
  t = t.split('/')[0]?.trim() || ''
  t = t.split(',')[0]?.trim() || ''
  t = t.replace(/^\[([^\]]+)\](?::\d+)?$/, '$1')
  const colon = (t.match(/:/g) || []).length
  if (colon === 1) {
    const m = /^(.+):(\d{2,5})$/.exec(t)
    if (m) return m[1]
  }
  return t
}

function octetOk(n: string): boolean {
  if (!/^\d{1,3}$/.test(n)) return false
  const v = Number(n)
  return v >= 0 && v <= 255
}

/** Handy darf nur LAN. 127/localhost nur für Tests und Dev. */
export function isAllowedPcHost(raw: string): boolean {
  const h = sanitizePcHost(raw)
  if (!h) return false
  if (h === 'localhost' || h === '127.0.0.1') return true
  const parts = h.split('.')
  if (parts.length !== 4 || !parts.every(octetOk)) return false
  if (parts[0] === '192' && parts[1] === '168') return true
  if (parts[0] === '10') return true
  return false
}
