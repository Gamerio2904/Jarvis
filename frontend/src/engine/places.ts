import { openDevicePage, openExternal, placeCall, sendSmsNow } from '../native/device.ts'
import {
  listImapMails,
  listNotifyInbox,
  notifyInboxStatus,
  openInboxSettings,
  openMailto,
  replyNotifyInbox,
  scanPhoneContacts,
} from '../native/inbox.ts'
import {
  looksLikeEmail,
  mailHostFor,
  parseContactsList,
  parseContactsScan,
  parseEmailStore,
  parseMailIntent,
  parseWaInbox,
} from './comm-parse.ts'
import { hasChain, popChain } from './chain.ts'
import {
  displayPlaceName,
  extractPhone,
  findContactRow,
  findEmailRow,
  isBarePlaceAnswer,
  isCommNo,
  isCommYes,
  isHomeName,
  isRelationName,
  looksLikeAddress,
  looksLikePhone,
  mapsDirUrl,
  normalizePlaceName,
  parsePlaceNav,
  parsePlaceRecall,
  parsePlaceWrite,
} from './places-parse.ts'
import { addReminder, listMemory, loadSettings, persistLastList, saveSettings, upsertMemory } from './store.ts'
import type { ToolMeta } from './tools.ts'

export {
  mapsDirUrl,
  parsePlaceNav,
  parsePlaceRecall,
  parsePlaceWrite,
} from './places-parse.ts'

export type MapsRoute = { title: string; url: string; destination: string }

function mapsTool(action: string, label: string, routes: MapsRoute[], preview?: string): ToolMeta {
  const first = routes[0]
  return {
    tool_status: 'executed',
    tool: 'maps',
    action,
    label,
    preview: preview || first?.title || '',
    result: {
      url: first?.url || '',
      destination: first?.destination || '',
      routes,
    },
  }
}

async function places(): Promise<Array<{ name: string; place: string }>> {
  const rows = await listMemory('place')
  return rows
    .filter((r) => r.value.trim())
    .map((r) => ({ name: r.key, place: r.value.trim() }))
}

async function findPlace(name: string): Promise<{ name: string; place: string } | undefined> {
  const key = name.trim().toLowerCase()
  const rows = await places()
  return rows.find((r) => r.name === key || r.name.includes(key) || key.includes(r.name))
}

function routeOf(name: string, place: string, mode: 'driving' | 'walking' | 'transit' = 'driving'): MapsRoute {
  const title = displayPlaceName(name)
  return { title, destination: place, url: mapsDirUrl(place, mode) }
}

function routeReply(name: string, place: string): string {
  const who = displayPlaceName(name)
  const same = who.toLowerCase() === place.toLowerCase()
  return same
    ? `Route nach ${place}. In Google Maps öffnen.`
    : `Route zu ${who} (${place}). In Google Maps öffnen.`
}

type PendingComm = {
  kind:
    | 'call_confirm'
    | 'sms_confirm'
    | 'sms_body_ask'
    | 'phone_ask'
    | 'sms_ask'
    | 'wa_confirm'
    | 'contacts_confirm'
    | 'mail_confirm'
    | 'mail_to_ask'
    | 'mail_body_ask'
    | 'wa_inbox_reply'
  name: string
  number?: string
  body?: string
  voiceNote?: boolean
  subject?: string
  inboxKey?: string
}

const OTHER_CMD =
  /\b(wecker|timer|termin|wetter|tanke|fernseh|\btv\b|todo|notiz|suche|fahr|navigier|carplay|fahrmodus|akku|spotify|ventilator|apotheke|bäcker)\b/i

function readComm(): PendingComm | null {
  try {
    const raw = loadSettings().last_comm_json
    if (!raw) return null
    const p = JSON.parse(raw) as PendingComm
    if (!p?.kind || !p.name) return null
    return p
  } catch {
    return null
  }
}

function writeComm(p: PendingComm | null, lastTool: string) {
  if (!p) {
    saveSettings({ last_comm_json: '', last_step_tool: lastTool })
    return
  }
  saveSettings({
    last_comm_json: JSON.stringify(p),
    last_step_tool: p.kind,
    last_step_title: p.name,
    last_step_when: p.number || p.body || '',
  })
}

function commTool(action: string, label: string, preview: string, extra?: Record<string, unknown>): ToolMeta {
  return {
    tool_status: 'executed',
    tool: 'maps',
    action,
    label,
    preview,
    result: extra,
  }
}

