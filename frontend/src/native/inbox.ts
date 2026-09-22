import { Capacitor, registerPlugin } from '@capacitor/core'
import { withTimeout } from './with-timeout.ts'

export type PhoneContact = { name: string; number: string; email?: string }

export type MailRow = { from: string; subject: string; date: string }

export type InboxRow = {
  key: string
  pkg: string
  title: string
  text: string
  canReply: boolean
  at: number
}

type NativeDevice = {
  scanContacts(): Promise<{
    ok: boolean
    needPerm?: boolean
    contacts?: PhoneContact[]
    message?: string
  }>
  imapList(opts: {
    host: string
    user: string
    pass: string
    limit?: number
    query?: string
  }): Promise<{ ok: boolean; mails?: MailRow[]; message?: string }>
  mailto(opts: { to: string; subject?: string; body?: string }): Promise<{ ok: boolean; message?: string }>
}

type NativeNotify = {
  inboxList(): Promise<{ ok: boolean; enabled?: boolean; items?: InboxRow[]; message?: string }>
  inboxReply(opts: { key: string; text: string }): Promise<{ ok: boolean; message?: string }>
  inboxStatus(): Promise<{ ok: boolean; enabled?: boolean; message?: string }>
  inboxOpenSettings(): Promise<{ ok: boolean; message?: string }>
}

const device = Capacitor.isNativePlatform() ? registerPlugin<NativeDevice>('JarvisDevice') : null
const notify = Capacitor.isNativePlatform() ? registerPlugin<NativeNotify>('JarvisNotify') : null

export async function scanPhoneContacts(): Promise<{
  ok: boolean
  needPerm?: boolean
  contacts: PhoneContact[]
  message?: string
}> {
  if (device?.scanContacts) {
    try {
      const hit = await withTimeout(device.scanContacts(), 20_000, {
        ok: false,
        message: 'Telefonbuch nicht lesbar.',
      })
      const contacts = Array.isArray(hit.contacts)
        ? hit.contacts
            .map((c) => ({
              name: String(c?.name || '').trim(),
              number: String(c?.number || '').trim(),
              email: String(c?.email || '').trim() || undefined,
            }))
            .filter((c) => c.name && (c.number.length >= 6 || Boolean(c.email)))
        : []
      return { ...hit, contacts }
    } catch {
      return { ok: false, contacts: [], message: 'Telefonbuch nicht lesbar.' }
    }
  }
  return { ok: false, contacts: [], message: 'Telefonbuch nur auf dem Handy.' }
}

export async function listImapMails(opts: {
  host: string
  user: string
  pass: string
  limit?: number
  query?: string
}): Promise<{ ok: boolean; mails: MailRow[]; message?: string }> {
  if (device?.imapList) {
    try {
      const hit = await withTimeout(device.imapList(opts), 18_000, {
        ok: false,
        message: 'Postfach nicht erreichbar.',
      })
      const mails = Array.isArray(hit.mails)
        ? hit.mails.map((m) => ({
            from: String(m?.from || '').trim(),
            subject: String(m?.subject || '').trim(),
            date: String(m?.date || '').trim(),
          }))
        : []
      return { ...hit, mails }
    } catch {
      return { ok: false, mails: [], message: 'Postfach nicht erreichbar.' }
    }
  }
  return { ok: false, mails: [], message: 'E-Mails lesen nur auf dem Handy.' }
}

export async function openMailto(
  to: string,
  subject = '',
  body = '',
): Promise<{ ok: boolean; message?: string }> {
  const addr = to.trim()
  if (device?.mailto) {
    try {
      return await withTimeout(device.mailto({ to: addr, subject, body }), 8_000, {
        ok: false,
        message: 'Mail-App nicht geöffnet.',
      })
    } catch {
      return { ok: false, message: 'Mail-App nicht geöffnet.' }
    }
  }
  try {
    const q = new URLSearchParams()
    if (subject) q.set('subject', subject)
    if (body) q.set('body', body)
    const qs = q.toString()
    window.open(`mailto:${encodeURIComponent(addr)}${qs ? `?${qs}` : ''}`, '_self')
    return { ok: true }
  } catch {
    return { ok: false, message: 'Mail-App nicht geöffnet.' }
  }
}

export async function listNotifyInbox(): Promise<{
  ok: boolean
  enabled?: boolean
  items: InboxRow[]
  message?: string
}> {
  if (notify?.inboxList) {
    try {
      const hit = await withTimeout(notify.inboxList(), 8_000, {
        ok: false,
        message: 'Meldungen nicht lesbar.',
      })
      const items = Array.isArray(hit.items)
        ? hit.items.map((n) => ({
            key: String(n?.key || '').trim(),
            pkg: String(n?.pkg || '').trim(),
            title: String(n?.title || '').trim(),
            text: String(n?.text || '').trim(),
            canReply: Boolean(n?.canReply),
            at: Number(n?.at) || 0,
          }))
        : []
      return { ...hit, items }
    } catch {
      return { ok: false, items: [], message: 'Meldungen nicht lesbar.' }
    }
  }
  return { ok: false, items: [], message: 'WhatsApp-Eingang nur auf dem Handy.' }
}

export async function replyNotifyInbox(
  key: string,
  text: string,
): Promise<{ ok: boolean; message?: string }> {
  const k = key.trim()
  const body = text.trim()
  if (!k || !body) return { ok: false, message: 'Kein Text.' }
  if (notify?.inboxReply) {
    try {
      return await withTimeout(notify.inboxReply({ key: k, text: body }), 10_000, {
        ok: false,
        message: 'Antwort nicht übergeben.',
      })
    } catch {
      return { ok: false, message: 'Antwort nicht übergeben.' }
    }
  }
  return { ok: false, message: 'Antwort über die Meldung nur auf dem Handy.' }
}

export async function notifyInboxStatus(): Promise<{
  ok: boolean
  enabled?: boolean
  message?: string
}> {
  if (notify?.inboxStatus) {
    try {
      return await withTimeout(notify.inboxStatus(), 6_000, {
        ok: false,
        message: 'Meldungszugriff unbekannt.',
      })
    } catch {
      return { ok: false, message: 'Meldungszugriff unbekannt.' }
    }
  }
  return { ok: false, message: 'Meldungszugriff nur auf dem Handy.' }
}

export async function openInboxSettings(): Promise<{ ok: boolean; message?: string }> {
  if (notify?.inboxOpenSettings) {
    try {
      return await withTimeout(notify.inboxOpenSettings(), 8_000, {
        ok: false,
        message: 'Meldungs-Einstellungen nicht geöffnet.',
      })
    } catch {
      return { ok: false, message: 'Meldungs-Einstellungen nicht geöffnet.' }
    }
  }
  return { ok: false, message: 'Meldungszugriff nur auf dem Handy.' }
}
