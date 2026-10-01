/** Portfolio der festgeschriebenen Projekte. Eine Zeile je Idee. */

import { readLastEyeImage } from './agent-session.ts'
import { parseChatBlocks } from './chat-blocks.ts'
import { handleImage } from './image-fetch.ts'
import { parseImageAsk, safeImageSrc } from './image-parse.ts'
import { lueckenDocument, projectDocument, projectSlug, pspDocument, sprintsDocument, wegeDocument } from './project-docs.ts'
import type { PortfolioIntent } from './portfolio-parse.ts'
import { saveTreeFile } from '../native/device.ts'
import {
  getAll,
  listIdeas,
  listMessages,
  newId,
  put,
  saveSettings,
  type Idea,
} from './store.ts'

export type CoverKind = 'drawn' | 'photo' | 'research'

export type PortfolioFile = {
  id: string
  name: string
  kind: 'projekt' | 'wege' | 'sprints' | 'psp' | 'luecken' | 'beispiel'
  mime: string
  text: string
  src: string
  source: string
  archived: boolean
}

export type PortfolioCover = {
  kind: CoverKind
  src: string
  source: string
}

export type PortfolioRow = {
  id: string
  idea_id: string
  name: string
  slug: string
  title: string
  fixed_at: string
  cover: PortfolioCover
  files: PortfolioFile[]
  archived: boolean
}

const FILLER = new Set(['der', 'die', 'das', 'ein', 'eine', 'und', 'projekt'])
const MAX_PROJECTS = 48
const MAX_EXAMPLES = 6
const MAX_EXAMPLE = 400 * 1024

const PATH_OK =
  /^portfolio\/[a-z0-9-]{1,40}\/(cover\.jpg|projekt\.json|wege\.json|sprints\.json|psp\.json|luecken\.json|beispiele\/[a-z0-9-]{1,40}\.(jpg|png|webp))$/

export function portfolioPathOk(path: string): boolean {
  return PATH_OK.test(path) && !path.includes('..')
}

export function shortName(title: string): string {
  const head = (title || '').split(',')[0].replace(/\s+/g, ' ').trim()
  const words = head
    .split(' ')
    .map((w) => w.trim())
    .filter((w) => w && !FILLER.has(w.toLowerCase()))
  const kept = words.join(' ')
  const name = (kept.length <= 22 ? kept : words.slice(0, 2).join(' ')).slice(0, 22).trim()
  return name || 'Projekt'
}

function normalizeRow(row: PortfolioRow): PortfolioRow {
  const files = Array.isArray(row.files) ? row.files.filter((f) => f && typeof f === 'object') : []
  const cover =
    row.cover && typeof row.cover.src === 'string'
      ? row.cover
      : { kind: 'drawn' as const, src: '', source: '' }
  return {
    ...row,
    name: row.name || shortName(row.title || ''),
    files,
    cover,
    archived: Boolean(row.archived),
  }
}

export async function listPortfolio(): Promise<PortfolioRow[]> {
  const rows = await getAll<PortfolioRow>('portfolio')
  return rows.map(normalizeRow).sort((a, b) => (a.fixed_at < b.fixed_at ? 1 : -1))
}

function hueOf(title: string): number {
  let h = 0
  for (const c of title) h = (h * 33 + c.charCodeAt(0)) >>> 0
  return h % 360
}

function monogram(name: string): string {
  const letters = name.replace(/[^0-9A-Za-zÄÖÜäöü]/g, '')
  return (letters || 'PR').slice(0, 2).toUpperCase()
}

