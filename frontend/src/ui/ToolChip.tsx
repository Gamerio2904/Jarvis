import type { ToolMeta } from '../engine/tools'

function mapsRoutes(tool: ToolMeta): Array<{ title: string; url: string }> {
  const raw = tool.result
  if (!raw) return []
  const listed = raw.routes
  if (Array.isArray(listed)) {
    return listed
      .map((row) => {
        const r = row as { title?: string; url?: string }
        return r.url ? { title: r.title || 'Route', url: r.url } : null
      })
      .filter((r): r is { title: string; url: string } => Boolean(r))
  }
  if (typeof raw.url === 'string' && raw.url) {
    return [{ title: String(raw.destination || tool.preview || 'Route'), url: raw.url }]
  }
  return []
}

export function ToolChip({
  tool,
  onConfirm,
}: {
  tool: ToolMeta
  onConfirm?: (text: string) => void
}) {
  const status = tool.tool_status || ''
  const label =
    tool.label ||
    ({
      pending: 'Tool bereit — Confirm?',
      executed: 'Tool ausgeführt',
      aborted: 'Tool abgelehnt',
      duplicate: 'Todo schon offen',
      error: 'Tool-Fehler',
      timeout: 'Confirm abgelaufen',
      parse_miss: 'Tool unklar',
    } as Record<string, string>)[status] ||
    (status ? `Tool: ${status}` : 'Tool')
  return (
    <span className="tool-chip-wrap">
      <span className={`tool-chip tool-chip--${status || 'unknown'}`} data-status={status} data-tool={tool.tool || ''}>
        {label}
      </span>
      {status === 'pending' && onConfirm ? (
        <span className="confirm-row">
          <button type="button" className="confirm-btn yes" onClick={() => onConfirm('Ja')}>
            Ja
          </button>
          <button type="button" className="confirm-btn no" onClick={() => onConfirm('Nein')}>
            Nein
          </button>
        </span>
      ) : null}
      {tool.tool === 'maps'
        ? mapsRoutes(tool).map((r) => (
            <a
              key={r.url}
              className="maps-btn"
              href={r.url}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => {
                e.preventDefault()
                window.open(r.url, '_blank', 'noopener,noreferrer')
              }}
            >
              Route in Google Maps{r.title ? ` · ${r.title}` : ''}
            </a>
          ))
        : null}
      {typeof tool.result?.tel === 'string' && tool.result.tel ? (
        <a
          className="maps-btn"
          href={String(tool.result.tel)}
          onClick={(e) => {
            e.preventDefault()
            window.open(String(tool.result?.tel), '_self')
          }}
        >
          Anrufen{tool.result.name ? ` · ${String(tool.result.name)}` : ''}
        </a>
      ) : null}
      {typeof tool.result?.sms === 'string' && tool.result.sms ? (
        <a
          className="maps-btn"
          href={String(tool.result.sms)}
          onClick={(e) => {
            e.preventDefault()
            window.open(String(tool.result?.sms), '_self')
          }}
        >
          SMS{tool.result.name ? ` · ${String(tool.result.name)}` : ''}
        </a>
      ) : null}
      {typeof tool.result?.image === 'string' && String(tool.result.image).startsWith('data:image/') ? (
        <img className="pc-shot" alt="PC-Bildschirm" src={String(tool.result.image)} />
      ) : null}
    </span>
  )
}
