import { openDevicePage, placeCall, sendSmsNow } from '../native/device'
import {
  displayPlaceName,
  extractPhone,
  findContactRow,
  findPlaceRow,
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
  parsePlaceForget,
} from './places-parse'
import { addReminder, deleteMemory, listMemory, loadSettings, persistLastList, saveSettings, upsertMemory } from './store'
import type { ToolMeta } from './tools'

export {
  mapsDirUrl,
  parsePlaceNav,
  parsePlaceRecall,
  parsePlaceWrite,
} from './places-parse'

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
  const rows = await listMemory()
  const hit = findPlaceRow(rows, name)
  if (!hit) return undefined
  return { name: hit.key, place: hit.value }
}

function routeOf(name: string, place: string, mode: 'driving' | 'walking' | 'transit' = 'driving'): MapsRoute {
  const title = displayPlaceName(name)
  return { title, destination: place, url: mapsDirUrl(place, mode) }
}

function routeReply(name: string, place: string): string {
  const who = displayPlaceName(name)
  const same = who.toLowerCase() === place.toLowerCase()
  return same
    ? `Hier ist die Route nach ${place}. Unten können Sie sie in Google Maps öffnen.`
    : `Hier ist die Route zu ${who} (${place}). Unten in Google Maps öffnen.`
}

function samePerson(a: string, b: string): boolean {
  const x = normalizePlaceName(a)
  const y = normalizePlaceName(b)
  if (!x || !y) return false
  if (x === y) return true
  if (isHomeName(x) && isHomeName(y)) return true
  return false
}

async function maybeAliasPerson(conversationId: string, key: string, kind: 'contact' | 'place'): Promise<string> {
  const n = normalizePlaceName(key)
  const rows = await listMemory()
  const proper = (k: string) =>
    !isHomeName(k) && !isRelationName(k) && !k.startsWith('alias:') && k.length >= 2
  if (isRelationName(n) && kind === 'place') {
    const named = rows.filter((r) => r.category === 'contact' && proper(r.key) && looksLikePhone(r.value))
    const loose = named.filter((c) => !rows.some((r) => r.category === 'place' && r.key === c.key))
    if (loose.length === 1) {
      const other = loose[0].key
      await upsertMemory(`alias:${n}`, other, 'fact', conversationId)
      await upsertMemory(`alias:${other}`, n, 'fact', conversationId)
      return ` Ich verbinde ${displayPlaceName(other)} mit ${displayPlaceName(n)}.`
    }
  }
  if (proper(n) && kind === 'contact') {
    const rels = rows.filter((r) => r.category === 'place' && isRelationName(r.key) && r.value.trim())
    const loose = rels.filter((p) => !findContactRow(rows, p.key))
    if (loose.length === 1) {
      const other = loose[0].key
      await upsertMemory(`alias:${n}`, other, 'fact', conversationId)
      await upsertMemory(`alias:${other}`, n, 'fact', conversationId)
      return ` Ich verbinde ${displayPlaceName(n)} mit ${displayPlaceName(other)}.`
    }
  }
  return ''
}

