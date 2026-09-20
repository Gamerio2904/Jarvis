import { getJson, getText } from './http-json.ts'
import { jsonUA } from './ua.ts'
import { saveSettings } from './store.ts'
import { parseOsintIntent } from './osint-parse.ts'
import { focusJson } from './globe-brief.ts'
import { CITY_FLY_ZOOM } from './globe-gibs.ts'
import { setLageSession } from './lage-session.ts'
import type { ToolMeta } from './tools.ts'

const UA = jsonUA

function pack(reply: string, action: string) {
  return {
    handled: true as const,
    reply,
    tool: {
      tool_status: 'executed' as const,
      tool: 'osint',
      action,
      label: 'OSINT',
    } satisfies ToolMeta,
    lastTool: 'osint',
  }
}

function fly(name: string, lat: number, lon: number) {
  saveSettings({
    hud_view: 'globe',
    hud_force: true,
    hud_hidden: false,
    last_globe_focus: focusJson({ name, lat, lon, blurb: name }, CITY_FLY_ZOOM),
  })
  setLageSession(true)
}

async function domain(host: string): Promise<string> {
  const bits: string[] = []
  try {
    const { status, json } = await getJson(`https://dns.google/resolve?name=${encodeURIComponent(host)}&type=A`, UA)
    if (status >= 200 && status < 300) {
      const ans = Array.isArray(json.Answer) ? json.Answer : []
      const a = ans
        .map((row) => (row && typeof row === 'object' ? String((row as { data?: unknown }).data || '') : ''))
        .filter(Boolean)
        .slice(0, 6)
      if (a.length) bits.push(`A: ${a.join(', ')}`)
    }
  } catch {
    /* ignore */
  }
  try {
    const { status, json } = await getJson(`https://rdap.org/domain/${encodeURIComponent(host)}`, UA)
    if (status >= 200 && status < 300) {
      const name = String(json.ldhName || host)
      const statusList = Array.isArray(json.status) ? json.status.map(String).slice(0, 4).join(', ') : ''
      bits.push(`RDAP ${name}${statusList ? ` (${statusList})` : ''}.`)
    }
  } catch {
    /* ignore */
  }
  try {
    const { status, text } = await getText(`https://crt.sh/?q=${encodeURIComponent(host)}&output=json`, UA)
    if (status >= 200 && status < 300 && text) {
      const rows = JSON.parse(text) as unknown
      const list = Array.isArray(rows) ? rows : []
      const names = new Set<string>()
      for (const row of list.slice(0, 40)) {
        if (!row || typeof row !== 'object') continue
        const cn = String((row as { common_name?: unknown }).common_name || '').trim()
        if (cn) names.add(cn)
      }
      const shown = [...names].slice(0, 8)
      if (shown.length) bits.push(`Zertifikate: ${shown.join(', ')}.`)
    }
  } catch {
    /* ignore */
  }
  if (!bits.length) return `Keine öffentliche WHOIS/DNS-Lage für ${host}.`
  return `${host}. ${bits.join(' ')} Kein Scan.`
}

async function ipLookup(ip: string): Promise<string> {
  try {
    const { status, json } = await getJson(`https://ipwho.is/${encodeURIComponent(ip)}`, UA)
    if (status < 200 || status >= 300) return `IP ${ip}: Quelle antwortet nicht.`
    const city = String(json.city || '').trim()
    const country = String(json.country || '').trim()
    const lat = Number(json.latitude)
    const lon = Number(json.longitude)
    const asn = json.connection && typeof json.connection === 'object' ? String((json.connection as { isp?: unknown }).isp || '') : ''
    if (Number.isFinite(lat) && Number.isFinite(lon)) fly(ip, lat, lon)
    const where = [city, country].filter(Boolean).join(', ')
    return `IP ${ip}${where ? `: ${where}` : ''}${asn ? `, ${asn}` : ''}. Grob, kein Scan.`
  } catch {
    return `IP ${ip} ist nicht erreichbar.`
  }
}

async function cve(id: string): Promise<string> {
  try {
    const { status, json } = await getJson(`https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${encodeURIComponent(id)}`, UA)
    if (status < 200 || status >= 300) return `${id}: NVD antwortet nicht.`
    const vulns = Array.isArray(json.vulnerabilities) ? json.vulnerabilities : []
    const first = vulns[0] && typeof vulns[0] === 'object' ? (vulns[0] as { cve?: { descriptions?: Array<{ lang?: string; value?: string }> } }) : null
    const desc = first?.cve?.descriptions?.find((d) => d.lang === 'en')?.value || first?.cve?.descriptions?.[0]?.value
    if (!desc) return `${id}: NVD ohne Text.`
    return `${id}: ${desc.slice(0, 320)}`
  } catch {
    return `${id}: NVD ist nicht erreichbar.`
  }
}

async function sanctions(query: string): Promise<string> {
  try {
    const { status, json } = await getJson(`https://api.opensanctions.org/search/default?q=${encodeURIComponent(query)}`, UA)
    if (status < 200 || status >= 300) return `Sanktionen: OpenSanctions antwortet nicht.`
    const results = Array.isArray(json.results) ? json.results : []
    if (!results.length) return `${query}: kein Treffer in OpenSanctions.`
    const names = results
      .slice(0, 3)
      .map((row) => (row && typeof row === 'object' ? String((row as { caption?: unknown }).caption || '') : ''))
      .filter(Boolean)
    return `${query}: Treffer ${names.join('; ')}. Öffentliche Liste, keine Anklage.`
  } catch {
    return `Sanktionen für ${query} nicht erreichbar.`
  }
}

async function github(user: string): Promise<string> {
  try {
    const { status, json } = await getJson(`https://api.github.com/users/${encodeURIComponent(user)}`, UA)
    if (status === 404) return `GitHub: ${user} gibt es öffentlich nicht.`
    if (status < 200 || status >= 300) return `GitHub antwortet nicht.`
    const name = String(json.login || user)
    const bio = String(json.bio || '').trim()
    return `GitHub ${name}${bio ? `: ${bio.slice(0, 160)}` : ''}. Öffentliches Profil.`
  } catch {
    return `GitHub ist nicht erreichbar.`
  }
}

export async function handleOsint(text: string): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  const intent = parseOsintIntent(text)
  if (!intent) return { handled: false }
  if (intent.kind === 'refuse_scan') {
    return pack('Aktiven Scan, Sweep und fremde Leaks mache ich nicht. Traceroute nur für Ihr Netz.', 'refuse')
  }
  if (intent.kind === 'domain') return pack(await domain(intent.host), 'domain')
  if (intent.kind === 'ip') return pack(await ipLookup(intent.ip), 'ip')
  if (intent.kind === 'cve') return pack(await cve(intent.id), 'cve')
  if (intent.kind === 'sanctions') return pack(await sanctions(intent.query), 'sanctions')
  if (intent.kind === 'github') return pack(await github(intent.user), 'github')
  return pack('Shodan habe ich ohne Ihren Key nicht.', 'shodan_off')
}