function xmlText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function svgCover(name: string, title: string): string {
  const hue = hueOf(title)
  const mono = xmlText(monogram(name))
  const label = xmlText(name.slice(0, 18))
  const alt = (hue + 36) % 360
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue} 46% 24%)"/><stop offset="1" stop-color="hsl(${alt} 32% 10%)"/></linearGradient></defs><rect width="512" height="512" fill="url(#g)"/><circle cx="256" cy="228" r="132" fill="none" stroke="hsl(${hue} 70% 74%)" stroke-opacity="0.85" stroke-width="3"/><circle cx="256" cy="228" r="158" fill="none" stroke="hsl(${hue} 70% 74%)" stroke-opacity="0.28" stroke-width="1"/><text x="256" y="244" text-anchor="middle" font-size="112" fill="#f4f7f8" font-family="sans-serif">${mono}</text><text x="256" y="400" text-anchor="middle" font-size="28" fill="#f4f7f8" fill-opacity="0.78" font-family="sans-serif">${label}</text></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export function drawCover(name: string, title: string): string {
  if (typeof document === 'undefined') return svgCover(name, title)
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  if (!ctx) return svgCover(name, title)
  const hue = hueOf(title)
  const alt = (hue + 36) % 360
  const wash = ctx.createLinearGradient(0, 0, 512, 512)
  wash.addColorStop(0, `hsl(${hue} 46% 24%)`)
  wash.addColorStop(1, `hsl(${alt} 32% 10%)`)
  ctx.fillStyle = wash
  ctx.fillRect(0, 0, 512, 512)
  ctx.strokeStyle = `hsla(${hue}, 70%, 74%, 0.85)`
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(256, 228, 132, 0, Math.PI * 2)
  ctx.stroke()
  ctx.strokeStyle = `hsla(${hue}, 70%, 74%, 0.28)`
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(256, 228, 158, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = '#f4f7f8'
  ctx.font = '600 112px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(monogram(name), 256, 236)
  ctx.font = '500 28px sans-serif'
  ctx.fillStyle = 'rgba(244, 247, 248, 0.78)'
  ctx.fillText(name.slice(0, 18), 256, 400)
  let url = canvas.toDataURL('image/jpeg', 0.7)
  if (url.length > 160_000) url = canvas.toDataURL('image/jpeg', 0.5)
  return url.startsWith('data:image/jpeg') ? url : svgCover(name, title)
}

function jsonFile(id: string, name: string, kind: PortfolioFile['kind'], data: unknown): PortfolioFile {
  return {
    id,
    name,
    kind,
    mime: 'application/json',
    text: JSON.stringify(data, null, 2),
    src: '',
    source: '',
    archived: false,
  }
}

function cardCover(name: string, title: string, examples: PortfolioFile[]): PortfolioCover {
  const shown = [...examples].reverse().find((f) => !f.archived && safeImageSrc(f.src))
  if (shown) {
    const research = /wikipedia|openligadb/i.test(shown.source)
    return { kind: research ? 'research' : 'photo', src: shown.src, source: shown.source }
  }
  return { kind: 'drawn', src: drawCover(name, title), source: '' }
}

async function mirrorFile(path: string, mime: string, text: string, base64 = ''): Promise<'ok' | 'missing' | 'fail'> {
  if (!portfolioPathOk(path)) return 'fail'
  const saved = await saveTreeFile(path, mime, text, base64)
  if (saved.missing) return 'missing'
  return saved.ok ? 'ok' : 'fail'
}

function dataPayload(src: string): { mime: string; base64: string } | null {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/i.exec(src)
  if (!m) return null
  return { mime: m[1].toLowerCase() === 'image/jpg' ? 'image/jpeg' : m[1].toLowerCase(), base64: m[2] }
}

async function mirrorRow(row: PortfolioRow): Promise<'ok' | 'missing' | 'fail'> {
  let state: 'ok' | 'missing' | 'fail' = 'ok'
  const putOne = async (path: string, mime: string, text: string, base64 = '') => {
    if (state === 'missing' || state === 'fail') return
    state = await mirrorFile(path, mime, text, base64)
  }
  const drawn = dataPayload(drawCover(row.name, row.title))
  if (drawn?.mime === 'image/jpeg') {
    await putOne(`portfolio/${row.slug}/cover.jpg`, drawn.mime, '', drawn.base64)
  }
  for (const file of row.files) {
    if (file.kind === 'beispiel' || file.archived) continue
    await putOne(`portfolio/${row.slug}/${file.name}`, 'application/json', file.text)
  }
  for (const file of row.files) {
    if (file.kind !== 'beispiel' || file.archived) continue
    const img = dataPayload(file.src)
    if (!img) continue
    const ext = img.mime === 'image/png' ? 'png' : img.mime === 'image/webp' ? 'webp' : 'jpg'
    const name = file.name.replace(/\.(jpg|png|webp)$/i, `.${ext}`)
    await putOne(`portfolio/${row.slug}/beispiele/${name}`, img.mime, '', img.base64)
  }
  return state
}

function uniqueSlug(title: string, ideaId: string, rows: PortfolioRow[]): string {
  const prev = rows.find((r) => r.id === ideaId || r.idea_id === ideaId)
  if (prev && portfolioPathOk(`portfolio/${prev.slug}/cover.jpg`)) return prev.slug
  const base = projectSlug(title).slice(0, 40) || 'projekt'
  const taken = (slug: string) => rows.some((r) => r.slug === slug && r.id !== ideaId && r.idea_id !== ideaId)
  const free = (slug: string) => !taken(slug) && portfolioPathOk(`portfolio/${slug}/cover.jpg`)
  if (free(base)) return base
  const tail = ideaId.replace(/[^a-z0-9]/gi, '').toLowerCase().slice(-6) || '2'
  const room = Math.max(1, 39 - tail.length)
  const stamped = `${base.slice(0, room)}-${tail}`.replace(/^-|-$/g, '').slice(0, 40)
  if (stamped && free(stamped)) return stamped
  for (let n = 2; n < 40; n += 1) {
    const suffix = `-${n}`
    const next = `${base.slice(0, 40 - suffix.length)}${suffix}`.replace(/^-/, '')
    if (free(next)) return next
  }
  return tail.slice(0, 40)
}

export async function commitPortfolio(idea: Idea): Promise<{
  created: boolean
  revived: boolean
  full: boolean
  row: PortfolioRow | null
  folder: 'ok' | 'missing' | 'fail'
}> {
  const rows = await listPortfolio()
  const prev = rows.find((r) => r.idea_id === idea.id || r.id === idea.id)
  if (!prev && rows.length >= MAX_PROJECTS) {
    return { created: false, revived: false, full: true, row: null, folder: 'ok' }
  }
  const name = shortName(idea.title)
  const slug = uniqueSlug(idea.title, idea.id, rows)
  const examples = (prev?.files || []).filter((f) => f.kind === 'beispiel')
  const files: PortfolioFile[] = [
    jsonFile('projekt', 'projekt.json', 'projekt', projectDocument(idea)),
    jsonFile('wege', 'wege.json', 'wege', wegeDocument(idea)),
    jsonFile('sprints', 'sprints.json', 'sprints', sprintsDocument(idea)),
    jsonFile('psp', 'psp.json', 'psp', pspDocument(idea)),
    jsonFile('luecken', 'luecken.json', 'luecken', lueckenDocument(idea)),
    ...examples,
  ]
  const row: PortfolioRow = {
    id: idea.id,
    idea_id: idea.id,
    name,
    slug,
    title: idea.title,
    fixed_at: new Date().toISOString(),
    cover: cardCover(name, idea.title, examples),
    files,
    archived: false,
  }
  await put('portfolio', row)
  const folder = await mirrorRow(row)
  return { created: !prev, revived: Boolean(prev?.archived), full: false, row, folder }
}

export async function mirrorPortfolio(rows: PortfolioRow[]): Promise<void> {
  for (const row of rows) {
    try {
      await mirrorRow(row)
    } catch {
      /* die Zeile bleibt, der Ordner ist nur die Kopie */
    }
  }
}

function matchRows(rows: PortfolioRow[], query: string): PortfolioRow[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const byName = rows.filter((r) => r.name.toLowerCase() === q)
  if (byName.length) return byName
  const byTitle = rows.filter((r) => r.title.toLowerCase() === q)
  if (byTitle.length) return byTitle
  return rows.filter((r) => r.name.toLowerCase().includes(q) || r.title.toLowerCase().includes(q))
}

function which(rows: PortfolioRow[]): string {
  return `Welches: ${rows.map((r) => r.title).join(', ')}.`
}

function fileList(row: PortfolioRow): string {
  const names = row.files.filter((f) => !f.archived).map((f) => f.name)
  if (!names.length) return `${row.name}.`
  return `${row.name}. ${names.join(', ')}.`
}

function openRow(row: PortfolioRow): void {
  saveSettings({
    tischplatte_on: true,
    portfolio_focus: row.id,
    portfolio_file: '',
  })
}

export async function handlePortfolio(conversationId: string, intent: PortfolioIntent): Promise<string> {
  const rows = await listPortfolio()
  if (intent.kind === 'home') {
    saveSettings({ tischplatte_on: true, portfolio_focus: '', portfolio_file: '' })
    const visible = rows.filter((r) => !r.archived)
    if (!visible.length) return 'Das Portfolio ist leer.'
    return `Im Portfolio: ${visible.map((r) => r.name).join(', ')}.`
  }
  const hits = matchRows(rows, intent.name)
  if (!hits.length) return 'Das Projekt liegt nicht im Portfolio.'
  if (hits.length > 1) return which(hits)
  const row = hits[0]
  if (intent.kind === 'open') {
    openRow(row)
    return fileList(row)
  }
  if (intent.kind === 'archive') {
    if (row.archived) return 'Das Projekt liegt nicht auf dem Bildschirm.'
    row.archived = true
    await put('portfolio', row)
    saveSettings({ portfolio_focus: '', portfolio_file: '' })
    return `${row.name} liegt im Archiv.`
  }
  if (intent.kind === 'restore') {
    row.archived = false
    await put('portfolio', row)
    saveSettings({ tischplatte_on: true, portfolio_focus: '', portfolio_file: '' })
    return `${row.name} liegt im Portfolio.`
  }
  return addExample(conversationId, row, intent.image)
}

async function lastChatImage(conversationId: string): Promise<{ src: string; source: string } | null> {
  if (!conversationId) return null
  const msgs = await listMessages(conversationId)
  for (let i = msgs.length - 1; i >= 0; i -= 1) {
    const blocks = parseChatBlocks(msgs[i].meta?.blocks)
    for (let j = blocks.length - 1; j >= 0; j -= 1) {
      const block = blocks[j]
      if (block.kind === 'image' && safeImageSrc(block.src)) return { src: block.src, source: block.source }
    }
  }
  return null
}

function keepRemote(src: string): { src: string } | null {
  return src.startsWith('https://') ? { src } : null
}

async function shrinkImage(src: string): Promise<{ src: string } | { error: string }> {
  const safe = safeImageSrc(src)
  if (!safe) return { error: 'Kein Bild zum Speichern.' }
  if (typeof document === 'undefined' || typeof createImageBitmap !== 'function') {
    if (safe.startsWith('data:image/') && safe.length < MAX_EXAMPLE * 1.4) return { src: safe }
    const remote = keepRemote(safe)
    if (remote) return remote
    return { error: 'Das Bild ist zu groß.' }
  }
  try {
    const blob = await (await fetch(safe)).blob()
    const bmp = await createImageBitmap(blob)
    const scale = Math.min(1, 1024 / Math.max(bmp.width, bmp.height))
    const w = Math.max(1, Math.round(bmp.width * scale))
    const h = Math.max(1, Math.round(bmp.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      bmp.close()
      const remote = keepRemote(safe)
      if (remote) return remote
      return { error: 'Das Bild ist zu groß.' }
    }
    ctx.drawImage(bmp, 0, 0, w, h)
    bmp.close()
    let url = canvas.toDataURL('image/jpeg', 0.72)
    if (url.length > MAX_EXAMPLE * 1.4) url = canvas.toDataURL('image/jpeg', 0.6)
    if (url.length > MAX_EXAMPLE * 1.4) return { error: 'Das Bild ist zu groß.' }
    return { src: url }
  } catch {
    const remote = keepRemote(safe)
    if (remote) return remote
    return { error: 'Kein Bild geladen.' }
  }
}

function exampleName(label: string, files: PortfolioFile[]): string {
  const base = projectSlug(label || 'beispiel').slice(0, 32) || 'beispiel'
  const used = new Set(files.map((f) => f.name))
  let name = `${base}.jpg`
  let n = 2
  while (used.has(name)) {
    name = `${base}-${n}.jpg`
    n += 1
  }
  return name
}

async function addExample(conversationId: string, row: PortfolioRow, image: string): Promise<string> {
  const kept = row.files.filter((f) => f.kind === 'beispiel')
  if (kept.length >= MAX_EXAMPLES) return 'Sechs Beispiele sind voll.'
  let picked: { src: string; source: string } | null = null
  if (image) {
    const ask = parseImageAsk(image) || parseImageAsk(`Bild ${image}`)
    if (!ask) return 'Kein Bild zum Speichern.'
    const got = await handleImage(ask)
    const block = got.blocks?.find((b) => b.kind === 'image')
    if (!block || block.kind !== 'image') return 'Kein Bild geladen.'
    picked = { src: block.src, source: block.source }
  } else {
    picked = await lastChatImage(conversationId)
    if (!picked) {
      const eye = readLastEyeImage()
      if (safeImageSrc(eye)) picked = { src: eye, source: 'Foto' }
    }
  }
  if (!picked) return 'Kein Bild zum Speichern.'
  const shrunk = await shrinkImage(picked.src)
  if ('error' in shrunk) return shrunk.error
  const file: PortfolioFile = {
    id: newId(),
    name: exampleName(image || picked.source || 'beispiel', kept),
    kind: 'beispiel',
    mime: 'image/jpeg',
    text: '',
    src: shrunk.src,
    source: picked.source,
    archived: false,
  }
  row.files = [...row.files, file]
  row.cover = cardCover(row.name, row.title, row.files.filter((f) => f.kind === 'beispiel'))
  await put('portfolio', row)
  const folder = await mirrorRow(row)
  saveSettings({ tischplatte_on: true, portfolio_focus: '', portfolio_file: '' })
  if (folder === 'fail') return 'Im Haus gespeichert. Der Ordner fehlt.'
  return `Beispiel liegt bei ${row.name}.`
}

export async function archiveWall(id: string, fileId = ''): Promise<string> {
  const rows = await listPortfolio()
  const row = rows.find((r) => r.id === id)
  if (!row) return 'Das Projekt liegt nicht im Portfolio.'
  if (!fileId) {
    if (row.archived) return 'Das Projekt liegt nicht auf dem Bildschirm.'
    row.archived = true
    await put('portfolio', row)
    saveSettings({ portfolio_focus: '', portfolio_file: '' })
    return `${row.name} liegt im Archiv.`
  }
  const file = row.files.find((f) => f.id === fileId && f.kind === 'beispiel')
  if (!file || file.archived) return 'Das Projekt liegt nicht auf dem Bildschirm.'
  file.archived = true
  row.cover = cardCover(row.name, row.title, row.files.filter((f) => f.kind === 'beispiel'))
  await put('portfolio', row)
  return `Beispiel von ${row.name} liegt im Archiv.`
}

export function previewFile(file: PortfolioFile): string[] {
  if (file.kind === 'beispiel') return [file.source || file.name]
  try {
    const data = JSON.parse(file.text) as {
      projekt?: string
      hinweis?: string
      wege?: Array<{ id?: string; satz?: string }>
      fehlt?: Array<{ name?: string; warum?: string }>
      sprints?: Array<{ n?: string; title?: string; ziel?: string }>
      psp?: Array<{ n?: string; title?: string; ziel?: string; offen?: string }>
    }
    const lines = [String(data.projekt || file.name)]
    for (const weg of data.wege || []) lines.push(`${weg.id || ''} ${weg.satz || ''}`.trim())
    if (data.hinweis) lines.push(data.hinweis)
    for (const gap of data.fehlt || []) lines.push(`${gap.name || ''}: ${gap.warum || ''}`.trim())
    const rows = (data.sprints || data.psp || []) as Array<{ n?: string; title?: string; ziel?: string; offen?: string }>
    for (const sprint of rows) {
      lines.push(`${sprint.n || ''}. ${sprint.title || ''} ${sprint.ziel || ''} ${sprint.offen || ''}`.trim())
    }
    return lines.filter(Boolean).slice(0, 12)
  } catch {
    return [file.name]
  }
}

export async function currentIdeaForTable(): Promise<Idea | undefined> {
  const ideas = await listIdeas()
  return ideas.find((r) => r.status !== 'done') || ideas[0]
}
