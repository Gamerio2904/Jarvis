/** Stumme Rahmen auf der Tafel. Ein Tipp wählt, ein Baustein tut nichts. */

import { useEffect, useState } from 'react'
import { draftFramesOpen } from '../engine/entwurf-parse.ts'
import { pickDraft } from '../engine/entwurf.ts'
import type { Block, Draft } from '../engine/entwurf-muster.ts'
import { prefersReducedMotion } from '../engine/motion.ts'
import { get, loadSettings } from '../engine/store.ts'

function blockCount(row: Draft): number {
  return row.variants.reduce((n, v) => n + v.blocks.length, 0)
}

function shown(row: Draft, variant: number, block: number, step: number): boolean {
  let n = 0
  for (let v = 0; v < row.variants.length; v += 1) {
    for (let b = 0; b < row.variants[v].blocks.length; b += 1) {
      if (v === variant && b === block) return n < step
      n += 1
    }
  }
  return false
}

function BlockView({ block, kind }: { block: Block; kind: Draft['kind'] }) {
  const muster = block.muster ?? 0
  const zeile = block.zeile.trim() || 'Noch leer.'
  if (block.art === 'liste') {
    const n = kind === 'muster' ? 3 + muster : 1
    return (
      <ul className="entwurf-liste" data-muster={muster}>
        {Array.from({ length: n }, (_, i) => (
          <li key={i}>{zeile}</li>
        ))}
      </ul>
    )
  }
  if (block.art === 'karte') {
    return (
      <div className="entwurf-karte" data-muster={muster}>
        <p>{zeile}</p>
      </div>
    )
  }
  if (block.art === 'knopf') {
    return (
      <span className="entwurf-knopf" data-muster={muster}>
        {zeile}
      </span>
    )
  }
  if (block.art === 'feld') {
    return (
      <div className="entwurf-feld" data-muster={muster}>
        <span>{zeile}</span>
      </div>
    )
  }
  if (block.art === 'tab') {
    const words = zeile.split(/\s+/).filter(Boolean)
    return (
      <div className={`entwurf-tab${muster === 2 ? ' is-wide' : ''}`} data-muster={muster}>
        {words.map((word, i) => (
          <span key={`${word}-${i}`}>{word}</span>
        ))}
      </div>
    )
  }
  return (
    <div className="entwurf-leiste" data-muster={muster}>
      <span>{zeile}</span>
      {kind === 'muster' && muster === 2 ? <small>Mehr</small> : null}
    </div>
  )
}

export function EntwurfStage() {
  const [row, setRow] = useState<Draft | null>(null)
  const [track, setTrack] = useState({ id: '', step: 0 })

  useEffect(() => {
    let stop = false
    let ticket = 0
    const load = async () => {
      const mine = ++ticket
      if (!draftFramesOpen()) {
        if (!stop && mine === ticket) setRow(null)
        return
      }
      const id = loadSettings().entwurf_id
      const next = id ? await get<Draft>('drafts', id) : undefined
      if (stop || mine !== ticket) return
      if (!next || next.status === 'zu' || loadSettings().entwurf_id !== id) {
        setRow(null)
        return
      }
      setRow(next)
    }
    void load()
    const on = () => void load()
    window.addEventListener('jarvis-settings', on)
    return () => {
      stop = true
      ticket += 1
      window.removeEventListener('jarvis-settings', on)
    }
  }, [])

  if (row && track.id !== row.id) {
    setTrack({ id: row.id, step: prefersReducedMotion() ? 99 : 0 })
  }

  useEffect(() => {
    if (!row || prefersReducedMotion()) return
    const total = blockCount(row)
    let n = 0
    const timer = window.setInterval(() => {
      n += 1
      setTrack((cur) => (cur.id === row.id ? { id: row.id, step: n } : cur))
      if (n >= total) window.clearInterval(timer)
    }, 80)
    return () => window.clearInterval(timer)
  }, [row?.id])

  if (!row) return null
  const quiet = prefersReducedMotion()
  const step = track.id === row.id ? track.step : 0
  const total = blockCount(row)
  const ready = quiet || step >= total
  const picked = row.pick
  const status = row.status === 'gewählt' ? 'gewählt' : 'offen'

  return (
    <div className="entwurf-stage" data-entwurf={row.kind}>
      <header className="entwurf-head">
        <span>Entwurf</span>
        <strong>{row.title}</strong>
        <em>{ready ? status : ''}</em>
      </header>
      <div className="entwurf-row">
        {row.variants.slice(0, 3).map((variant, i) => {
          const on = picked === i
          const dim = picked !== null && !on
          return (
            <button
              key={`${row.id}-${i}`}
              type="button"
              className={`entwurf-frame${on ? ' is-pick' : ''}${dim ? ' is-dim' : ''}`}
              data-motion={variant.motion || row.motion}
              aria-pressed={on}
              aria-label={`Entwurf ${i + 1}. ${variant.name}`}
              onClick={() => void pickDraft(i as 0 | 1 | 2)}
            >
              {row.kind === 'muster' ? <small className="entwurf-name">{variant.name}</small> : null}
              {variant.blocks.slice(0, 6).map((block, b) =>
                shown(row, i, b, step) ? (
                  <div
                    key={`${i}-${b}`}
                    className="entwurf-block"
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <BlockView block={block} kind={row.kind} />
                  </div>
                ) : null,
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
