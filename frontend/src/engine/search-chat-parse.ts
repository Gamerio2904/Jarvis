export function parseChatSearch(text: string): string | null {
  const t = text.trim()
  if (!t || t.length > 160) return null
  const a = /^\s*wann\s+hatte\s+ich\s+(?:das\s+)?(?:mit\s+(?:der|dem|den)\s+)?(.+?)\s*$/i.exec(t)
  if (a) return a[1].replace(/[.!?]+$/g, '').trim()
  const b = /^\s*(?:suche\s+im\s+chat\s+nach|im\s+gespräch\s+nach)\s+(.+?)\s*$/i.exec(t)
  if (b) return b[1].replace(/[.!?]+$/g, '').trim()
  return null
}
