import { normalizePlaceName } from './places-parse.ts'
import { normalizeUtterance } from './utterance.ts'

export type ContactsScanIntent = { kind: 'contacts_scan' }
export type ContactsListIntent = { kind: 'contacts_list' }
export type EmailStoreIntent = { kind: 'email_store'; name: string; email: string }

export type MailIntent =
  | { kind: 'mail_read'; query: string }
  | { kind: 'mail_write'; to: string; subject: string; body: string }

export type WaInboxIntent =
  | { kind: 'wa_inbox'; query: string }
  | { kind: 'wa_reply'; query: string; body: string }

const SCAN =
  /^\s*(?:(?:scann?e?|lies|lese|einlesen|importier(?:e)?)(?:\s+(?:bitte|mal|jetzt))?\s+(?:mein(?:e[nrs]?)?\s+|das\s+|die\s+)?(?:telefon[- ]?kontakte|kontakte|telefonbuch|adressbuch)|(?:telefon[- ]?kontakte|kontakte|telefonbuch|adressbuch)\s+(?:scannen|einlesen|importieren|vom\s+handy)|kontakte\s+vom\s+(?:handy|telefon))\s*[.!?]*\s*$/i

const LIST_CONTACTS =
  /^\s*(?:zeig(?:e)?(?:\s+mir)?(?:\s+(?:die|meine[nrs]?))?\s+(?:telefon[- ]?kontakte|kontakte|telefonbuch|adressbuch|nummern)|welche(?:n)?\s+(?:kontakte|nummern|adressen)\s+(?:kennst\s+du|hast\s+du|liegen)|(?:meine[nrs]?\s+)?(?:kontakte|telefonbuch|nummern)(?:\s+(?:anzeigen|zeigen|auflisten))?)\s*[.!?]*\s*$/i

const EMAIL_STORE =
  /^\s*(?:(?:e-?mail|mail)\s+von\s+(.+?)\s*[:-]\s*(.+)|(.+?)\s*[,:]\s*(?:e-?mail|mail)\s+(.+))\s*$/i

const EMAIL_SPACE =
  /^\s*([A-ZÄÖÜa-zäöüß][\wÄÖÜäöüß.-]{1,28})\s+(?:e-?mail|mail)\s+([^\s@]+@[^\s@]+\.[^\s@]+)\s*$/i

const MAIL_READ =
  /^\s*(?:lies|lese|zeig(?:e)?(?:\s+mir)?|was\s+steht(?:\s+denn)?(?:\s+in)?)\s+(?:meine[nrs]?\s+|die\s+|neue[n]?\s+)?(?:e-?mails?|mails?)(?:\s+(?:von|an)\s+(.+?))?\s*[.!?]*\s*$/i

const MAIL_NEW =
  /^\s*(?:neue[n]?\s+(?:e-?mails?|mails?)|e-?mail[- ]?eingang|posteingang)\s*[.!?]*\s*$/i

const MAIL_WRITE =
  /^\s*(?:schreib(?:e)?(?:\s+mal)?|verfass(?:e)?|sende?)\s+(?:mir\s+)?(?:eine?\s+)?(?:e-?mail|email)(?:\s+an\s+(.+?))?(?:\s+(?:wegen|betreff)\s+(.+?))?(?:\s*[:-]\s*(.+))?\s*$/i

const MAIL_TO =
  /^\s*(?:e-?mail|email)\s+an\s+(.+?)\s*$/i

const WA_INBOX =
  /^\s*(?:was\s+steht(?:\s+denn)?\s+(?:auf|bei)\s+whatsapp|whatsapps?(?:\s+(?:eingang|nachrichten?))?(?:\s+von\s+(.+?))?|neue[n]?\s+whatsapps?)\s*[.!?]*\s*$/i

const WA_REPLY =
  /^\s*(?:antwort(?:e)?|reply)\s+(?:(?:auf\s+)?whatsapp\s+)?(?:(?:an|der|dem|die)\s+)?(.+?)(?:\s+auf\s+whatsapp)?(?:\s*[:-]\s*|\s+)(.+)\s*$/i

const WA_REPLY_BARE =
  /^\s*(?:whatsapps?\s+beantworten|beantwort(?:e)?\s+(?:die\s+)?whatsapps?)\s*[.!?]*\s*$/i

export function parseContactsScan(text: string): ContactsScanIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 120) return null
  return SCAN.test(t) ? { kind: 'contacts_scan' } : null
}

export function parseContactsList(text: string): ContactsListIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 120) return null
  if (SCAN.test(t)) return null
  return LIST_CONTACTS.test(t) ? { kind: 'contacts_list' } : null
}

export function parseEmailStore(text: string): EmailStoreIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 160) return null
  const m = EMAIL_STORE.exec(t)
  if (m) {
    const name = normalizePlaceName(m[1] || m[3] || '')
    const email = (m[2] || m[4] || '').trim().toLowerCase()
    if (name && looksLikeEmail(email) && name !== email) return { kind: 'email_store', name, email }
  }
  const space = EMAIL_SPACE.exec(t)
  if (space) {
    const name = normalizePlaceName(space[1])
    const email = space[2].trim().toLowerCase()
    if (name && looksLikeEmail(email)) return { kind: 'email_store', name, email }
  }
  return null
}

export function parseMailIntent(text: string): MailIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 220) return null
  if (!/\b(e-?mails?|emails?|mails?|posteingang)\b/i.test(t)) return null
  if (MAIL_NEW.test(t)) return { kind: 'mail_read', query: '' }
  const read = MAIL_READ.exec(t)
  if (read) return { kind: 'mail_read', query: cleanWho(read[1] || '') }
  const write = MAIL_WRITE.exec(t)
  if (write) {
    return {
      kind: 'mail_write',
      to: cleanWho(write[1] || ''),
      subject: (write[2] || '').trim(),
      body: (write[3] || '').trim(),
    }
  }
  const to = MAIL_TO.exec(t)
  if (to) return { kind: 'mail_write', to: cleanWho(to[1] || ''), subject: '', body: '' }
  return null
}

export function parseWaInbox(text: string): WaInboxIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 180) return null
  if (WA_REPLY_BARE.test(t)) return { kind: 'wa_reply', query: '', body: '' }
  const reply = WA_REPLY.exec(t)
  if (reply) {
    return { kind: 'wa_reply', query: cleanWho(reply[1] || ''), body: (reply[2] || '').trim() }
  }
  const inbox = WA_INBOX.exec(t)
  if (inbox) return { kind: 'wa_inbox', query: cleanWho(inbox[1] || '') }
  return null
}

export function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export function mailHostFor(user: string, explicit = ''): string {
  const host = explicit.trim().toLowerCase()
  if (host) return host
  const at = user.trim().toLowerCase().split('@')[1] || ''
  if (/gmail\.com|googlemail\.com/.test(at)) return 'imap.gmail.com'
  if (/outlook\.com|hotmail\.com|live\.com|msn\.com/.test(at)) return 'outlook.office365.com'
  if (/gmx\.(de|net|at)/.test(at)) return 'imap.gmx.net'
  if (/web\.de/.test(at)) return 'imap.web.de'
  if (/yahoo\./.test(at)) return 'imap.mail.yahoo.com'
  if (/icloud\.com|me\.com|mac\.com/.test(at)) return 'imap.mail.me.com'
  return at ? `imap.${at}` : ''
}

function cleanWho(raw: string): string {
  const t = (raw || '')
    .replace(/\s*auf\s+whatsapp\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!t) return ''
  if (looksLikeEmail(t)) return t.toLowerCase()
  return normalizePlaceName(t)
}
