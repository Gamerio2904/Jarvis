import { HOME_APPS, HOME_APP_IDS, isHomeAppId, type HomeAppId } from './home-apps.ts'

export type HomeFolder = { id: string; name: string; apps: HomeAppId[] }
export type HomeCell = { kind: 'app'; id: HomeAppId } | { kind: 'folder'; folder: HomeFolder } | null
export type HomeLayout = { cols: number; cells: HomeCell[] }

const COLS = 4
const ROWS = 5

export function defaultHomeLayout(): HomeLayout {
  const cells: HomeCell[] = HOME_APPS.map((app) => ({ kind: 'app', id: app.id }))
  while (cells.length < COLS * ROWS) cells.push(null)
  return { cols: COLS, cells }
}

export function parseHomeLayout(raw: string): HomeLayout {
  const fallback = defaultHomeLayout()
  if (!raw.trim()) return fallback
  try {
    const data = JSON.parse(raw) as { cols?: unknown; cells?: unknown }
    if (!Array.isArray(data.cells)) return fallback
    const cells: HomeCell[] = []
    const seen = new Set<HomeAppId>()
    for (const row of data.cells) {
      if (row === null) {
        cells.push(null)
        continue
      }
      if (!row || typeof row !== 'object') continue
      const item = row as { kind?: unknown; id?: unknown; folder?: { id?: unknown; name?: unknown; apps?: unknown } }
      if (item.kind === 'app' && typeof item.id === 'string' && isHomeAppId(item.id) && !seen.has(item.id)) {
        seen.add(item.id)
        cells.push({ kind: 'app', id: item.id })
      } else if (item.kind === 'folder' && item.folder && Array.isArray(item.folder.apps)) {
        const apps = item.folder.apps.filter((id): id is HomeAppId => typeof id === 'string' && isHomeAppId(id) && !seen.has(id))
        for (const id of apps) seen.add(id)
        if (!apps.length) {
          cells.push(null)
          continue
        }
        if (apps.length === 1) {
          cells.push({ kind: 'app', id: apps[0] })
          continue
        }
        const name = typeof item.folder.name === 'string' && item.folder.name.trim() ? item.folder.name.trim().slice(0, 24) : 'Ordner'
        const id = typeof item.folder.id === 'string' && item.folder.id.trim() ? item.folder.id : `ordner-${cells.length}`
        cells.push({ kind: 'folder', folder: { id, name, apps } })
      }
    }
    for (const id of HOME_APP_IDS) {
      if (seen.has(id)) continue
      const hole = cells.findIndex((cell) => cell === null)
      const app: HomeCell = { kind: 'app', id }
      if (hole >= 0) cells[hole] = app
      else cells.push(app)
    }
    while (cells.length < COLS * ROWS) cells.push(null)
    while (cells.length % COLS !== 0) cells.push(null)
    return { cols: COLS, cells }
  } catch {
    return fallback
  }
}

export function serializeHomeLayout(layout: HomeLayout): string {
  return JSON.stringify({ cols: COLS, cells: layout.cells })
}

function cloneCell(cell: HomeCell): HomeCell {
  if (!cell) return null
  if (cell.kind === 'app') return { kind: 'app', id: cell.id }
  return { kind: 'folder', folder: { ...cell.folder, apps: [...cell.folder.apps] } }
}

function appsOf(cell: HomeCell): HomeAppId[] {
  if (!cell) return []
  return cell.kind === 'app' ? [cell.id] : [...cell.folder.apps]
}

export function applyHomeDrop(layout: HomeLayout, from: number, to: number, hoverMs: number): HomeLayout {
  if (from === to || from < 0 || to < 0 || from >= layout.cells.length || to >= layout.cells.length) return layout
  const cells = layout.cells.map(cloneCell)
  const source = cells[from]
  const target = cells[to]
  if (!source) return layout
  if (!target) {
    cells[to] = source
    cells[from] = null
    return { ...layout, cells }
  }
  if (hoverMs < 1000) {
    cells[from] = target
    cells[to] = source
    return { ...layout, cells }
  }
  const apps: HomeAppId[] = []
  for (const id of [...appsOf(source), ...appsOf(target)]) {
    if (!apps.includes(id)) apps.push(id)
  }
  const folder: HomeFolder = target.kind === 'folder'
    ? { ...target.folder, apps }
    : source.kind === 'folder'
      ? { ...source.folder, apps }
      : { id: `ordner-${from}-${to}`, name: 'Ordner', apps }
  cells[to] = { kind: 'folder', folder }
  cells[from] = null
  return { ...layout, cells }
}

export function renameHomeFolder(layout: HomeLayout, folderId: string, name: string): HomeLayout {
  const clean = name.replace(/\s+/g, ' ').trim().slice(0, 24)
  return {
    ...layout,
    cells: layout.cells.map((cell) => {
      if (!cell || cell.kind !== 'folder' || cell.folder.id !== folderId) return cell
      return { kind: 'folder', folder: { ...cell.folder, name: clean || 'Ordner' } }
    }),
  }
}

export function ejectHomeApp(layout: HomeLayout, folderId: string, appId: HomeAppId): HomeLayout {
  const cells = layout.cells.map(cloneCell)
  const index = cells.findIndex((cell) => cell?.kind === 'folder' && cell.folder.id === folderId)
  const folder = cells[index]
  if (!folder || folder.kind !== 'folder') return layout
  const apps = folder.folder.apps.filter((id) => id !== appId)
  const placed: HomeCell = { kind: 'app', id: appId }
  const hole = cells.findIndex((cell, i) => cell === null && i !== index)
  if (apps.length === 0) cells[index] = null
  else if (apps.length === 1) cells[index] = { kind: 'app', id: apps[0] }
  else cells[index] = { kind: 'folder', folder: { ...folder.folder, apps } }
  if (hole >= 0) cells[hole] = placed
  else cells.push(placed)
  while (cells.length % COLS !== 0) cells.push(null)
  return { ...layout, cells }
}

/** Ein Ordner öffnet sich als 3×3. Mehr als neun Apps blättern seitenweise. */
export const FOLDER_PAGE = 9

export function folderPageCount(count: number): number {
  if (count <= 0) return 1
  return Math.ceil(count / FOLDER_PAGE)
}

/** Seite im Kreis: nach der letzten, mit leeren Zellen rechts, kommt wieder die volle. */
export function folderPageSlots<T>(apps: T[], page: number): Array<T | null> {
  const pages = folderPageCount(apps.length)
  const index = ((page % pages) + pages) % pages
  const slice = apps.slice(index * FOLDER_PAGE, index * FOLDER_PAGE + FOLDER_PAGE)
  return Array.from({ length: FOLDER_PAGE }, (_, i) => slice[i] ?? null)
}
