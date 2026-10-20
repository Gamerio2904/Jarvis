/** Nur der volle Satz. Alles andere bleibt liegen. */
export function parseNotfallProtokoll(text: string): boolean {
  let t = text.trim().toLowerCase().replace(/[.!?]+$/g, '').replace(/\s+/g, ' ').trim()
  if (!t || t.length > 48) return false
  t = t.replace(/^not(?:\s+fall|fall)[\s-]*protokoll\b/, 'notfallprotokoll')
  t = t.replace(/\beins\s+acht\s+sieben\b/, '187')
  return t === 'notfallprotokoll 187'
}

export const NOTFALL_REPLY = 'Notfallprotokoll 187. Das System fragt die Deinstallation ab.'
export const NOTFALL_REPLY_HERE = 'Notfallprotokoll 187 gilt auf dem installierten Gerät. Hier ist keine App zum Entfernen.'
export const NOTFALL_REPLY_FAIL = 'Notfallprotokoll 187. Die Deinstallation hat sich nicht geöffnet.'
