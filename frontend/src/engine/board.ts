import type { ToolMeta } from './tools.ts'
import { parseBoardIntent } from './board-parse.ts'
import { parseThemeHint, serializeTheme, nextTheme, motifLabel, themeFromWords, DEFAULT_THEME } from './board-theme.ts'
import { parseBoardJobs, serializeBoardJobs, upsertJob, stopJobs, type BoardJob } from './board-jobs.ts'
import { catalogByArea, catalogPlanned, FEATURE_CATALOG, formatCatalog } from './feature-catalog.ts'
import { fillDeepResearchLinks } from './web-search.ts'
import { geminiReady } from './gemini.ts'
import { groqReady } from './groq.ts'
import { githubToken } from './github-search.ts'
import { pieceLabel } from './board-pieces.ts'
import { listIdeas, loadSettings, newId, putIdea, saveSettings } from './store.ts'
import { emptyPlan, formatPlan, planFromSources, planHasBody } from './idea-plan.ts'
import { fillPlanWithModel, pickIdea } from './idea.ts'
import { fileFor, saveProjectJson } from './project-docs.ts'
import { acceptProposal, pendingProposals, proposalLine, proposeMemory, rejectProposal } from './memory-propose.ts'
import { handleEntwurf, finishScan, hideDraftFrames } from './entwurf.ts'

export { parseBoardIntent } from './board-parse.ts'

function isCodeHost(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    return /(?:^|\.)(?:github|gitlab|codeberg|bitbucket|sourceforge)\./i.test(host)
  } catch {
    return /github\.com|gitlab\.com|codeberg\.org/i.test(url)
  }
}

function isProjectDir(url: string): boolean {
  return /libhunt\.com|github\.io|awesome-/i.test(url)
}

function preferCode(sources: Array<{ url: string; title?: string; snippet?: string }>) {
  const rows = sources.filter((s) => s.url)
  const code = rows.filter((s) => isCodeHost(s.url))
  const rest = rows.filter((s) => !isCodeHost(s.url))
  return { code, ordered: [...code, ...rest] }
}

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

function researchTitles(): string[] {
  try {
    const raw = loadSettings().last_research_json
    if (!raw) return []
    const parsed = JSON.parse(raw) as { sources?: Array<{ title?: string; url?: string }> }
    if (!Array.isArray(parsed.sources)) return []
    return parsed.sources
      .filter((s) => s && s.url)
      .map((s) => String(s.title || s.url || '').trim())
      .filter(Boolean)
      .slice(0, 4)
  } catch {
    return []
  }
}

