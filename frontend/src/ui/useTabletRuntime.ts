import { useEffect } from 'react'
import { acknowledgeHausIncoming, watchHausIncoming } from '../native/haus.ts'
import { speakText } from '../native/voice.ts'
import { loadSettings } from '../engine/store.ts'
import { STAND_UPDATED_LINE } from '../engine/tablet-mode.ts'
import { acceptIncomingStand, refreshTabletServer, rememberConflict, syncWithTablet } from '../engine/tablet-sync.ts'

type Hooks = {
  note: (line: string) => void
  /** Daten wurden ersetzt; die Oberfläche lädt neu. */
  reload: () => void
}

const SYNC_GAP_MS = 45_000

async function sayThenReload(line: string, reload: () => void) {
  await Promise.race([speakText(line).catch(() => {}), new Promise((r) => window.setTimeout(r, 6000))])
  reload()
}

/** Handy: beim Öffnen/Zurückkehren Server suchen. Tablet: Stand bereithalten und Neues annehmen. */
export function useTabletRuntime(h: Hooks) {
  useEffect(() => {
    let last = 0
    let busy = false
    const run = async () => {
      if (busy || Date.now() - last < SYNC_GAP_MS || loadSettings().tablet_mode) return
      busy = true
      last = Date.now()
      try {
        const out = await syncWithTablet()
        rememberConflict(out.kind === 'conflict' ? out.ticket : undefined)
        if (out.kind === 'pulled') {
          h.note(out.line)
          window.setTimeout(h.reload, 900)
        } else if (out.line && out.kind !== 'skip') {
          h.note(
            out.kind === 'conflict'
              ? `${out.line} Sagen Sie „Übernimm den Tablet-Stand“ oder „Übernimm den Handy-Stand“.`
              : out.line,
          )
        }
      } catch (error) {
        h.note(error instanceof Error ? `Sync fehlgeschlagen: ${error.message}` : 'Sync fehlgeschlagen.')
      } finally {
        busy = false
      }
    }
    const force = () => {
      last = 0
      void run()
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') void run()
    }
    void run()
    const iv = window.setInterval(() => {
      if (document.visibilityState === 'visible') void run()
    }, 5 * 60_000)
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', force)
    window.addEventListener('jarvis-sync-now', force)
    const onPulled = () => window.setTimeout(h.reload, 900)
    window.addEventListener('jarvis-sync-pulled', onPulled)
    return () => {
      window.clearInterval(iv)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', force)
      window.removeEventListener('jarvis-sync-now', force)
      window.removeEventListener('jarvis-sync-pulled', onPulled)
    }
  }, [h])

  useEffect(() => {
    let timer = 0
    const onChange = () => {
      if (!loadSettings().tablet_mode) return
      window.clearTimeout(timer)
      timer = window.setTimeout(() => void refreshTabletServer(), 3000)
    }
    window.addEventListener('jarvis-stand-changed', onChange)
    const stop = watchHausIncoming((json, requestId) => {
      if (!loadSettings().tablet_mode) {
        void acknowledgeHausIncoming(requestId, 'failed')
        return
      }
      void acceptIncomingStand(json).then(async (res) => {
        const syncRevision = res.syncRevision ? JSON.stringify(res.syncRevision) : undefined
        const acknowledged = await acknowledgeHausIncoming(requestId, res.status, syncRevision)
        if (!acknowledged) h.note('Hausstand-Abgleich konnte dem anderen Gerät nicht bestätigt werden.')
        if (res.status === 'applied') {
          h.note(STAND_UPDATED_LINE)
          void sayThenReload(STAND_UPDATED_LINE, h.reload)
        } else if (res.status === 'conflict') {
          h.note('Hausstand-Konflikt. Beide Stände bleiben erhalten; bitte den gewünschten Stand ausdrücklich auswählen.')
        } else if (res.status === 'failed') {
          h.note('Hausstand-Abgleich fehlgeschlagen. Der aktive Stand blieb unverändert.')
        }
      }).catch(async () => {
        const acknowledged = await acknowledgeHausIncoming(requestId, 'failed')
        h.note(acknowledged
          ? 'Hausstand-Abgleich fehlgeschlagen. Der aktive Stand blieb unverändert.'
          : 'Hausstand-Abgleich und Rückmeldung an das andere Gerät sind fehlgeschlagen.')
      })
    })
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('jarvis-stand-changed', onChange)
      stop()
    }
  }, [h])
}
