import { loadSettings, persistLastList, saveSettings } from './store.ts'
import { getJson, postJson } from './http-json.ts'
import type { ToolMeta } from './tools.ts'
import { parseTraceIntent } from './trace-parse.ts'

export { parseTraceIntent }
export type { TraceIntent } from './trace-parse.ts'

export async function handleTrace(
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  const intent = parseTraceIntent(text)
  if (!intent) return { handled: false }
  if (intent.kind === 'explain') {
    return {
      handled: true,
      reply:
        'Jedes Paket hat eine Lebenszeit, TTL. Jeder Router zählt eins runter. Bei null kommt ICMP zurück: Time exceeded. So sieht man die Hops. Vom Handy kein ICMP. Am PC im Hausnetz: Welche Route nimmt google.de.',
      tool: { tool_status: 'executed', tool: 'trace', action: 'explain', label: 'Traceroute' },
      lastTool: 'trace',
    }
  }
  const hops = await runTrace(intent.host)
  if (!hops.ok) {
    return {
      handled: true,
      reply: hops.message,
      tool: { tool_status: 'error', tool: 'trace', action: 'run', label: 'Kein Traceroute' },
      lastTool: 'trace',
    }
  }
  persistLastList('trace', hops.lines)
  saveSettings({ last_trace_host: intent.host, last_hops_json: JSON.stringify(hops.lines) })
  return {
    handled: true,
    reply: `Route zu ${intent.host}:\n${hops.lines.join('\n')}`,
    tool: { tool_status: 'executed', tool: 'trace', action: 'run', label: intent.host, preview: hops.lines[0] || intent.host },
    lastTool: 'trace',
  }
}

async function runTrace(host: string): Promise<{ ok: true; lines: string[] } | { ok: false; message: string }> {
  const s = loadSettings()
  if (!s.pc_enabled || !s.pc_host.trim() || !s.pc_token.trim()) {
    return {
      ok: false,
      message:
        'Vom Handy kein Traceroute — Android gibt kein ICMP. Am Windows-PC JarvisPC starten, dann: Welche Route nimmt google.de.',
    }
  }
  const port = s.pc_port > 0 ? s.pc_port : 18790
  const url = `http://${s.pc_host.trim()}:${port}/v1/trace`
  const headers = {
    'Content-Type': 'application/json',
    'X-Jarvis-Token': s.pc_token.trim(),
    Authorization: `Bearer ${s.pc_token.trim()}`,
  }
  try {
    const { status, json } = await postJson(url, headers, { host }, 25_000)
    if (status === 401) {
      return { ok: false, message: 'PC-Token falsch.' }
    }
    if (!json || json.ok === false) {
      return { ok: false, message: String(json?.message || 'PC hat keine Hops geliefert.') }
    }
    const hops = Array.isArray(json.hops) ? json.hops : []
    const lines = hops.map((h: { hop?: number; host?: string; ip?: string; ms?: number | string }) => {
      const n = h.hop ?? '?'
      const name = String(h.host || h.ip || '*')
      const ms = h.ms == null || h.ms === '*' ? '*' : `${h.ms} ms`
      return `${n}  ${name}  ${ms}`
    })
    if (!lines.length) return { ok: false, message: 'Keine Hops. Firewall oder Timeout.' }
    return { ok: true, lines }
  } catch {
    try {
      await getJson(`http://${s.pc_host.trim()}:${port}/v1/status`, headers)
    } catch {
      /* ignore */
    }
    return {
      ok: false,
      message: 'PC nicht erreicht. JarvisPC.bat im selben WLAN, dann nochmal.',
    }
  }
}