export async function handleBoard(conversationId: string, text: string): Promise<{
  handled: boolean
  reply?: string
  tool?: ToolMeta
  lastTool?: string
}> {
  const intent = parseBoardIntent(text)
  if (!intent) return { handled: false }

  if (
    intent.kind === 'entwurf' ||
    intent.kind === 'inspiration' ||
    intent.kind === 'draft_pick' ||
    intent.kind === 'draft_close'
  ) {
    return pack(await handleEntwurf(conversationId, intent), intent.kind, { kind: intent.kind })
  }

  if (intent.kind === 'scan') {
    return pack(await finishScan(intent), `scan_${intent.op}`, { op: intent.op })
  }

  if (intent.kind === 'download') {
    const rows = (await listIdeas()).filter((r) => r.status !== 'done')
    const pinned = loadSettings().plan_idea_id
    const hit = intent.query
      ? pickIdea(rows, intent.query)
      : rows.find((r) => r.id === pinned) || pickIdea(rows)
    if (!hit) return pack('Das Projekt finde ich nicht.', 'download')
    const file = fileFor(hit, intent.which)
    const saved = await saveProjectJson(file.name, file.data)
    try {
      saveSettings({ tischplatte_on: true, tischplatte_view: intent.which === 'sprints' ? 'sprints' : 'psp' })
    } catch {
      /* */
    }
    const kind = intent.which === 'psp' ? 'PSP' : intent.which === 'sprints' ? 'Sprints' : 'Projektdateien'
    return pack(`${kind} zu ${hit.title}. ${saved}`, 'download', { title: hit.title })
  }

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
    const named = intent.words ? themeFromWords(intent.words) : null
    if (intent.words && !named) {
      return pack(
        `Hintergrund bleibt ${motifLabel(cur.motif)}, Akzent ${cur.accent}. Ich stelle Orbit, Gitter oder Pulse — zum Beispiel „Hintergrund blau“.`,
        'theme',
      )
    }
    const next = named ? named.theme : nextTheme(cur)
    try {
      saveSettings({ tischplatte_hint: serializeTheme(next), tischplatte_seed: Date.now() % 1_000_000 })
    } catch {
      /* */
    }
    const note = named ? ` ${named.note}` : ''
    return pack(
      `Hintergrund: ${motifLabel(next.motif)}, Akzent ${next.accent}.${note} Gilt für Launcher und Werkbank.`,
      'theme',
    )
  }
  if (intent.kind === 'stop') {
    saveJobs(stopJobs(parseBoardJobs(loadSettings().board_jobs_json)))
    return pack('Jobs gestoppt.', 'stop')
  }
  if (intent.kind === 'place') {
    if (intent.op === 'move' && intent.piece === 'sprintliste' && (intent.dir === 'links' || intent.dir === 'rechts')) {
      const side = intent.dir === 'links' ? 'left' : 'right'
      try {
        saveSettings({ script_sprint_side: side, tischplatte_on: true })
      } catch {
        /* */
      }
      const where = side === 'left' ? 'links' : 'rechts'
      return pack(`Die Sprintliste steht ${where}. Die Tafel bleibt das Skript.`, 'place')
    }
    try {
      saveSettings({ tischplatte_on: true })
    } catch {
      /* */
    }
    const name = 'piece' in intent && intent.piece ? pieceLabel(intent.piece) : 'Alles'
    return pack(`Die Tafel ist fest. ${name} bleibt im Skript.`, 'place')
  }
  if (intent.kind === 'view') {
    if (intent.view === 'sprints' || intent.view === 'psp' || intent.view === 'sim') hideDraftFrames()
    try {
      saveSettings({
        tischplatte_on: true,
        tischplatte_view: intent.view,
        tischplatte_focus: intent.sim || '',
        ...(intent.view === 'sprints' ? { ablauf_list_id: '' } : {}),
      })
    } catch {
      /* */
    }
    if (intent.view === 'sim') {
      return pack(`Simulation ${intent.sim || 'Modul'}: Drahtgitter, keine Live-App.`, 'sim', { view: intent.view })
    }
    if (intent.view === 'research') {
      const titles = researchTitles()
      const line = titles.length
        ? `Sicht research. ${titles.length} Quellen: ${titles.join('; ')}.`
        : 'Sicht research. Keine Quellen im Store.'
      return pack(line, 'view', { view: intent.view })
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
    const bucket = preferCode(web.sources || [])
    const merged = { ...web, sources: bucket.ordered }
    try {
      saveSettings({ last_research_json: JSON.stringify(merged) })
    } catch {
      /* */
    }
    const propose = bucket.code.slice(0, 2)
    for (const s of propose) {
      await proposeMemory({
        key: 'research',
        value: (s.snippet || s.title || s.url).slice(0, 180),
        category: 'research',
        url: s.url,
        origin: 'research',
      })
    }
    const withUrl = bucket.ordered
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
        let filled = await fillPlanWithModel(hit)
        let fromHits = false
        if (!filled || !planHasBody(filled)) {
          const planTitles = (bucket.code.length ? bucket.code : bucket.ordered.filter((s) => isProjectDir(s.url))).map(
            (s) => s.title || '',
          )
          const fromSources = planFromSources(hit.id, hit.title, planTitles)
          if (fromSources) {
            filled = fromSources
            fromHits = true
          }
        }
        if (!filled) {
          const empty = hit.plan || emptyPlan(hit.id)
          await putIdea({ ...hit, plan: empty })
          planJob.status = 'failed'
          planJob.label = 'Plan-Vorlage leer'
          planLine =
            groqReady() || geminiReady()
              ? 'Plan nicht übernommen.'
              : 'Kein Cloud-Key — Vorlage liegt, ohne erfundene Repos.'
        } else {
          await putIdea({ ...hit, plan: filled })
          planJob.status = 'done'
          planJob.label = fromHits ? 'Plan aus Treffern' : 'Plan liegt'
          planLine = fromHits ? 'Plan aus den Treffern, ohne Modell.' : formatPlan(filled, hit.title)
        }
      }
      jobs = upsertJob(jobs, planJob)
    }
    saveJobs(jobs)
    const n = withUrl.length
    const ghNote = githubToken() ? '' : ' Ohne GitHub-Key nur öffentliche HTML-Suche, unvollständig.'
    const articleNote = bucket.code.length ? '' : withUrl.length ? ' Keine Repo-Links.' : ''
    const pending = await pendingProposals()
    const offer = pending[0] ? ` ${proposalLine(pending[0])}` : ''
    const seeking = intent.planIndex || intent.planQuery ? 'Ich suche und fülle den Plan.' : 'Ich suche.'
    const reply = `${seeking} ${n} Quellen.${ghNote}${articleNote}${planLine ? `\n${planLine}` : ''}${offer}`
    return pack(reply, 'jobs', { sources: n })
  }
  return { handled: false }
}

export function currentTheme() {
  return parseThemeHint(loadSettings().tischplatte_hint) || DEFAULT_THEME
}
