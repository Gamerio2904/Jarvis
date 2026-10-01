import { useEffect, useRef, useState } from 'react'
import { safeImageSrc } from '../engine/image-parse.ts'
import {
  archiveWall,
  listPortfolio,
  previewFile,
  type PortfolioFile,
  type PortfolioRow,
} from '../engine/portfolio.ts'
import { loadSettings, saveSettings } from '../engine/store.ts'
import Shredder from './Shredder.tsx'

type WallItem = {
  id: string
  projectId: string
  fileId: string
  name: string
  src: string
  source: string
}

function wallItems(rows: PortfolioRow[]): WallItem[] {
  const out: WallItem[] = []
  for (const row of rows) {
    if (row.archived) continue
    out.push({
      id: row.id,
      projectId: row.id,
      fileId: '',
      name: row.name,
      src: row.cover.src,
      source: row.cover.source,
    })
    for (const file of row.files) {
      if (file.kind !== 'beispiel' || file.archived) continue
      out.push({
        id: `${row.id}:${file.id}`,
        projectId: row.id,
        fileId: file.id,
        name: row.name,
        src: file.src,
        source: file.source,
      })
    }
  }
  return out
}

function orderedFiles(row: PortfolioRow): PortfolioFile[] {
  const rank: Record<PortfolioFile['kind'], number> = {
    projekt: 0,
    wege: 1,
    sprints: 2,
    psp: 3,
    luecken: 4,
    beispiel: 5,
  }
  const files = Array.isArray(row.files) ? row.files : []
  return files.filter((f) => !f.archived).sort((a, b) => rank[a.kind] - rank[b.kind])
}

function rowSignature(list: PortfolioRow[]): string {
  return list
    .map((row) => {
      const files = Array.isArray(row.files) ? row.files : []
      const bits = files.map((f) => `${f.id}:${f.name}:${f.archived ? 1 : 0}:${f.kind}`).join(',')
      return `${row.id}:${row.archived ? 1 : 0}:${row.cover?.kind || ''}:${row.cover?.src?.length || 0}:${bits}`
    })
    .join('\n')
}

export function PortfolioStage() {
  const [rows, setRows] = useState<PortfolioRow[]>([])
  const [focus, setFocus] = useState('')
  const [fileId, setFileId] = useState('')
  const [note, setNote] = useState('')
  const sig = useRef('')

  useEffect(() => {
    let dead = false
    const load = () => {
      const settings = loadSettings()
      setFocus(settings.portfolio_focus || '')
      setFileId(settings.portfolio_file || '')
      void listPortfolio()
        .then((list) => {
          if (dead) return
          const next = rowSignature(list)
          if (next === sig.current) return
          sig.current = next
          setRows(list)
        })
        .catch(() => {
          if (dead) return
          sig.current = ''
          setRows([])
        })
    }
    load()
    window.addEventListener('jarvis-settings', load)
    const id = window.setInterval(load, 2_000)
    return () => {
      dead = true
      window.removeEventListener('jarvis-settings', load)
      window.clearInterval(id)
    }
  }, [])

  const open = rows.find((r) => r.id === focus)
  const files = open ? orderedFiles(open) : []
  const preview = files.find((f) => f.id === fileId) || null
  const items = wallItems(rows)

  function showProject(projectId: string, nextFile = '') {
    saveSettings({ tischplatte_on: true, portfolio_focus: projectId, portfolio_file: nextFile })
  }

  return (
    <div className={`portfolio-stage${open ? ' is-open' : ''}`} aria-label="Portfolio">
      {items.length ? (
        <Shredder
          items={items}
          width={640}
          height={520}
          feedSpeed={180}
          bite={18}
          stripWidth={10}
          curl={1}
          dragTilt={6}
          lift={1.02}
          autoAnimate={false}
          autoFeed
          slitColor="#14343c"
          color="#e7f2f4"
          disabled={Boolean(open)}
          onOpen={(item) => showProject(item.projectId, item.fileId)}
          onShred={(item) => {
            void archiveWall(item.projectId, item.fileId).then((reply) => setNote(reply))
          }}
          renderItem={(item) => {
            const src = safeImageSrc(item.src)
            return (
              <div className="portfolio-card">
                {src ? <img src={src} alt="" /> : <span className="portfolio-card-fallback" />}
                <span>{item.name}</span>
              </div>
            )
          }}
        />
      ) : (
        <p className="portfolio-empty">Das Portfolio ist leer.</p>
      )}
      {note ? <p className="portfolio-note">{note}</p> : null}
      {open ? (
        <div className="portfolio-files" role="dialog" aria-label={open.name}>
          <button type="button" className="portfolio-back" onClick={() => showProject('', '')}>
            Zurück
          </button>
          <p className="portfolio-files-title">{open.title}</p>
          <ul>
            {files.map((file) => (
              <li key={file.id}>
                <button type="button" onClick={() => showProject(open.id, file.id)}>
                  {file.name}
                </button>
              </li>
            ))}
          </ul>
          {preview ? (
            <div className="portfolio-preview">
              {preview.kind === 'beispiel' && safeImageSrc(preview.src) ? (
                <img src={safeImageSrc(preview.src) || ''} alt={preview.source || preview.name} />
              ) : (
                previewFile(preview).map((line, i) => <p key={`${preview.id}-${i}`}>{line}</p>)
              )}
              {preview.source ? <p className="portfolio-source">{preview.source}</p> : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
