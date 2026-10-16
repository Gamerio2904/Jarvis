/** Leere Projektdatei im internen App-Speicher, nicht in Downloads. */

export async function writeInternalProjectFile(id: string, json: string): Promise<string> {
  const safe = id.replace(/[^a-z0-9_-]+/gi, '').slice(0, 80) || 'projekt'
  const path = `projekte/${safe}.json`
  try {
    if (typeof navigator !== 'undefined' && navigator.storage?.getDirectory) {
      const root = await navigator.storage.getDirectory()
      const dir = await root.getDirectoryHandle('projekte', { create: true })
      const handle = await dir.getFileHandle(`${safe}.json`, { create: true })
      const writable = await handle.createWritable()
      await writable.write(json)
      await writable.close()
      return path
    }
  } catch {
    /* Browser ohne OPFS */
  }
  try {
    const { Capacitor } = await import('@capacitor/core')
    if (Capacitor.isNativePlatform()) {
      const { Directory, Filesystem } = await import('@capacitor/filesystem')
      await Filesystem.writeFile({ path, data: json, directory: Directory.Data, recursive: true })
    }
  } catch {
    /* Tests und Desktop ohne natives Dateisystem */
  }
  return path
}
