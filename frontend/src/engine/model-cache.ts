import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { FAST_MODEL, SHARP_MODEL, activeModel } from './store'

type Spec = typeof FAST_MODEL | typeof SHARP_MODEL
let spec: Spec = FAST_MODEL

export function useModelSpec(next: Spec) {
  spec = next
}

function FLAG_KEY() {
  return `jarvis_gguf_ready_${spec.id}`
}

const IDB_NAME = 'jarvis-gguf'
const IDB_STORE = 'blobs'

type ModelRow = {
  id: string
  file: string
  size: number
  blob: Blob
  saved_at: string
}

export async function requestPersistentStorage(): Promise<void> {
  try {
    await navigator.storage?.persist?.()
  } catch {
    /* optional */
  }
}

function openModelDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function writeOpfs(blob: Blob): Promise<boolean> {
  try {
    const root = await navigator.storage.getDirectory()
    const handle = await root.getFileHandle(spec.file, { create: true })
    const writable = await handle.createWritable()
    await writable.write(blob)
    await writable.close()
    return true
  } catch {
    return false
  }
}

async function readOpfs(): Promise<Blob | null> {
  try {
    const root = await navigator.storage.getDirectory()
    const handle = await root.getFileHandle(spec.file)
    const file = await handle.getFile()
    return file.size >= spec.minBytes ? file : null
  } catch {
    return null
  }
}

async function writeIdb(blob: Blob): Promise<boolean> {
  try {
    const db = await openModelDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite')
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.objectStore(IDB_STORE).put({
        id: spec.id,
        file: spec.file,
        size: blob.size,
        blob,
        saved_at: new Date().toISOString(),
      } satisfies ModelRow)
    })
    return true
  } catch {
    return false
  }
}

async function readIdb(): Promise<Blob | null> {
  try {
    const db = await openModelDb()
    const row = await new Promise<ModelRow | undefined>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly')
      const req = tx.objectStore(IDB_STORE).get(spec.id)
      req.onsuccess = () => resolve(req.result as ModelRow | undefined)
      req.onerror = () => reject(req.error)
    })
    if (!row?.blob || row.blob.size < spec.minBytes) return null
    return row.blob
  } catch {
    return null
  }
}

function setReadyFlag(size: number): void {
  try {
    localStorage.setItem(
      FLAG_KEY(),
      JSON.stringify({ file: spec.file, size, at: Date.now() }),
    )
  } catch {
    /* quota */
  }
}

export function readReadyFlag(): { file: string; size: number } | null {
  try {
    const raw = localStorage.getItem(FLAG_KEY())
    if (!raw) return null
    const parsed = JSON.parse(raw) as { file?: string; size?: number }
    if (parsed.file !== spec.file || !parsed.size || parsed.size < spec.minBytes) {
      return null
    }
    return { file: parsed.file, size: parsed.size }
  } catch {
    return null
  }
}

export async function hasCachedModel(): Promise<boolean> {
  useModelSpec(activeModel())
  if (await hasNativeModel()) return true
  if (await readOpfs()) return true
  if (await readIdb()) return true
  return false
}

export async function loadPersistedModel(): Promise<Blob | null> {
  const native = await loadNativeModel()
  if (native) return native
  const opfs = await readOpfs()
  if (opfs) {
    setReadyFlag(opfs.size)
    return opfs
  }
  const idb = await readIdb()
  if (idb) {
    setReadyFlag(idb.size)
    void writeOpfs(idb)
    return idb
  }
  return null
}

export async function persistModel(blob: Blob): Promise<void> {
  if (blob.size < spec.minBytes) {
    throw new Error('Download unvollständig (Datei zu klein). WLAN prüfen und erneut versuchen.')
  }
  await requestPersistentStorage()
  const opfsOk = await writeOpfs(blob)
  if (!opfsOk) {
    const idbOk = await writeIdb(blob)
    if (!idbOk) {
      throw new Error('Modell konnte nicht gespeichert werden. Speicherplatz prüfen.')
    }
  }
  setReadyFlag(blob.size)
}

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform()
}

export async function hasNativeModel(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false
  try {
    const st = await Filesystem.stat({ path: spec.file, directory: Directory.Data })
    return (st.size || 0) >= spec.minBytes
  } catch {
    return false
  }
}

export async function loadNativeModel(): Promise<Blob | null> {
  if (!(await hasNativeModel())) return null
  const { uri } = await Filesystem.getUri({ path: spec.file, directory: Directory.Data })
  const url = Capacitor.convertFileSrc(uri)
  const res = await fetch(url)
  if (!res.ok) return null
  const blob = await res.blob()
  if (blob.size < spec.minBytes) return null
  setReadyFlag(blob.size)
  return blob
}

export async function downloadNativeModel(
  onProgress: (loaded: number, total: number) => void,
): Promise<Blob> {
  const url = `https://huggingface.co/${spec.repo}/resolve/main/${spec.file}?download=true`
  let lastErr: unknown = null
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const listener = await Filesystem.addListener('progress', (ev) => {
        onProgress(ev.bytes, ev.contentLength || ev.bytes)
      })
      try {
        await Filesystem.downloadFile({
          url,
          path: spec.file,
          directory: Directory.Data,
          progress: true,
          recursive: true,
          connectTimeout: 30_000,
          readTimeout: 0,
        })
      } finally {
        await listener.remove()
      }
      const blob = await loadNativeModel()
      if (!blob) {
        throw new Error('Download unvollständig (Datei zu klein). WLAN prüfen und erneut versuchen.')
      }
      return blob
    } catch (err) {
      lastErr = err
      try {
        await Filesystem.deleteFile({ path: spec.file, directory: Directory.Data })
      } catch {
        /* ignore */
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('Modell-Download fehlgeschlagen')
}
