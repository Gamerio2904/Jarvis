import { normalizeUtterance } from './utterance.ts'

export function parseRecallIntent(text: string): string | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 160) return null
  if (/^\s*was\s+weißt\s+du\s+über\s+mich\b/i.test(t)) return null
  if (/^\s*was\s+weiß\s+ich\s+(?:noch\s+)?über\s+mich\b/i.test(t)) return null
  const who = /^\s*wer\s+ist\s+(?:meine|mein)\s+([a-zäöüß]+)(?:\s+und\b.*)?\s*$/i.exec(t)
  if (who) return who[1].replace(/[.!?]+$/g, '').trim()
  const whenBday =
    /^\s*wann\s+hat\s+(?:die\s+|der\s+|das\s+|meine\s+|mein\s+)?(.+?)\s+geburtstag\s*$/i.exec(t) ||
    /^\s*wann\s+ist\s+(?:der\s+|die\s+)?(.+?)(?:'?s)?\s+geburtstag\s*$/i.exec(t)
  if (whenBday) return whenBday[1].replace(/[.!?]+$/g, '').replace(/^der\s+|^die\s+/i, '').trim()
  if (/^\s*was\s+war\s+(gestern|heute)\b/i.test(t)) return 'episode'
  const personalValue =
    /^\s*(?:was\s+ist|wie\s+(?:lautet|war|heißt))\s+(?:nochmal\s+)?mein(?:e|en|em|er)?\s+(.+?)\s*$/i.exec(t) ||
    /^\s*was\s+habe\s+ich\s+(?:als|für)\s+(.+?)\s+(?:gespeichert|notiert)\s*$/i.exec(t)
  if (personalValue) {
    const q = personalValue[1]
      .replace(/[.!?]+$/g, '')
      .replace(/^(?:der|die|das|den|dem)\s+/i, '')
      .trim()
    if (q.length >= 3 && !/^(?:du|ich|mich|dir|mir|man|heute|gestern)$/i.test(q)) return q
  }
  const a = /^\s*was\s+weißt\s+du\s+über\s+(?:den\s+|die\s+|das\s+)?(.+?)\s*$/i.exec(t)
  if (a) return a[1].replace(/[.!?]+$/g, '').trim()
  /** Dieselbe Frage ans Gedächtnis, nur aus Nutzersicht gesprochen. */
  const aIch = /^\s*was\s+weiß\s+ich\s+(?:noch\s+)?über\s+(?:den\s+|die\s+|das\s+)?(.+?)\s*$/i.exec(t)
  if (aIch) return aIch[1].replace(/[.!?]+$/g, '').trim()
  const b = /^\s*wo\s+stand\s+das\s+mit\s+(?:der|dem|den)?\s*(.+?)\s*$/i.exec(t)
  if (b) return b[1].replace(/[.!?]+$/g, '').trim()
  const c = /^\s*erinnerst\s+du\s+dich\s+an\s+(.+?)\s*$/i.exec(t)
  if (c) {
    const q = c[1].replace(/[.!?]+$/g, '').trim()
    if (/^mich$/i.test(q)) return null
    return q
  }
  if (/\b(?:wlan|wifi|fritzbox|router)\b/i.test(t)) {
    const d = /^\s*was\s+ist\s+(?:mein\s+)?(.+?)\s*$/i.exec(t)
    if (d) return d[1].replace(/[.!?]+$/g, '').trim()
  }
  if (/\b(?:japan|tokyo|reise)/i.test(t) && /\b(?:wollte\s+ich|welche\s+reisen|plane\s+ich)\b/i.test(t)) {
    return t.replace(/[.!?]+$/g, '').trim()
  }
  const when = /^\s*wann\s+(?:war|ist)\s+(?:nochmal\s+)?(?:der\s+|die\s+|das\s+)?(.+?)\s*$/i.exec(t)
  if (when) {
    const q = when[1].replace(/[.!?]+$/g, '').replace(/\s+den\s+ich\s+.+$/i, '').trim()
    if (q.length >= 3) return q
  }
  if (/^\s*(?:basierend\s+auf|was\s+du\s+über\s+mich\s+weißt)/i.test(t)) return 'Profil'
  return null
}
