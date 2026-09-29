import type { ToolMeta } from './tools.ts'
import { parseBoardIntent } from './board-parse.ts'
import { parseThemeHint, serializeTheme, cycleMotif, DEFAULT_THEME } from './board-theme.ts'
import { parseBoardJobs, serializeBoardJobs, upsertJob, stopJobs, type BoardJob } from './board-jobs.ts'
import { catalogByArea, catalogPlanned, FEATURE_CATALOG, formatCatalog } from './feature-catalog.ts'
import { fillDeepResearchLinks } from './web-search.ts'
import { githubToken } from './github-search.ts'
import { listIdeas, loadSettings, newId, putIdea, saveSettings } from './store.ts'
import { emptyPlan, formatPlan } from './idea-plan.ts'
import { fillPlanWithModel, pickIdea } from './idea.ts'
import { acceptProposal, pendingProposals, proposalLine, proposeMemory, rejectProposal } from './memory-propose.ts'

export { parseBoardIntent } from './board-parse.ts'

function pack(reply: string, action: string, extra?: Record<string, unknown>): {
  handled: true
  reply: string
  tool: ToolMeta
  lastTool: string
} {
  return {
    handled: true,
    reply,
    lastTool: 'board',
    tool: { tool_status: 'executed', tool: 'board', action, label: 'Tischplatte', result: extra },
  }
}

function saveJobs(rows: BoardJob[]): void {
  try {
    saveSettings({ board_jobs_json: serializeBoardJobs(rows) })
  } catch {
    /* */
  }
}

export async function handleBoard(_conversationId: string, text: string): Promise<{
  handled: boolean
  reply?: string
  tool?: ToolMeta
  lastTool?: string
}> {
  const intent = parseBoardIntent(text)
  if (!intent) return { handled: false }

  if (intent.kind === 'on') {
    try {
      saveSettings({ tischplatte_on: true, tischplatte_view: loadSettings().tischplatte_view || 'sprints' })
    } catch {
      /* */
    }
    return pack('Tischplatte an. Icons aus. Kein Gesicht in der Mitte.', 'on')
  }
  if (intent.kind === 'off') {
    try {
      saveSettings({ tischplatte_on: false })
    } catch {
      /* */
    }
    return pack('Tischplatte aus. Icons wieder.', 'off')
  }
  if (intent.kind === 'theme') {
    const cur = parseThemeHint(loadSettings().tischplatte_hint)
    const next = { ...cur, motif: cycleMotif(cur.motif) }
    try {
      saveSettings({ tischplatte_hint: serializeTheme(next), tischplatte_seed: Date.now() % 1_000_000 })
    } catch {
      /* */
    }
    return pack(`Hintergrund: ${next.motif}, Accent ${next.accent}. Gilt für Launcher und Werkbank.`, 'theme')
  }
  if (intent.kind === 'stop') {
    saveJobs(stopJobs(parseBoardJobs(loadSettings().board_jobs_json)))
    return pack('Jobs gestoppt.', 'stop')
  }
  if (intent.kind === 'view') {
    try {
      saveSettings({
        tischplatte_on: true,
        tischplatte_view: intent.view,
        tischplatte_focus: intent.sim || '',
      })
    } catch {
      /* */
    }
    if (intent.view === 'sim') {
      return pack(`Simulation ${intent.sim || 'Modul'}: Drahtgitter, keine Live-App.`, 'sim', { view: intent.view })
    }
    return pack(`Sicht ${intent.view}.`, 'view', { view: intent.view })
  }
  if (intent.kind === 'catalog') {
    if (intent.mode === 'planned') {
      const rows = catalogPlanned('18.16.0').slice(0, 8)
      return pack(formatCatalog(rows), 'catalog')
    }
    if (intent.mode === 'can') {
      return pack(formatCatalog(FEATURE_CATALOG.slice(0, 12)), 'catalog')
    }
    const rows = catalogByArea(intent.area || '')
    const extra = intent.mode === 'docs' ? ' Die APK hat keinen Docs-Ordner.' : ''
    return pack(`${formatCatalog(rows, intent.area)}${extra}`, 'catalog')
  }
  if (intent.kind === 'proposal') {
    const res = intent.accept ? await acceptProposal() : await rejectProposal()
    return pack(res.reply, intent.accept ? 'propose_yes' : 'propose_no')
  }
  if (intent.kind === 'jobs') {
    try {
      saveSettings({ tischplatte_on: true, tischplatte_view: 'research' })
    } catch {
      /* */
    }
    let jobs = parseBoardJobs(loadSettings().board_jobs_json)
    const researchJob: BoardJob = {
      id: newId(),
      kind: 'research',
      status: 'running',
      label: 'Recherche läuft',
      at: Date.now(),
    }
    jobs = upsertJob(jobs, researchJob)
    saveJobs(jobs)
    const topic = (intent.research || '').trim()
    const q = `Recherchiere tief: Open-Source ${topic}`
    const web = await fillDeepResearchLinks(q, '', undefined)
    const merged = web
    try {
      saveSettings({ last_research_json: JSON.stringify(merged) })
    } catch {
      /* */
    }
    const withUrl = (merged.sources || []).filter((s) => s.url).slice(0, 3)
    for (const s of withUrl) {
      await proposeMemory({
        key: 'research',
        value: (s.snippet || s.title).slice(0, 180),
        category: 'research',
        url: s.url,
        origin: 'research',
      })
    }
    researchJob.status = withUrl.length ? 'done' : 'failed'
    researchJob.label = withUrl.length ? 'Recherche liegt' : 'Recherche leer'
    jobs = upsertJob(jobs, researchJob)

    let planLine = ''
    if (intent.planIndex || intent.planQuery) {
      const planJob: BoardJob = {
        id: newId(),
        kind: 'plan',
        status: 'running',
        label: 'Plan läuft',
        at: Date.now(),
      }
      jobs = upsertJob(jobs, planJob)
      saveJobs(jobs)
      const rows = await listIdeas()
      const hit = pickIdea(rows, intent.planQuery, intent.planIndex)
      if (!hit) {
        planJob.status = 'failed'
        planJob.label = 'Idee fehlt'
        planLine = 'Die Idee finde ich nicht.'
      } else {
        const filled = await fillPlanWithModel(hit)
        if (!filled) {
          const empty = hit.plan || emptyPlan(hit.id)
          await putIdea({ ...hit, plan: empty })
          planJob.status = 'failed'
          planJob.label = 'Plan-Vorlage leer'
          planLine = 'Kein Cloud-Key — Vorlage liegt, ohne erfundene Repos.'
        } else {
          await putIdea({ ...hit, plan: filled })
          planJob.status = 'done'
          planJob.label = 'Plan liegt'
          planLine = formatPlan(filled, hit.title)
        }
      }
      jobs = upsertJob(jobs, planJob)
    }
    saveJobs(jobs)
    const n = (merged.sources || []).filter((s) => s.url).length
    const ghNote = githubToken() ? '' : ' Ohne GitHub-Key nur öffentliche HTML-Suche, unvollständig.'
    const pending = await pendingProposals()
    const offer = pending[0] ? ` ${proposalLine(pending[0])}` : ''
    const seeking = intent.planIndex || intent.planQuery ? 'Ich suche und fülle den Plan.' : 'Ich suche.'
    const reply = `${seeking} ${n} Quellen.${ghNote}${planLine ? `\n${planLine}` : ''}${offer}`
    return pack(reply, 'jobs', { sources: n })
  }
  return { handled: false }
}

export function currentTheme() {
  return parseThemeHint(loadSettings().tischplatte_hint) || DEFAULT_THEME
}
