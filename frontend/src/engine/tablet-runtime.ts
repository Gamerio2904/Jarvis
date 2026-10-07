import { loadSettings, saveSettings } from './store.ts'
import { setLageSession } from './lage-session.ts'
import { hausServerStop } from '../native/haus.ts'
import { setKeepScreenOn, startWakeWord, stopWakeWord } from '../native/voice.ts'
import { startTabletServer } from './tablet-sync.ts'

export type TabletStatus = { running: boolean; url: string; line: string }

async function tryFullscreen(): Promise<void> {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen()
  } catch {
    /* ohne Geste nicht erlaubt; die Lage füllt die Fläche trotzdem */
  }
}

/** Tabletmodus: Lage im Vollbild, Wake-Wort „Ultron“, Bildschirm an, Server auf. */
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
  const made = await startTabletServer(false)
  if (!made.ok) return { running: false, url: '', line: made.message || 'Server startet nicht.' }
  return { running: true, url: made.url || '', line: `Hausstand-Server läuft: ${made.url}` }
}

export async function leaveTabletMode(): Promise<void> {
  saveSettings({ tablet_mode: false })
  await hausServerStop()
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
