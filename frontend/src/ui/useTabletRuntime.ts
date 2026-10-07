import { useEffect } from 'react'
import { watchHausIncoming } from '../native/haus.ts'
import { speakText } from '../native/voice.ts'
import { loadSettings } from '../engine/store.ts'
import { STAND_UPDATED_LINE } from '../engine/tablet-mode.ts'
import { acceptIncomingStand, isPaired, refreshTabletServer, syncWithTablet } from '../engine/tablet-sync.ts'

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
      if (busy || Date.now() - last < SYNC_GAP_MS || !isPaired() || loadSettings().tablet_mode) return
      busy = true
      last = Date.now()
      try {
        const out = await syncWithTablet()
        if (out.kind === 'pulled') {
          h.note(out.line)
          window.setTimeout(h.reload, 900)
        } else if (out.line && out.kind !== 'skip') {
          h.note(out.line)
        }
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
    return () => {
      window.clearInterval(iv)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', force)
      window.removeEventListener('jarvis-sync-now', force)
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
    const stop = watchHausIncoming((json) => {
      if (!loadSettings().tablet_mode) return
      void acceptIncomingStand(json).then((res) => {
        if (res === 'applied') {
          h.note(STAND_UPDATED_LINE)
          void sayThenReload(STAND_UPDATED_LINE, h.reload)
        }
      })
    })
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('jarvis-stand-changed', onChange)
      stop()
    }
  }, [h])
}
