/** RSS/HTML-Entities, auch doppelt kodiert (&amp;quot;). */

export function decodeHtml(raw: string): string {
  let s = String(raw || '')
  for (let i = 0; i < 2; i++) {
    s = s
      .replace(/&amp;/g, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&apos;/gi, "'")
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/gi, "'")
      .replace(/&#x22;/gi, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
  }
  return s.trim()
}