type PendingComm = {
  kind: 'call_confirm' | 'sms_confirm' | 'sms_body_ask' | 'phone_ask' | 'sms_ask'
  name: string
  number?: string
  body?: string
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

  const written = parsePlaceWrite(text)
  const forgotten = parsePlaceForget(text)
  if (forgotten) {
    const rows = await listMemory()
    const named = findPlaceRow(rows, forgotten)
    const hit = rows.find(
      (r) =>
        r.category === 'place' &&
        (r.key === forgotten || (named && r.key === named.key)),
    )
    if (hit) {
      await deleteMemory(hit.id)
      return {
        handled: true,
        reply: `Ort von ${displayPlaceName(forgotten)} ist weg.`,
        tool: mapsTool('forget', 'Ort weg', [], forgotten),
        lastTool: 'maps',
      }
    }
    return {
      handled: true,
      reply: `Kein Ort für ${displayPlaceName(forgotten)} gespeichert.`,
      lastTool: 'maps',
    }
  }
  if (written) {
    await upsertMemory(written.name, written.place, 'place', conversationId)
    const linked = await maybeAliasPerson(conversationId, written.name, 'place')
    const who = displayPlaceName(written.name)
    let extra = linked
    const st = loadSettings()
    if (written.name === 'zuhause' && st.last_step_tool === 'home_ask' && st.last_step_title) {
      await addReminder({
        title: st.last_step_title,
        due_at: new Date(Date.now() + 365 * 86_400_000).toISOString(),
        conversationId,
        kind: 'home',
      })
      extra += ` Wenn Sie zuhause sind, erinnere ich an: ${st.last_step_title}. Das Handy muss an sein.`
      saveSettings({ last_step_tool: 'home', last_step_title: st.last_step_title })
    }
    return {
      handled: true,
      reply: `Ich habe ${who} mit ${written.place} gespeichert.${extra}`,
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
        reply: `Für ${displayPlaceName(recall.name)} kenne ich noch keinen Ort. Sagen Sie zum Beispiel „${displayPlaceName(recall.name)} wohnt in …“.`,
        tool: { tool_status: 'executed', tool: 'maps', action: 'ask', label: 'Ort fehlt', preview: recall.name },
        lastTool: 'maps_ask',
      }
    }
    return { handled: true, reply: `${displayPlaceName(hit.name)} wohnt in ${hit.place}.` }
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
    const linked = await maybeAliasPerson(conversationId, nav.name, 'contact')
    return {
      handled: true,
      reply: `Die Nummer von ${displayPlaceName(nav.name)} ist gespeichert: ${nav.number}.${linked}`,
      tool: {
        tool_status: 'executed',
        tool: 'maps',
        action: 'phone',
        label: 'Nummer',
        preview: nav.name,
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
        reply: `Keine Nummer für ${who}. Sagen Sie zum Beispiel „${who}, Tel …“. Danach frage ich nach, bevor ich sende.`,
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
    return askSms(hit.key, hit.value, nav.body)
  }

  if (nav.kind === 'call') {
    const rows = await listMemory()
    const hit = findContactRow(rows, nav.query)
    if (!hit) {
      const who = displayPlaceName(nav.query)
      writeComm({ kind: 'phone_ask', name: nav.query }, 'phone_ask')
      return {
        handled: true,
        reply: `Keine Nummer für ${who}. Sagen Sie zum Beispiel „${who}, Tel …“. Danach frage ich nach, bevor ich anrufe.`,
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
      await maybeAliasPerson(conversationId, pending.name, 'contact')
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
    if (nav?.kind === 'call' && pending.number && samePerson(nav.query, pending.name)) {
      return doCall(pending.name, pending.number)
    }
    if (nav?.kind === 'call' && pending.number) {
      const rows = await listMemory()
      const hit = findContactRow(rows, nav.query)
      if (hit && hit.value === pending.number) return doCall(pending.name, pending.number)
    }
    if (other && nav?.kind !== 'call') {
      writeComm(null, 'maps')
      return null
    }
    return {
      handled: true,
      reply: `Soll ich ${displayPlaceName(pending.name)} unter ${pending.number} anrufen? Ja oder nein.`,
      tool: commTool('ask', 'Anrufen', pending.name, { confirmCall: true, name: pending.name }),
      lastTool: 'call_confirm',
    }
  }

  if (pending.kind === 'sms_confirm') {
    if (isCommYes(text, 'sms') && pending.number && pending.body?.trim()) {
      return doSms(pending.name, pending.number, pending.body)
    }
    if (other) {
      writeComm(null, 'maps')
      return null
    }
    if (text.trim().length >= 2) return askSms(pending.name, pending.number || '', text.trim())
    return {
      handled: true,
      reply: `SMS an ${displayPlaceName(pending.name)}: „${pending.body}“. Senden?`,
      tool: commTool('ask', 'SMS', pending.name),
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

  return null
}

function askCall(name: string, number: string): PlaceHit {
  writeComm({ kind: 'call_confirm', name, number }, 'call_confirm')
  return {
    handled: true,
    reply: `Die Nummer von ${displayPlaceName(name)} ist ${number}. Soll ich anrufen?`,
    tool: commTool('ask', 'Anrufen', name, { confirmCall: true, name }),
    lastTool: 'call_confirm',
  }
}

function askSms(name: string, number: string, body: string): PlaceHit {
  writeComm({ kind: 'sms_confirm', name, number, body }, 'sms_confirm')
  return {
    handled: true,
    reply: `SMS an ${displayPlaceName(name)}: „${body}“. Senden?`,
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

async function doSms(name: string, number: string, body: string): Promise<PlaceHit> {
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
  return {
    handled: true,
    reply: res.ok
      ? `SMS an ${displayPlaceName(name)} ist raus. Zustellung prüfe ich nicht.`
      : res.message || `SMS an ${displayPlaceName(name)} nicht gesendet.`,
    tool: commTool('sms', 'SMS', name, { sms: `sms:${number}`, name, body }),
    lastTool: 'maps',
  }
}