export async function handlePlaces(
  conversationId: string,
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  const pending = readComm()
  if (pending) {
    const fromPending = await handlePendingComm(conversationId, text, pending)
    if (fromPending) return fromPending
  }

  const s = loadSettings()

  if (s.last_step_tool === 'maps_ask' && s.last_step_title && isBarePlaceAnswer(text)) {
    const place = text.trim().replace(/^[iI]n\s+/, '').replace(/[.!?]+$/, '')
    const name = s.last_step_title
    await upsertMemory(name, place, 'place', conversationId)
    const route = routeOf(name, place)
    return {
      handled: true,
      reply: `Ort liegt. ${routeReply(name, place)}`,
      tool: mapsTool('route', 'Route', [route], name),
      lastTool: 'maps',
    }
  }

  const scan = parseContactsScan(text)
  if (scan) return askContactsScan()

  const book = parseContactsList(text)
  if (book) return listPhoneBook()

  const storedMail = parseEmailStore(text)
  if (storedMail) {
    await upsertMemory(storedMail.name, storedMail.email, 'email', conversationId)
    return {
      handled: true,
      reply: `${displayPlaceName(storedMail.name)}: ${storedMail.email} — liegt.`,
      tool: commTool('mail', 'Adresse', storedMail.name),
      lastTool: 'maps',
    }
  }

  const mail = parseMailIntent(text)
  if (mail) return handleMailIntent(conversationId, mail)

  const waBox = parseWaInbox(text)
  if (waBox) return handleWaInbox(conversationId, waBox)

  const written = parsePlaceWrite(text)
  if (written) {
    await upsertMemory(written.name, written.place, 'place', conversationId)
    const who = displayPlaceName(written.name)
    let extra = ''
    const pending = loadSettings()
    if (written.name === 'zuhause' && pending.last_step_tool === 'home_ask' && pending.last_step_title) {
      await addReminder({
        title: pending.last_step_title,
        due_at: new Date(Date.now() + 365 * 86_400_000).toISOString(),
        conversationId,
        kind: 'home',
      })
      extra = ` Wenn Sie zuhause sind: ${pending.last_step_title}. Handy muss an sein.`
      saveSettings({ last_step_tool: 'home', last_step_title: pending.last_step_title })
    }
    return {
      handled: true,
      reply: `${who}: ${written.place} — liegt.${extra}`,
      tool: {
        tool_status: 'executed',
        tool: 'maps',
        action: 'save',
        label: 'Ort liegt',
        preview: written.name,
      },
      lastTool: 'maps',
    }
  }

  const recall = parsePlaceRecall(text)
  if (recall) {
    const hit = await findPlace(recall.name)
    if (!hit) {
      return {
        handled: true,
        reply: `Kein Ort für ${displayPlaceName(recall.name)}. Sage z. B. „${displayPlaceName(recall.name)} wohnt in …“.`,
        tool: { tool_status: 'executed', tool: 'maps', action: 'ask', label: 'Ort fehlt', preview: recall.name },
        lastTool: 'maps_ask',
      }
    }
    return { handled: true, reply: `${displayPlaceName(hit.name)}: ${hit.place}.` }
  }

  const nav = parsePlaceNav(text)
  if (!nav) return { handled: false }

  if (nav.kind === 'alias') {
    await upsertMemory(`alias:${nav.name}`, nav.alias, 'fact', conversationId)
    await upsertMemory(`alias:${nav.alias}`, nav.name, 'fact', conversationId)
    const rows = await listMemory()
    const hit = findContactRow(rows, nav.alias) || findContactRow(rows, nav.name)
    if (hit) {
      return askCall(hit.key, hit.value)
    }
    writeComm({ kind: 'phone_ask', name: nav.alias }, 'phone_ask')
    return {
      handled: true,
      reply: `${displayPlaceName(nav.name)} ist ${displayPlaceName(nav.alias)}. Welche Nummer? Sage z. B. „${displayPlaceName(nav.alias)}, Tel …“. Dann frage ich nach, bevor ich anrufe.`,
      tool: commTool('ask', 'Nummer fehlt', nav.alias),
      lastTool: 'phone_ask',
    }
  }

  if (nav.kind === 'phone') {
    await upsertMemory(nav.name, nav.number, 'contact', conversationId)
    return {
      handled: true,
      reply: `${displayPlaceName(nav.name)}: ${nav.number} — liegt.`,
      tool: {
        tool_status: 'executed',
        tool: 'maps',
        action: 'phone',
        label: 'Nummer',
        preview: nav.name,
        result: { tel: `tel:${nav.number}`, name: nav.name },
      },
      lastTool: 'maps',
    }
  }

  if (nav.kind === 'sms') {
    const rows = await listMemory()
    const hit = findContactRow(rows, nav.query)
    if (!hit) {
      const who = displayPlaceName(nav.query)
      writeComm({ kind: 'sms_ask', name: nav.query, body: nav.body }, 'sms_ask')
      return {
        handled: true,
        reply: `Keine Nummer für ${who}. Sage z. B. „${who}, Tel …“. Danach frage ich nach, bevor ich sende.`,
        tool: commTool('ask', 'Nummer fehlt', nav.query),
        lastTool: 'sms_ask',
      }
    }
    if (!nav.body.trim()) {
      writeComm({ kind: 'sms_body_ask', name: hit.key, number: hit.value }, 'sms_body_ask')
      return {
        handled: true,
        reply: `Was soll ich ${displayPlaceName(hit.key)} schreiben?`,
        tool: commTool('ask', 'SMS', hit.key, { name: hit.key }),
        lastTool: 'sms_body_ask',
      }
    }
    return askSms(hit.key, hit.value, nav.body, nav.voiceNote)
  }

  if (nav.kind === 'whatsapp') {
    const rows = await listMemory()
    const hit = findContactRow(rows, nav.query)
    if (!hit) {
      const who = displayPlaceName(nav.query)
      writeComm({ kind: 'sms_ask', name: nav.query, body: nav.body }, 'sms_ask')
      return {
        handled: true,
        reply: `Keine Nummer für ${who}. Sage z. B. „${who}, Tel …“. WhatsApp sende ich nicht still — nur Chat-Link nach Ja.`,
        tool: commTool('ask', 'Nummer fehlt', nav.query),
        lastTool: 'sms_ask',
      }
    }
    writeComm({ kind: 'wa_confirm', name: hit.key, number: hit.value, body: nav.body }, 'sms_confirm')
    return {
      handled: true,
      reply: `WhatsApp an ${displayPlaceName(hit.key)}: „${nav.body}“. Ich öffne den Chat, senden tun Sie. Stilles Senden mache ich nicht. Ja?`,
      tool: commTool('ask', 'WhatsApp', hit.key),
      lastTool: 'sms_confirm',
    }
  }

  if (nav.kind === 'call') {
    const rows = await listMemory()
    const hit = findContactRow(rows, nav.query)
    if (!hit) {
      const who = displayPlaceName(nav.query)
      writeComm({ kind: 'phone_ask', name: nav.query }, 'phone_ask')
      return {
        handled: true,
        reply: `Keine Nummer für ${who}. Sage z. B. „${who}, Tel …“. Danach frage ich nach, bevor ich anrufe.`,
        tool: commTool('ask', 'Nummer fehlt', nav.query),
        lastTool: 'phone_ask',
      }
    }
    return askCall(hit.key, hit.value)
  }

  if (nav.kind === 'list') {
    const rows = await places()
    if (!rows.length) {
      return {
        handled: true,
        reply: 'Noch niemand mit Ort. Sage z. B. „Freundin wohnt in Heilbronn“.',
      }
    }
    const routes = rows.map((r) => routeOf(r.name, r.place))
    persistLastList('maps', routes.map((r) => r.title))
    const lines = routes.map((r, i) => `${i + 1}. ${r.title} — ${r.destination}`).join('\n')
    return {
      handled: true,
      reply: `Orte:\n${lines}\nUnten in Google Maps öffnen.`,
      tool: mapsTool('list', 'Routen', routes),
      lastTool: 'maps',
    }
  }

  const q = nav.query
  const mode = nav.mode || 'driving'
  const hit = await findPlace(q)
  if (hit) {
    const route = routeOf(hit.name, hit.place, mode)
    return {
      handled: true,
      reply: routeReply(hit.name, hit.place),
      tool: mapsTool('route', 'Route', [route], hit.name),
      lastTool: 'maps',
    }
  }

  if ((nav.via === 'nach' && !isRelationName(q) && !isHomeName(q)) || looksLikeAddress(q)) {
    const dest = q.replace(/^\w/, (c) => c.toUpperCase())
    const route = routeOf(dest, dest, mode)
    return {
      handled: true,
      reply: routeReply(dest, dest),
      tool: mapsTool('route', 'Route', [route], dest),
      lastTool: 'maps',
    }
  }

  const who = displayPlaceName(q)
  return {
    handled: true,
    reply: `Wo ist ${who}? Dann öffne ich die Route in Google Maps.`,
    tool: { tool_status: 'executed', tool: 'maps', action: 'ask', label: 'Ort fehlt', preview: q },
    lastTool: 'maps_ask',
  }
}

