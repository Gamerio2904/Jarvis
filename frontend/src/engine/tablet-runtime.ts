import { loadSettings, saveSettings } from './store.ts'
import { setLageSession } from './lage-session.ts'
import { setKeepScreenOn, startWakeWord, stopWakeWord } from '../native/voice.ts'

export type TabletStatus = { running: boolean; url: string; line: string }

async function tryFullscreen(): Promise<void> {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen()
  } catch {
    /* ohne Geste nicht erlaubt; die Lage füllt die Fläche trotzdem */
  }
}

/** Tabletmodus ist unabhängig vom ausdrücklich gestarteten Hausstand-Server. */
export async function enterTabletMode(): Promise<TabletStatus> {
  const cur = loadSettings().hud_view
  saveSettings({
    tablet_mode: true,
    hud_force: true,
    hud_hidden: false,
    hud_view: cur === 'body' || cur === 'globe' || cur === 'serie' ? cur : 'globe',
    wake_word: true,
  })
  setLageSession(true)
  void setKeepScreenOn(true)
  void tryFullscreen()
  try {
    await startWakeWord()
  } catch {
    /* nur Android */
  }
  return { running: false, url: '', line: 'Tabletmodus an. Der Hausstand-Server ist noch aus.' }
}

export async function leaveTabletMode(): Promise<void> {
  saveSettings({ tablet_mode: false })
  void setKeepScreenOn(false)
  try {
    await stopWakeWord()
    saveSettings({ wake_word: false })
  } catch {
    /* nur Android */
  }
  try {
    if (document.fullscreenElement) await document.exitFullscreen()
  } catch {
    /* schon zu */
  }
}
