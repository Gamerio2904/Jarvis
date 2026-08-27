/** Strip paste junk so the phone hits `http://HOST:PORT`, not a doubled URL. */
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
