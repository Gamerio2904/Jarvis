/** YouTube-Link plus Schnittwort. Eine nackte URL und der Fernseher bleiben außen. */

export type ClipCut = {
  kind: 'cut'
  urls: string[]
  titles: Record<number, string>
}

export type ClipIntent = ClipCut | { kind: 'status' }

const URL_RE =
  /https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?[^\s<>"']*?\bv=|shorts\/)|youtu\.be\/)([\w-]{6,})/gi

const CUT =
  /\b(?:highlights?|schneid\w*|top\s*(?:[1-3]|eins|zwei|drei)|reels?|shorts?)\b/i

const DEVICE = /\b(?:fernseher|fernsehen|fernseh|\btv\b|tizen|samsung|fire\s*tv)\b/i

const STATUS = /^\s*clip[-\s]?status\s*[.!?]*$/i

const TITLE_RE = /\btitel\s*([1-3])\s*[:\-]\s*([^.,\n]{2,48})/gi

export function youtubeUrls(text: string): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const match of text.matchAll(URL_RE)) {
    const id = match[1]
    if (!id || seen.has(id)) continue
    seen.add(id)
    out.push(`https://www.youtube.com/watch?v=${id}`)
    if (out.length >= 3) break
  }
  return out
}

export function clipTitles(text: string): Record<number, string> {
  const titles: Record<number, string> = {}
  for (const match of text.matchAll(TITLE_RE)) {
    const n = Number(match[1])
    const title = match[2].replace(/\s+/g, ' ').trim()
    if (n >= 1 && n <= 3 && title) titles[n] = title
  }
  return titles
}

export function parseClipIntent(text: string): ClipIntent | null {
  const raw = (text || '').trim()
  if (!raw) return null
  if (STATUS.test(raw)) return { kind: 'status' }
  if (DEVICE.test(raw)) return null
  const urls = youtubeUrls(raw)
  const bare = raw.replace(/https?:\/\/\S+/gi, ' ')
  if (!urls.length || !CUT.test(bare)) return null
  return { kind: 'cut', urls, titles: clipTitles(raw) }
}

export function confirmReply(urlCount: number): string {
  const n = urlCount === 1 ? '1 Link' : `${urlCount} Links`
  return `Bis zu drei Stellen aus ${n}, Datei unter Videos\\Jarvis, kein Upload. YouTube erlaubt den Download nur über den eigenen Knopf. Ja?`
}
