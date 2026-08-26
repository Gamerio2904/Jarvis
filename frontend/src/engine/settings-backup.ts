import { Capacitor } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { APP_VERSION, DEFAULT_SETTINGS, loadSettings, replaceSettings, type Settings } from './store.ts'

export const SETTINGS_BACKUP_KIND = 'jarvis-settings-backup'

export type SettingsBackup = {
  kind: typeof SETTINGS_BACKUP_KIND
  app_version: string
  exported_at: string
  settings: Settings
}

const SETTING_KEYS = Object.keys(DEFAULT_SETTINGS) as Array<keyof Settings>

export function pickSettingsPatch(raw: Record<string, unknown>): Partial<Settings> {
  const out: Partial<Settings> = {}
  for (const key of SETTING_KEYS) {
    if (key === 'version') continue
    if (!Object.prototype.hasOwnProperty.call(raw, key)) continue
    const def = DEFAULT_SETTINGS[key]
    const v = raw[key]
    if (typeof def === 'boolean') {
      if (typeof v === 'boolean') (out as Record<string, unknown>)[key] = v
    } else if (typeof def === 'number') {
      if (typeof v === 'number' && Number.isFinite(v)) (out as Record<string, unknown>)[key] = v
    } else if (typeof def === 'string') {
      if (typeof v === 'string') (out as Record<string, unknown>)[key] = v
    }
  }
  return out
}

export function parseSettingsBackup(raw: unknown): { ok: true; patch: Partial<Settings> } | { ok: false; message: string } {
  if (!raw || typeof raw !== 'object') return { ok: false, message: 'Keine JSON-Datei.' }
  const obj = raw as Record<string, unknown>
  if (obj.kind === 'jarvis-chat-debug') {
    return { ok: false, message: 'Das ist ein Chat-Debug, keine Einstellungen.' }
  }
  const source =
    obj.kind === SETTINGS_BACKUP_KIND && obj.settings && typeof obj.settings === 'object'
      ? (obj.settings as Record<string, unknown>)
      : obj
  const patch = pickSettingsPatch(source)
  if (!Object.keys(patch).length) return { ok: false, message: 'Keine Einstellungsfelder in der Datei.' }
  return { ok: true, patch }
}

export function buildSettingsBackup(at = new Date()): SettingsBackup {
  return {
    kind: SETTINGS_BACKUP_KIND,
    app_version: APP_VERSION,
    exported_at: at.toISOString(),
    settings: loadSettings(),
  }
}

export function restoreSettingsBackup(patch: Partial<Settings>): Settings {
  return replaceSettings({ ...DEFAULT_SETTINGS, ...patch })
}

export function settingsBackupFileName(at = new Date()): string {
  const day = at.toISOString().slice(0, 19).replace(/[:T]/g, '-')
  return `jarvis-settings-${day}.json`
}

export async function downloadSettingsBackup(): Promise<{ ok: boolean; name: string; message: string }> {
  const dump = buildSettingsBackup()
  const name = settingsBackupFileName()
  const json = `${JSON.stringify(dump, null, 2)}\n`
  const native = await writeNative(name, json)
  if (native.ok) return { ok: true, name, message: native.message }
  const web = triggerBrowserDownload(name, json)
  if (web) return { ok: true, name, message: 'JSON in Downloads.' }
  return { ok: false, name, message: 'Download blockiert.' }
}

export async function readSettingsBackupText(text: string): Promise<ReturnType<typeof parseSettingsBackup>> {
  try {
    return parseSettingsBackup(JSON.parse(text) as unknown)
  } catch {
    return { ok: false, message: 'Datei ist kein JSON.' }
  }
}

async function writeNative(name: string, json: string): Promise<{ ok: boolean; message: string }> {
  if (!Capacitor.isNativePlatform()) return { ok: false, message: '' }
  try {
    await Filesystem.writeFile({
      path: name,
      data: json,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    })
    return { ok: true, message: `Gespeichert unter Dokumente/${name}` }
  } catch {
    return { ok: false, message: '' }
  }
}

function triggerBrowserDownload(name: string, json: string): boolean {
  try {
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 2000)
    return true
  } catch {
    return false
  }
}
