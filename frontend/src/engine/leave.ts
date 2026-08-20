import { parseLeaveIntent } from './leave-parse'
import { geocodePlace, routeMinutes } from './geo-lookup'
import { looksLikeBareStreet, mapsDirUrl, normalizePlaceName } from './places-parse'
import { readDeviceLocation, requestLocationPermission } from '../native/geo'
import { listEvents, listMemory, loadSettings, saveSettings, addReminder } from './store'
import { requestNotifyPermission, scheduleNotify, notifyIdFromKey } from '../native/notify'
import type { ToolMeta } from './tools'

export { parseLeaveIntent } from './leave-parse'

function mapsTool(url: string, dest: string): ToolMeta {
  return {
    tool_status: 'executed',
    tool: 'maps',
    action: 'route',
    label: 'Route',
    preview: dest,
    result: { url, destination: dest, routes: [{ title: dest, url, destination: dest }] },
  }
}

async function resolvePlace(query: string): Promise<string | null> {
  const q = normalizePlaceName(query)
  const events = await listEvents()
  const ev = [...events]
    .reverse()
    .find(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        q.includes(e.title.toLowerCase()) ||
        (e.place || '').toLowerCase().includes(q),
    )
  if (ev?.place) return ev.place
  const mem = await listMemory()
  const person = mem.find(
    (m) =>
      (m.category === 'place' || m.category === 'contact') &&
      (m.key === q || m.key.includes(q) || q.includes(m.key)),
  )
  if (person?.category === 'place' && person.value) return person.value
  const place = mem.find((m) => m.category === 'place' && (m.key === q || q.includes(m.key)))
  if (place?.value) return place.value
  if (ev && !ev.place) return null
  return null
}

export async function handleLeave(
  _conversationId: string,
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  const s = loadSettings()
  if (s.last_step_tool === 'leave_ask_city' && s.last_step_title && s.last_step_when) {
    const city = text.trim().replace(/^[iI]n\s+/, '').replace(/[.!?]+$/, '')
    if (city.length >= 2 && city.length <= 80 && !/[?]/.test(city) && !looksLikeBareStreet(city)) {
      saveSettings({ last_step_tool: 'leave', last_step_title: s.last_step_title, last_step_when: '' })
      return leaveTo(s.last_step_title, `${s.last_step_when}, ${city}`)
    }
  }
  if (s.last_step_tool === 'leave_ask' && s.last_step_title) {
    const place = text.trim().replace(/^[iI]n\s+/, '').replace(/[.!?]+$/, '')
    if (place.length >= 2 && place.length <= 80 && !/[?]/.test(place)) {
      saveSettings({ last_step_tool: 'leave', last_step_title: s.last_step_title })
      return leaveTo(s.last_step_title, place)
    }
  }

  const intent = parseLeaveIntent(text)
  if (!intent) return { handled: false }
  const place = await resolvePlace(intent.query)
  if (!place) {
    saveSettings({ last_step_tool: 'leave_ask', last_step_title: normalizePlaceName(intent.query) })
    return {
      handled: true,
      reply: `Wo ist ${intent.query}? Dann sage ich, wann Sie losmüssen.`,
      tool: { tool_status: 'executed', tool: 'maps', action: 'ask', label: 'Ort fehlt', preview: intent.query },
      lastTool: 'leave_ask',
    }
  }
  return leaveTo(intent.query, place)
}

async function leaveTo(
  label: string,
  place: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  const granted = await requestLocationPermission()
  const here = granted ? await readDeviceLocation() : { ok: false as const, message: 'Standort erlauben.' }
  if (!here.ok || here.lat == null || here.lon == null) {
    if (looksLikeBareStreet(place)) {
      saveSettings({ last_step_tool: 'leave_ask_city', last_step_title: label, last_step_when: place })
      return {
        handled: true,
        reply: `In welcher Stadt liegt ${place}? Ohne Standort rate ich die Straße nicht.`,
        tool: { tool_status: 'executed', tool: 'maps', action: 'ask', label: 'Stadt fehlt', preview: place },
        lastTool: 'leave_ask_city',
      }
    }
    const url = mapsDirUrl(place, 'driving')
    return {
      handled: true,
      reply: `Kein Standort jetzt. Route zu ${place} — in Google Maps öffnen. Fahrzeit kann ich ohne Fix nicht sagen.`,
      tool: mapsTool(url, place),
      lastTool: 'leave',
    }
  }
  const dest = await geocodePlace(place, { lat: here.lat, lon: here.lon })
  if (!dest.ok) {
    if (looksLikeBareStreet(place)) {
      saveSettings({ last_step_tool: 'leave_ask_city', last_step_title: label, last_step_when: place })
      return {
        handled: true,
        reply: dest.message,
        tool: { tool_status: 'executed', tool: 'maps', action: 'ask', label: 'Stadt fehlt', preview: place },
        lastTool: 'leave_ask_city',
      }
    }
    return {
      handled: true,
      reply: dest.message,
      lastTool: 'leave',
    }
  }
  const ride = await routeMinutes({ lat: here.lat, lon: here.lon }, dest.fix)
  const url = mapsDirUrl(place, 'driving')
  if (!ride.ok) {
    return {
      handled: true,
      reply: `${ride.message} Route zu ${place} liegt trotzdem.`,
      tool: mapsTool(url, place),
      lastTool: 'leave',
    }
  }
  const events = await listEvents()
  const q = normalizePlaceName(label)
  const ev = [...events]
    .filter((e) => new Date(e.start_at).getTime() >= Date.now() - 60_000)
    .find((e) => e.title.toLowerCase().includes(q) || (e.place || '').toLowerCase().includes(q))
  const buffer = 10
  let extra = ''
  if (ev) {
    const leaveAt = new Date(new Date(ev.start_at).getTime() - (ride.minutes + buffer) * 60_000)
    extra = ` Für ${ev.title} um ${new Date(ev.start_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}: ${leaveAt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} los (inkl. ${buffer} Min Puffer).`
    if (leaveAt.getTime() > Date.now() + 30_000) {
      try {
        await requestNotifyPermission()
        const row = await addReminder({
          title: `Los: ${ev.title}`,
          due_at: leaveAt.toISOString(),
          kind: 'once',
        })
        await scheduleNotify({
          id: notifyIdFromKey(row.id),
          title: 'Jarvis — losfahren',
          body: extra.trim(),
          at: leaveAt,
        })
        extra += ' Erinnerung liegt.'
      } catch {
        /* ohne Notify trotzdem die Uhrzeit */
      }
    }
  }
  return {
    handled: true,
    reply: `Fahrzeit nach ${place}: etwa ${ride.minutes} Minuten.${extra} Route in Google Maps.`,
    tool: mapsTool(url, place),
    lastTool: 'leave',
  }
}
