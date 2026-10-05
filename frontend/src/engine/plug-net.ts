/** Hausnetz-IPv4, nicht die öffentliche Router-Adresse (z. B. 89.…). */
export function isLanIpv4(host: string): boolean {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host.trim())
  if (!m) return false
  const o = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])]
  if (o.some((n) => !Number.isInteger(n) || n > 255)) return false
  const [a, b] = o
  if (a === 10) return true
  if (a === 192 && b === 168) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 127) return true
  return false
}

export const LAN_IP_HINT =
  'Das ist keine Adresse im Hausnetz. Im Router unter Heimnetz/Geräte steht etwas wie 192.168.178.40 — nicht 89.…'

export function lanIpHint(host: string): string | null {
  const h = host.trim()
  if (!h) return null
  if (isLanIpv4(h)) return null
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(h)) return LAN_IP_HINT
  return null
}
