import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { copyText } from '../copy-text.ts'
import {
  PROBE_LANES,
  displayGroupTitle,
  groupsForLane,
  searchProbeGroups,
  type ProbeLaneId,
} from '../engine/probe-lanes.ts'
import { prefersReducedMotion } from '../engine/motion.ts'
import type { TestCopyGroup, TestCopyItem } from '../engine/test-copy.ts'
import { useSlidingThumb } from './SlidingThumb.tsx'

const LANE_KEY = 'jarvis_probe_lane'

function loadLane(): ProbeLaneId {
  try {
    const raw = sessionStorage.getItem(LANE_KEY)
    return PROBE_LANES.some((l) => l.id === raw) ? (raw as ProbeLaneId) : 'heute'
  } catch {
    return 'heute'
  }
}

function rememberLane(id: ProbeLaneId) {
  try {
    sessionStorage.setItem(LANE_KEY, id)
  } catch {
    /* private mode */
  }
}

function PromptRow({
  label,
  value,
  onSend,
  busy,
}: {
  label: string
  value: string
  onSend?: (text: string) => void
  busy?: boolean
}) {
  const [done, setDone] = useState<'copy' | 'send' | null>(null)
  return (
    <label className="settings-field copy-field">
      <span>{label}</span>
      <div className="copy-field-row">
        <input readOnly value={value} onFocus={(e) => e.currentTarget.select()} />
        <button
          type="button"
          className="copy-btn"
          disabled={!value.trim()}
          onClick={() => {
            void copyText(value).then((ok) => {
              if (!ok) return
              setDone('copy')
              window.setTimeout(() => setDone(null), 1400)
            })
          }}
        >
          {done === 'copy' ? 'Kopiert' : 'Kopieren'}
        </button>
        {onSend ? (
          <button
            type="button"
            className="copy-btn is-send"
            disabled={!value.trim() || busy}
            onClick={() => {
              onSend(value)
              setDone('send')
              window.setTimeout(() => setDone(null), 1400)
            }}
          >
            {done === 'send' ? 'Gesendet' : 'Senden'}
          </button>
        ) : null}
      </div>
    </label>
  )
}

function GroupBlock({
  group,
  onSend,
  busy,
}: {
  group: TestCopyGroup
  onSend?: (text: string) => void
  busy?: boolean
}) {
  return (
    <div className="probe-group">
      <h4 className="copy-block-title">{displayGroupTitle(group.title)}</h4>
      {group.items.map((item: TestCopyItem) => (
        <PromptRow
          key={`${group.title}·${item.label}`}
          label={item.label}
          value={item.text}
          onSend={onSend}
          busy={busy}
        />
      ))}
    </div>
  )
}

export function ProbeShelf({
  onSend,
  busy,
  debug,
}: {
  onSend?: (text: string) => void
  busy?: boolean
  debug?: ReactNode
}) {
  const [lane, setLane] = useState<ProbeLaneId>(loadLane)
  const [groupId, setGroupId] = useState('all')
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const laneThumb = useSlidingThumb(lane)
  const groupThumb = useSlidingThumb(groupId)
  const searching = query.trim().length > 0

  useEffect(() => {
    rememberLane(lane)
    setGroupId('all')
  }, [lane])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.metaKey || e.ctrlKey) return
      const el = e.target as HTMLElement | null
      const typing =
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLSelectElement ||
        el?.isContentEditable
      if (typing) {
        if (e.key === 'Escape' && query) {
          e.preventDefault()
          setQuery('')
        }
        return
      }
      if (e.key === '/') {
        e.preventDefault()
        searchRef.current?.focus()
        return
      }
      const n = Number(e.key)
      if (n >= 1 && n <= PROBE_LANES.length) {
        e.preventDefault()
        setLane(PROBE_LANES[n - 1].id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [query])

  const laneGroups = useMemo(() => groupsForLane(lane), [lane])
  const shown = useMemo(() => {
    if (searching) return searchProbeGroups(query, 'all')
    if (lane === 'lauf') return []
    if (groupId === 'all') return laneGroups
    return laneGroups.filter((g) => g.title === groupId)
  }, [searching, query, lane, groupId, laneGroups])
  const count = shown.reduce((n, g) => n + g.items.length, 0)
  const face = PROBE_LANES.find((l) => l.id === lane)
  const reduced = prefersReducedMotion()

  return (
    <>
      <section className="settings-card probe-shelf-card" id="sf-debug">
        <h3>Testprompts</h3>
        <p className="settings-lead">
          Spur wählen, nicht die ganze Liste runterfahren. Senden schließt die Folie und gibt den Satz in den Chat.
          Kopieren bleibt fürs Handy-Gerät. Tasten 1–8 wechseln die Spur, / sucht.
        </p>
        <div className="probe-shelf">
          <nav ref={laneThumb.hostRef} className="probe-lanes pill-tabs" aria-label="Test-Spuren">
            <span ref={laneThumb.thumbRef} className="pill-tabs-thumb" aria-hidden />
            {PROBE_LANES.map((l) => (
              <button
                key={l.id}
                type="button"
                data-nav={l.id}
                aria-selected={lane === l.id}
                className={`probe-lane${lane === l.id ? ' is-on' : ''}`}
                onClick={() => setLane(l.id)}
              >
                {l.label}
              </button>
            ))}
          </nav>
          <label className="settings-field probe-search">
            <span className="sr-only">Prompt suchen</span>
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Prompt suchen…  /"
              aria-label="Prompt suchen"
              aria-keyshortcuts="/"
            />
          </label>
          {!searching && lane !== 'lauf' && laneGroups.length > 1 ? (
            <nav ref={groupThumb.hostRef} className="probe-groups pill-tabs" aria-label="Gruppen in der Spur">
              <span ref={groupThumb.thumbRef} className="pill-tabs-thumb" aria-hidden />
              <button
                type="button"
                data-nav="all"
                aria-selected={groupId === 'all'}
                className={`probe-lane${groupId === 'all' ? ' is-on' : ''}`}
                onClick={() => setGroupId('all')}
              >
                Alle
              </button>
              {laneGroups.map((g) => (
                <button
                  key={g.title}
                  type="button"
                  data-nav={g.title}
                  aria-selected={groupId === g.title}
                  className={`probe-lane${groupId === g.title ? ' is-on' : ''}`}
                  onClick={() => setGroupId(g.title)}
                >
                  {displayGroupTitle(g.title)}
                </button>
              ))}
            </nav>
          ) : null}
          <p className="settings-hint">
            {searching
              ? `${count} Treffer in allen Spuren`
              : `${face?.hint || ''} · ${lane === 'lauf' ? 'Debug-Lauf' : `${count} Prompts`}`}
          </p>
        </div>
        {lane === 'lauf' && !searching ? null : (
          <div key={`${lane}-${groupId}-${query}`} className={`probe-stack${reduced ? '' : ' is-motion'}`}>
            {shown.length ? (
              shown.map((g) => <GroupBlock key={g.title} group={g} onSend={onSend} busy={busy} />)
            ) : (
              <p className="memory-empty">{searching ? `Kein Prompt zu „${query.trim()}“.` : 'Diese Spur ist leer.'}</p>
            )}
          </div>
        )}
      </section>
      {lane === 'lauf' && !searching ? debug : null}
    </>
  )
}
