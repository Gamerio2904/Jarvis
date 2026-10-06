import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { fensterKindLabel, type FensterKind, type FensterSurface } from '../engine/fenster-parse.ts'
import { commitFensterGrant, denyFensterRequest, grantFromConfirm, type FensterRequest } from '../engine/fenster.ts'
import { clearFensterPending, postFenster, startFensterSession } from '../engine/fenster-net.ts'

/**
 * Kleines Blatt über der offenen Fläche. Ein Tipp koppelt, Ablehnen nicht.
 * Kein Dauerfilter, keine Schleife.
 */
export function FensterSheet({
  ownKind,
  onShow,
}: {
  ownKind: FensterKind
  onShow: (surface: FensterSurface) => void
}) {
  const [request, setRequest] = useState<FensterRequest | null>(null)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const onShowRef = useRef(onShow)
  onShowRef.current = onShow

  useEffect(() => {
    let stop: (() => void) | undefined
    const id = window.setTimeout(() => {
      stop = startFensterSession(ownKind, {
        onRequest: (row) => {
          setBusy(false)
          setNote('')
          setRequest(row)
        },
        onShow: (surface) => onShowRef.current(surface),
      })
    }, 400)
    return () => {
      window.clearTimeout(id)
      stop?.()
    }
  }, [ownKind])

  if (!request) return null
  const row = request

  async function confirm() {
    if (busy) return
    setBusy(true)
    const prepared = await grantFromConfirm(row, ownKind)
    if (!prepared) {
      setBusy(false)
      return
    }
    const ok = await postFenster({ host: row.fromHost, port: row.fromPort }, prepared.body)
    if (!ok) {
      setNote('Die Bestätigung kam nicht an.')
      setBusy(false)
      return
    }
    commitFensterGrant(prepared.grant)
    await clearFensterPending()
    setRequest(null)
    setBusy(false)
  }

  function deny() {
    denyFensterRequest()
    void clearFensterPending()
    setRequest(null)
  }

  return createPortal(
    <div className="fenster-sheet">
      <div className="fenster-card" role="dialog" aria-labelledby="fenster-title">
        <p id="fenster-title" className="fenster-title">
          Ultron auf dem {fensterKindLabel(row.fromKind)} möchte koppeln.
        </p>
        {note ? <p className="fenster-note">{note}</p> : null}
        <div className="fenster-actions">
          <button type="button" className="fenster-yes" disabled={busy} onClick={() => void confirm()}>
            Bestätigen
          </button>
          <button type="button" className="fenster-no" disabled={busy} onClick={deny}>
            Ablehnen
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