type PlaceHit = { handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }

async function handlePendingComm(conversationId: string, text: string, pending: PendingComm): Promise<PlaceHit | null> {
  if (isCommNo(text)) {
    writeComm(null, 'maps')
    return {
      handled: true,
      reply: 'Alles klar. Nicht angerufen, nichts gesendet.',
      tool: commTool('ask', 'Abbruch', pending.name),
      lastTool: 'maps',
    }
  }

  const num = extractPhone(text)
  const nav = parsePlaceNav(text)
  const written = parsePlaceWrite(text)
  const other = OTHER_CMD.test(text) || Boolean(nav) || Boolean(written)

  if (pending.kind === 'phone_ask') {
    if (num) {
      await upsertMemory(pending.name, num, 'contact', conversationId)
      return askCall(pending.name, num)
    }
    const aliasName = text.trim().replace(/[.!?]+$/g, '')
    if (/^[A-ZÄÖÜa-zäöüß][\wÄÖÜäöüß-]{1,24}$/.test(aliasName) && !looksLikePhone(aliasName)) {
      const alias = aliasName.toLowerCase()
      if (alias !== pending.name) {
        await upsertMemory(`alias:${pending.name}`, alias, 'fact', conversationId)
        await upsertMemory(`alias:${alias}`, pending.name, 'fact', conversationId)
        writeComm({ kind: 'phone_ask', name: alias }, 'phone_ask')
        return {
          handled: true,
          reply: `Also ${displayPlaceName(alias)}. Welche Nummer? Sage z. B. „${displayPlaceName(alias)}, Tel …“.`,
          tool: commTool('ask', 'Nummer fehlt', alias),
          lastTool: 'phone_ask',
        }
      }
    }
    if (other) {
      writeComm(null, 'maps')
      return null
    }
    return {
      handled: true,
      reply: `Welche Nummer für ${displayPlaceName(pending.name)}?`,
      tool: commTool('ask', 'Nummer fehlt', pending.name),
      lastTool: 'phone_ask',
    }
  }

  if (pending.kind === 'sms_ask') {
    if (num) {
      await upsertMemory(pending.name, num, 'contact', conversationId)
      if (pending.body?.trim()) return askSms(pending.name, num, pending.body)
      writeComm({ kind: 'sms_body_ask', name: pending.name, number: num }, 'sms_body_ask')
      return {
        handled: true,
        reply: `Was soll ich ${displayPlaceName(pending.name)} schreiben?`,
        tool: commTool('ask', 'SMS', pending.name),
        lastTool: 'sms_body_ask',
      }
    }
    if (other) {
      writeComm(null, 'maps')
      return null
    }
    return {
      handled: true,
      reply: `Welche Nummer für ${displayPlaceName(pending.name)}?`,
      tool: commTool('ask', 'Nummer fehlt', pending.name),
      lastTool: 'sms_ask',
    }
  }

  if (pending.kind === 'call_confirm') {
    if (isCommYes(text, 'call') && pending.number) return doCall(pending.name, pending.number)
    if (other) {
      writeComm(null, 'maps')
      return null
    }
    return {
      handled: true,
      reply: `${displayPlaceName(pending.name)} — ${pending.number}. Soll ich anrufen? Ja oder nein.`,
      tool: commTool('ask', 'Anrufen', pending.name, { tel: `tel:${pending.number || ''}` }),
      lastTool: 'call_confirm',
    }
  }

  if (pending.kind === 'sms_confirm' || pending.kind === 'wa_confirm') {
    if (isCommNo(text)) {
      writeComm(null, 'maps')
      if (hasChain()) {
        saveSettings({ last_step_tool: 'chain_ask' })
        return {
          handled: true,
          reply: 'Nicht gesendet. Nächster Schritt trotzdem?',
          tool: commTool('ask', 'Kette', pending.name),
          lastTool: 'chain_ask',
        }
      }
      return {
        handled: true,
        reply: 'Nicht gesendet.',
        tool: commTool('ask', 'Abbruch', pending.name),
        lastTool: 'maps',
      }
    }
    if (isCommYes(text, 'sms') && pending.number && pending.body?.trim()) {
      if (pending.kind === 'wa_confirm') return doWhatsApp(conversationId, pending.name, pending.number, pending.body)
      return doSms(conversationId, pending.name, pending.number, pending.body)
    }
    if (other) {
      writeComm(null, 'maps')
      return null
    }
    if (text.trim().length >= 2 && pending.kind !== 'wa_confirm') {
      return askSms(pending.name, pending.number || '', text.trim(), pending.voiceNote)
    }
    return {
      handled: true,
      reply:
        pending.kind === 'wa_confirm'
          ? `WhatsApp an ${displayPlaceName(pending.name)}: „${pending.body}“. Chat öffnen? Senden tun Sie.`
          : `SMS an ${displayPlaceName(pending.name)}: „${pending.body}“. Senden?`,
      tool: commTool('ask', pending.kind === 'wa_confirm' ? 'WhatsApp' : 'SMS', pending.name),
      lastTool: 'sms_confirm',
    }
  }

  if (pending.kind === 'sms_body_ask') {
    if (isCommYes(text)) {
      return {
        handled: true,
        reply: `Was soll ich ${displayPlaceName(pending.name)} schreiben?`,
        tool: commTool('ask', 'SMS', pending.name),
        lastTool: 'sms_body_ask',
      }
    }
    if (other) {
      writeComm(null, 'maps')
      return null
    }
    const body = text.trim().replace(/^[\"„]|[\"”]$/g, '')
    if (body.length >= 2 && pending.number) return askSms(pending.name, pending.number, body)
    return {
      handled: true,
      reply: `Was soll ich ${displayPlaceName(pending.name)} schreiben?`,
      tool: commTool('ask', 'SMS', pending.name),
      lastTool: 'sms_body_ask',
    }
  }

  if (pending.kind === 'contacts_confirm') {
    if (isCommYes(text)) return doContactsScan(conversationId)
    if (other) {
      writeComm(null, 'maps')
      return null
    }
    return {
      handled: true,
      reply: 'Telefonbuch lesen und Name, Nummer und Mail lokal merken. Ja oder nein.',
      tool: commTool('ask', 'Telefonbuch', 'kontakte'),
      lastTool: 'contacts_confirm',
    }
  }

  if (pending.kind === 'mail_to_ask') {
    const addr = extractEmail(text) || (looksLikeEmail(text.trim()) ? text.trim() : '')
    if (addr) {
      await upsertMemory(pending.name || addr, addr, 'email', conversationId)
      if (pending.body?.trim()) return askMail(addr, pending.subject || '', pending.body)
      writeComm({ kind: 'mail_body_ask', name: addr, subject: pending.subject }, 'mail_body_ask')
      return {
        handled: true,
        reply: `Was soll in der E-Mail an ${addr} stehen?`,
        tool: commTool('ask', 'E-Mail', addr),
        lastTool: 'mail_body_ask',
      }
    }
    if (other) {
      writeComm(null, 'maps')
      return null
    }
    return {
      handled: true,
      reply: 'An welche Adresse? Sage z. B. „name@anbieter.de“.',
      tool: commTool('ask', 'E-Mail', pending.name),
      lastTool: 'mail_to_ask',
    }
  }

  if (pending.kind === 'mail_body_ask') {
    if (other) {
      writeComm(null, 'maps')
      return null
    }
    const body = text.trim().replace(/^[\"„]|[\"”]$/g, '')
    if (body.length >= 2 && pending.name) return askMail(pending.name, pending.subject || '', body)
    return {
      handled: true,
      reply: `Was soll in der E-Mail an ${pending.name} stehen?`,
      tool: commTool('ask', 'E-Mail', pending.name),
      lastTool: 'mail_body_ask',
    }
  }

  if (pending.kind === 'mail_confirm') {
    if (isCommYes(text, 'sms') && pending.name) return doMailDraft(pending.name, pending.subject || '', pending.body || '')
    if (other) {
      writeComm(null, 'maps')
      return null
    }
    return {
      handled: true,
      reply: `E-Mail-Entwurf an ${pending.name}: „${pending.body || pending.subject || '…'}“. Öffnen? Senden tun Sie.`,
      tool: commTool('ask', 'E-Mail', pending.name),
      lastTool: 'mail_confirm',
    }
  }

  if (pending.kind === 'wa_inbox_reply') {
    if (isCommYes(text, 'sms') && pending.inboxKey && pending.body?.trim()) {
      return doWaInboxReply(conversationId, pending.name, pending.inboxKey, pending.body)
    }
    if (other) {
      writeComm(null, 'maps')
      return null
    }
    const spoken = text.trim().replace(/^[\"„]|[\"”]$/g, '')
    if (!pending.body?.trim() && spoken.length >= 2 && !isCommYes(text) && pending.inboxKey) {
      writeComm(
        { kind: 'wa_inbox_reply', name: pending.name, inboxKey: pending.inboxKey, body: spoken },
        'wa_inbox_reply',
      )
      return {
        handled: true,
        reply: `WhatsApp an ${displayPlaceName(pending.name)}: „${spoken}“. Über die sichtbare Meldung. Ja?`,
        tool: commTool('ask', 'WhatsApp', pending.name),
        lastTool: 'wa_inbox_reply',
      }
    }
    return {
      handled: true,
      reply: pending.body
        ? `WhatsApp an ${displayPlaceName(pending.name)}: „${pending.body}“. Über die Meldung senden? Ja.`
        : `Was soll ich ${displayPlaceName(pending.name)} auf WhatsApp antworten?`,
      tool: commTool('ask', 'WhatsApp', pending.name),
      lastTool: 'wa_inbox_reply',
    }
  }

  return null
}

function askCall(name: string, number: string): PlaceHit {
  writeComm({ kind: 'call_confirm', name, number }, 'call_confirm')
  return {
    handled: true,
    reply: `${displayPlaceName(name)} — ${number}. Soll ich anrufen?`,
    tool: commTool('ask', 'Anrufen', name, { tel: `tel:${number}`, name }),
    lastTool: 'call_confirm',
  }
}

function askSms(name: string, number: string, body: string, voiceNote?: boolean): PlaceHit {
  writeComm({ kind: 'sms_confirm', name, number, body, voiceNote }, 'sms_confirm')
  const note = voiceNote ? ' Das ist Text per SMS, keine Voice-Note.' : ''
  return {
    handled: true,
    reply: `SMS an ${displayPlaceName(name)}: „${body}“. Senden?${note}`,
    tool: commTool('ask', 'SMS', name, { sms: `sms:${number}`, name, body }),
    lastTool: 'sms_confirm',
  }
}

async function doCall(name: string, number: string): Promise<PlaceHit> {
  writeComm(null, 'maps')
  const res = await placeCall(number)
  if (res.needPerm) {
    await openDevicePage('app')
    writeComm({ kind: 'call_confirm', name, number }, 'call_confirm')
    return {
      handled: true,
      reply: `${res.message || 'Anruf-Recht fehlt.'} Danach „ja“.`,
      tool: commTool('ask', 'Anrufen', name, { tel: `tel:${number}` }),
      lastTool: 'call_confirm',
    }
  }
  return {
    handled: true,
    reply: res.ok
      ? `Ich rufe ${displayPlaceName(name)} an. Ob jemand abhebt, weiß ich nicht.`
      : res.message || `Anruf zu ${displayPlaceName(name)} nicht gestartet.`,
    tool: commTool('call', 'Anrufen', name, { tel: `tel:${number}`, name }),
    lastTool: 'maps',
  }
}

async function doSms(conversationId: string, name: string, number: string, body: string): Promise<PlaceHit> {
  writeComm(null, 'maps')
  const res = await sendSmsNow(number, body)
  if (res.needPerm) {
    await openDevicePage('app')
    writeComm({ kind: 'sms_confirm', name, number, body }, 'sms_confirm')
    return {
      handled: true,
      reply: `${res.message || 'SMS-Recht fehlt.'} Danach „ja“.`,
      tool: commTool('ask', 'SMS', name, { sms: `sms:${number}`, body }),
      lastTool: 'sms_confirm',
    }
  }
  let reply = res.ok
    ? `SMS an ${displayPlaceName(name)} hat der Funk angenommen. Ob sie ankommt, prüfe ich nicht.`
    : res.message || `SMS an ${displayPlaceName(name)} nicht gesendet.`
  const extra = await runNextInChain(conversationId)
  if (extra) reply = `${reply}\n\n${extra}`
  return {
    handled: true,
    reply,
    tool: commTool('sms', 'SMS', name, { sms: `sms:${number}`, name, body }),
    lastTool: 'maps',
  }
}

async function doWhatsApp(conversationId: string, name: string, number: string, body: string): Promise<PlaceHit> {
  writeComm(null, 'maps')
  const url = waMeUrl(number, body)
  const opened = await openExternal(url)
  let reply = opened.ok
    ? `WhatsApp-Chat an ${displayPlaceName(name)} ist auf. Senden tun Sie. Stilles Senden mache ich nicht.`
    : 'WhatsApp-Link geht hier nicht auf. Stilles Senden mache ich nicht.'
  const extra = await runNextInChain(conversationId)
  if (extra) reply = `${reply}\n\n${extra}`
  return {
    handled: true,
    reply,
    tool: commTool('sms', 'WhatsApp', name, { url, name, body }),
    lastTool: 'maps',
  }
}

function waMeUrl(number: string, body: string): string {
  let d = number.replace(/\D/g, '')
  if (d.startsWith('0')) d = `49${d.slice(1)}`
  const q = new URLSearchParams({ text: body })
  return `https://wa.me/${d}?${q}`
}

function extractEmail(text: string): string | null {
  const m = text.match(/[^\s@]+@[^\s@]+\.[^\s@]+/)
  return m && looksLikeEmail(m[0]) ? m[0].toLowerCase() : null
}

function askContactsScan(): PlaceHit {
  writeComm({ kind: 'contacts_confirm', name: 'telefonbuch' }, 'contacts_confirm')
  return {
    handled: true,
    reply: 'Ich lese Name, Nummer und Mail aus dem Telefonbuch ins lokale Gedächtnis. Ja?',
    tool: commTool('ask', 'Telefonbuch', 'kontakte'),
    lastTool: 'contacts_confirm',
  }
}

async function doContactsScan(conversationId: string): Promise<PlaceHit> {
  writeComm(null, 'maps')
  const res = await scanPhoneContacts()
  if (res.needPerm) {
    await openDevicePage('app')
    writeComm({ kind: 'contacts_confirm', name: 'telefonbuch' }, 'contacts_confirm')
    return {
      handled: true,
      reply: `${res.message || 'Kontakte-Recht fehlt.'} Danach „ja“.`,
      tool: commTool('ask', 'Telefonbuch', 'kontakte'),
      lastTool: 'contacts_confirm',
    }
  }
  if (!res.ok) {
    return {
      handled: true,
      reply: res.message || 'Telefonbuch nicht gelesen.',
      tool: commTool('ask', 'Telefonbuch', 'kontakte'),
      lastTool: 'maps',
    }
  }
  const tally = await applyScannedContacts(res.contacts, conversationId)
  return {
    handled: true,
    reply: scanReply(tally),
    tool: commTool('scan', 'Telefonbuch', `${tally.numbers}`),
    lastTool: 'maps',
  }
}

export async function applyScannedContacts(
  rows: Array<{ name: string; number?: string; email?: string }>,
  conversationId?: string,
): Promise<{ numbers: number; mails: number; kept: number }> {
  const existing = await listMemory()
  let numbers = 0
  let mails = 0
  let kept = 0
  for (const row of rows) {
    const key = normalizePlaceName(row.name)
    if (!key) continue
    const phone = (row.number || '').trim()
    const mail = (row.email || '').trim()
    const hit = findContactRow(existing, key)
    if (phone && looksLikePhone(phone)) {
      if (hit) kept += 1
      else {
        await upsertMemory(key, phone, 'contact', conversationId)
        existing.push({ key, value: phone, category: 'contact' } as (typeof existing)[number])
        numbers += 1
      }
    }
    if (mail && looksLikeEmail(mail) && !findEmailRow(existing, key)) {
      await upsertMemory(key, mail, 'email', conversationId)
      existing.push({ key, value: mail, category: 'email' } as (typeof existing)[number])
      mails += 1
    }
  }
  return { numbers, mails, kept }
}

export function scanReply(tally: { numbers: number; mails: number; kept: number }): string {
  const bits: string[] = []
  if (tally.numbers) bits.push(`${tally.numbers} Nummern`)
  if (tally.mails) bits.push(`${tally.mails} Adressen`)
  const extra = tally.kept ? ` ${tally.kept} lagen schon.` : ''
  if (bits.length) return `${bits.join(' und ')} aus dem Telefonbuch liegen lokal.${extra}`
  if (tally.kept) return `Keine neue Nummer. ${tally.kept} lagen schon.`
  return 'Telefonbuch war leer oder ohne Nummern und Mail.'
}

async function listPhoneBook(): Promise<PlaceHit> {
  const rows = await listMemory()
  const phones = rows.filter((r) => r.category === 'contact' && looksLikePhone(r.value))
  const mails = rows.filter((r) => r.category === 'email' && looksLikeEmail(r.value))
  if (!phones.length && !mails.length) {
    return {
      handled: true,
      reply:
        'Noch keine Nummern. Sage „Kontakte scannen“ oder z. B. „Mama, Tel …“ / „Mama, Mail …“.',
      tool: commTool('list', 'Kontakte', 'leer'),
      lastTool: 'maps',
    }
  }
  const names = new Map<string, { phone?: string; mail?: string }>()
  for (const r of phones) {
    const cur = names.get(r.key) || {}
    cur.phone = r.value
    names.set(r.key, cur)
  }
  for (const r of mails) {
    const cur = names.get(r.key) || {}
    cur.mail = r.value
    names.set(r.key, cur)
  }
  persistLastList('maps', [...names.keys()].map((k) => displayPlaceName(k)))
  const lines = [...names.entries()].slice(0, 24).map(([key, v], i) => {
    const bits = [v.phone, v.mail].filter(Boolean).join(' · ')
    return `${i + 1}. ${displayPlaceName(key)} — ${bits}`
  })
  return {
    handled: true,
    reply: `Kontakte:\n${lines.join('\n')}`,
    tool: commTool('list', 'Kontakte', `${names.size}`),
    lastTool: 'maps',
  }
}

async function handleMailIntent(
  conversationId: string,
  mail: { kind: 'mail_read' | 'mail_write'; query?: string; to?: string; subject?: string; body?: string },
): Promise<PlaceHit> {
  if (mail.kind === 'mail_read') return readMails(mail.query || '')
  const to = (mail.to || '').trim()
  const subject = mail.subject || ''
  const body = mail.body || ''
  if (!to) {
    writeComm({ kind: 'mail_to_ask', name: '', subject, body }, 'mail_to_ask')
    return {
      handled: true,
      reply: 'An wen? Name oder Adresse, dann der Text.',
      tool: commTool('ask', 'E-Mail', ''),
      lastTool: 'mail_to_ask',
    }
  }
  if (looksLikeEmail(to)) {
    await upsertMemory(to, to, 'email', conversationId)
    if (!body.trim()) {
      writeComm({ kind: 'mail_body_ask', name: to, subject }, 'mail_body_ask')
      return {
        handled: true,
        reply: `Was soll in der E-Mail an ${to} stehen?`,
        tool: commTool('ask', 'E-Mail', to),
        lastTool: 'mail_body_ask',
      }
    }
    return askMail(to, subject, body)
  }
  const rows = await listMemory()
  const hit = findEmailRow(rows, to)
  if (hit) {
    if (!body.trim()) {
      writeComm({ kind: 'mail_body_ask', name: hit.value, subject }, 'mail_body_ask')
      return {
        handled: true,
        reply: `Was soll in der E-Mail an ${displayPlaceName(to)} stehen?`,
        tool: commTool('ask', 'E-Mail', to),
        lastTool: 'mail_body_ask',
      }
    }
    return askMail(hit.value, subject, body)
  }
  writeComm({ kind: 'mail_to_ask', name: to, subject, body }, 'mail_to_ask')
  return {
    handled: true,
    reply: `Keine Adresse für ${displayPlaceName(to)}. Sage z. B. „${displayPlaceName(to)}@…“ oder die volle Adresse.`,
    tool: commTool('ask', 'E-Mail', to),
    lastTool: 'mail_to_ask',
  }
}

function askMail(to: string, subject: string, body: string): PlaceHit {
  writeComm({ kind: 'mail_confirm', name: to, subject, body }, 'mail_confirm')
  return {
    handled: true,
    reply: `E-Mail-Entwurf an ${to}${subject ? ` (${subject})` : ''}: „${body}“. Ich öffne die Mail-App, senden tun Sie. Ja?`,
    tool: commTool('ask', 'E-Mail', to, { mailto: `mailto:${to}`, body }),
    lastTool: 'mail_confirm',
  }
}

async function doMailDraft(to: string, subject: string, body: string): Promise<PlaceHit> {
  writeComm(null, 'maps')
  const res = await openMailto(to, subject, body)
  return {
    handled: true,
    reply: res.ok
      ? `E-Mail-Entwurf an ${to} ist auf. Senden tun Sie. Still verschicken mache ich nicht.`
      : res.message || 'Mail-App nicht geöffnet.',
    tool: commTool('mail', 'E-Mail', to, { mailto: `mailto:${to}`, body }),
    lastTool: 'maps',
  }
}

async function readMails(query: string): Promise<PlaceHit> {
  const s = loadSettings()
  const user = s.mail_user.trim()
  const pass = s.mail_pass.trim()
  const host = mailHostFor(user, s.mail_host)
  if (user && pass && host) {
    const res = await listImapMails({ host, user, pass, limit: 8, query })
    if (res.ok) {
      const rows = query
        ? res.mails.filter((m) => {
            const blob = `${m.from} ${m.subject}`.toLowerCase()
            return blob.includes(query.toLowerCase())
          })
        : res.mails
      if (!rows.length) {
        return {
          handled: true,
          reply: query
            ? `Keine IMAP-Zeile von ${query}. Postfach erreicht, Eingang leer oder kein Treffer.`
            : 'Postfach erreicht. Keine ungelesene Zeile.',
          tool: commTool('mail', 'E-Mail', 'leer'),
          lastTool: 'maps',
        }
      }
      const lines = rows.slice(0, 8).map((m, i) => `${i + 1}. ${m.from || 'unbekannt'} — ${m.subject || 'ohne Betreff'}`)
      return {
        handled: true,
        reply: `Ungelesen über IMAP:\n${lines.join('\n')}`,
        tool: commTool('mail', 'E-Mail', `${rows.length}`),
        lastTool: 'maps',
      }
    }
    const fallback = await mailFromNotifications(query)
    if (fallback) return fallback
    return {
      handled: true,
      reply: res.message || 'Postfach nicht erreichbar.',
      tool: commTool('ask', 'E-Mail', 'imap'),
      lastTool: 'maps',
    }
  }
  const fromNotify = await mailFromNotifications(query)
  if (fromNotify) return fromNotify
  return {
    handled: true,
    reply:
      'Kein E-Mail-Zugang. Unter API-Keys Adresse und App-Passwort eintragen — nicht das normale Passwort. Ohne das lese ich den Posteingang nicht.',
    tool: commTool('ask', 'E-Mail', 'zugang'),
    lastTool: 'maps',
  }
}

async function mailFromNotifications(query: string): Promise<PlaceHit | null> {
  const box = await listNotifyInbox()
  if (!box.enabled) return null
  const mails = box.items.filter((n) => /mail|gmail|outlook/i.test(n.pkg))
  const q = query.trim().toLowerCase()
  const rows = q
    ? mails.filter((n) => `${n.title} ${n.text}`.toLowerCase().includes(q))
    : mails
  if (!rows.length) return null
  const lines = rows.slice(0, 6).map((n, i) => `${i + 1}. ${n.title || 'Mail'} — ${n.text || 'ohne Text'}`)
  return {
    handled: true,
    reply: `Letzte Mail-Meldungen, kein volles Postfach:\n${lines.join('\n')}`,
    tool: commTool('mail', 'E-Mail', `${rows.length}`),
    lastTool: 'maps',
  }
}

async function handleWaInbox(
  _conversationId: string,
  intent: { kind: 'wa_inbox' | 'wa_reply'; query: string; body?: string },
): Promise<PlaceHit> {
  const status = await notifyInboxStatus()
  if (!status.enabled) {
    await openInboxSettings()
    return {
      handled: true,
      reply:
        'WhatsApp-Eingang braucht den Meldungszugriff. Jarvis in der Liste erlauben, dann nochmal. Stilles Senden mache ich nicht.',
      tool: commTool('ask', 'WhatsApp', 'meldungen'),
      lastTool: 'maps',
    }
  }
  const box = await listNotifyInbox()
  const wa = box.items.filter((n) => /whatsapp/i.test(n.pkg))
  const q = intent.query.trim().toLowerCase()
  const match = q ? wa.filter((n) => `${n.title} ${n.text}`.toLowerCase().includes(q)) : wa
  if (intent.kind === 'wa_inbox') {
    if (!match.length) {
      return {
        handled: true,
        reply: q
          ? `Keine offene WhatsApp-Meldung von ${displayPlaceName(intent.query)}.`
          : 'Keine offene WhatsApp-Meldung. Nur was gerade angezeigt wird, keinen Chat-Verlauf.',
        tool: commTool('ask', 'WhatsApp', 'leer'),
        lastTool: 'maps',
      }
    }
    const lines = match.slice(0, 6).map((n, i) => `${i + 1}. ${n.title || 'WhatsApp'} — ${n.text || 'ohne Text'}`)
    return {
      handled: true,
      reply: `Offene WhatsApp-Meldungen:\n${lines.join('\n')}\nAntwort: „Antworte ${match[0]?.title || 'Name'} …“.`,
      tool: commTool('inbox', 'WhatsApp', `${match.length}`),
      lastTool: 'maps',
    }
  }
  const body = (intent.body || '').trim()
  const row = match.find((n) => n.canReply) || match[0]
  if (!row) {
    if (intent.query && body) {
      const rows = await listMemory()
      const hit = findContactRow(rows, intent.query)
      if (hit) {
        writeComm({ kind: 'wa_confirm', name: hit.key, number: hit.value, body }, 'sms_confirm')
        return {
          handled: true,
          reply: `Keine offene Meldung von ${displayPlaceName(intent.query)}. Chat-Link nach Ja, senden tun Sie.`,
          tool: commTool('ask', 'WhatsApp', hit.key),
          lastTool: 'sms_confirm',
        }
      }
    }
    return {
      handled: true,
      reply: 'Keine offene WhatsApp-Meldung zum Antworten. Neue Nachricht: „Schreib … auf WhatsApp …“.',
      tool: commTool('ask', 'WhatsApp', intent.query),
      lastTool: 'maps',
    }
  }
  if (!body) {
    writeComm({ kind: 'wa_inbox_reply', name: row.title || intent.query, inboxKey: row.key, body: '' }, 'wa_inbox_reply')
    return {
      handled: true,
      reply: `Was soll ich ${row.title || 'auf WhatsApp'} antworten?`,
      tool: commTool('ask', 'WhatsApp', row.title),
      lastTool: 'wa_inbox_reply',
    }
  }
  writeComm(
    { kind: 'wa_inbox_reply', name: row.title || intent.query, inboxKey: row.key, body },
    'wa_inbox_reply',
  )
  return {
    handled: true,
    reply: `WhatsApp an ${row.title || displayPlaceName(intent.query)}: „${body}“. Über die sichtbare Meldung. Ja?`,
    tool: commTool('ask', 'WhatsApp', row.title),
    lastTool: 'wa_inbox_reply',
  }
}

async function doWaInboxReply(
  conversationId: string,
  name: string,
  key: string,
  body: string,
): Promise<PlaceHit> {
  writeComm(null, 'maps')
  const res = await replyNotifyInbox(key, body)
  let reply = res.ok
    ? `Antwort an ${displayPlaceName(name)} ist über die Meldung gegangen. Ob sie ankommt, prüfe ich nicht.`
    : res.message || 'Antwort nicht übergeben. Chat öffnen, senden tun Sie.'
  const extra = await runNextInChain(conversationId)
  if (extra) reply = `${reply}\n\n${extra}`
  return {
    handled: true,
    reply,
    tool: commTool('sms', 'WhatsApp', name, { body }),
    lastTool: 'maps',
  }
}

async function runNextInChain(conversationId: string): Promise<string | null> {
  const next = popChain()
  if (!next) return null
  const { routeRegistry } = await import('./registry.ts')
  const hit = await routeRegistry(conversationId, next)
  return hit?.reply || null
}
