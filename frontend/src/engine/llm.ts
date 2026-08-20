import { Wllama } from '@wllama/wllama/esm/index.js'
import wasmUrl from '@wllama/wllama/esm/wasm/wllama.wasm?url'
import compatWasmUrl from '@wllama/wllama-compat/wasm/wllama.wasm?url'
import compatWorkerCode from '@wllama/wllama-compat/wasm/wllama.js?raw'
import { DEFAULT_MODEL } from './store'
import { hasCachedModel, isNativeApp, loadPersistedModel, persistModel, requestPersistentStorage, downloadNativeModel } from './model-cache'
import { formatQwenChat, QWEN_STOP, toChatRole } from './prompt'
import { inferThreadCount } from './threads'

export type DownloadProgress = {
  loaded: number
  total: number
  pct: number
  phase: 'download' | 'load'
}

export { hasCachedModel }

const MIN_MODEL_BYTES = 480_000_000
const MODEL_URLS = [
  `https://huggingface.co/${DEFAULT_MODEL.repo}/resolve/main/${DEFAULT_MODEL.file}?download=true`,
  `https://huggingface.co/${DEFAULT_MODEL.repo}/resolve/main/${DEFAULT_MODEL.file}`,
]
const INFER_TIMEOUT_MS = 75_000
const LOAD_TIMEOUT_MS = 180_000
const MAX_GEN_TOKENS = 96
const SAMPLE_TEMP = 0.7
const SAMPLE_TOP_P = 0.88

let instance: Wllama | null = null
let loaded = false
let loading: Promise<void> | null = null
let progress: DownloadProgress = { loaded: 0, total: 0, pct: 0, phase: 'download' }
let lastError: string | null = null
let threadCount = 2

export { inferThreadCount }

export function getThreadCount(): number {
  return threadCount
}

export function isModelReady(): boolean {
  return loaded
}

export function getDownloadProgress(): DownloadProgress {
  return progress
}

export function getLlmError(): string | null {
  return lastError
}

function assetUrl(path: string): string {
  return new URL(path, document.baseURI).href
}

function reportProgress(
  loadedBytes: number,
  totalBytes: number,
  phase: DownloadProgress['phase'],
  onProgress?: (p: DownloadProgress) => void,
) {
  const total = totalBytes > 0 ? totalBytes : Math.max(loadedBytes, 1)
  progress = {
    loaded: loadedBytes,
    total,
    pct: Math.min(100, Math.round((loadedBytes / total) * 100)),
    phase,
  }
  onProgress?.(progress)
}

function explainError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err)
  const lower = msg.toLowerCase()
  if (lower.includes('timeout') || lower.includes('zu lange')) {
    return 'Antwort dauert zu lange. Andere Apps schließen und erneut senden.'
  }
  if (lower.includes('model file not found') || lower.includes('failed to open file')) {
    return 'Modelldatei nicht im Gerätespeicher. Bitte erneut herunterladen (WLAN).'
  }
  if (
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('netzwerk') ||
    lower.includes('load failed')
  ) {
    return 'Download fehlgeschlagen. WLAN prüfen und erneut versuchen.'
  }
  if (lower.includes('http 404')) {
    return 'Modelldatei auf Hugging Face nicht gefunden. App-Update prüfen.'
  }
  if (lower.includes('http 401') || lower.includes('http 403')) {
    return 'Hugging Face hat den Download abgelehnt. Später erneut versuchen.'
  }
  if (lower.includes('unexpected end of stream') || lower.includes('abgebrochen')) {
    return 'Download abgebrochen. WLAN prüfen und erneut versuchen.'
  }
  if (lower.includes('zu klein') || lower.includes('unvollständig') || lower.includes('gespeichert')) {
    return msg
  }
  return msg
}

async function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms)
  })
  try {
    return await Promise.race([promise, timeout])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

function downloadViaXhr(url: string, onProgress?: (p: DownloadProgress) => void): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', url)
    xhr.responseType = 'blob'
    xhr.onprogress = (event) => {
      if (event.lengthComputable) {
        reportProgress(event.loaded, event.total, 'download', onProgress)
      }
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300 && xhr.response instanceof Blob) {
        resolve(xhr.response)
        return
      }
      reject(new Error(`HTTP ${xhr.status}`))
    }
    xhr.onerror = () => reject(new Error('Netzwerkfehler beim Modell-Download'))
    xhr.onabort = () => reject(new Error('Download abgebrochen'))
    xhr.send()
  })
}

async function downloadViaFetch(url: string, onProgress?: (p: DownloadProgress) => void): Promise<Blob> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }
  const total = Number(res.headers.get('content-length') || '0')
  if (!res.body) {
    const blob = await res.blob()
    reportProgress(blob.size, blob.size || total, 'download', onProgress)
    return blob
  }
  const reader = res.body.getReader()
  const chunks: BlobPart[] = []
  let loadedBytes = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    if (!value) continue
    chunks.push(value.slice())
    loadedBytes += value.byteLength
    reportProgress(loadedBytes, total, 'download', onProgress)
  }
  const blob = new Blob(chunks, { type: 'application/octet-stream' })
  reportProgress(blob.size, blob.size, 'download', onProgress)
  return blob
}

async function downloadModelBlob(onProgress?: (p: DownloadProgress) => void): Promise<Blob> {
  let last: unknown = null
  for (const url of MODEL_URLS) {
    try {
      let blob: Blob
      try {
        blob = await downloadViaXhr(url, onProgress)
      } catch {
        blob = await downloadViaFetch(url, onProgress)
      }
      if (blob.size < MIN_MODEL_BYTES) {
        throw new Error('Download unvollständig (Datei zu klein). WLAN prüfen und erneut versuchen.')
      }
      reportProgress(blob.size, blob.size, 'download', onProgress)
      return blob
    } catch (err) {
      last = err
    }
  }
  throw last instanceof Error ? last : new Error('Modell-Download fehlgeschlagen')
}

async function createRuntime(): Promise<Wllama> {
  const wllama = new Wllama({ default: assetUrl(wasmUrl) })
  wllama.setCompat({
    wasm: assetUrl(compatWasmUrl),
    worker: { code: compatWorkerCode },
  })
  return wllama
}

export async function ensureModel(
  onProgress?: (p: DownloadProgress) => void,
): Promise<void> {
  if (loaded && instance) return
  if (loading) return loading
  loading = (async () => {
    lastError = null
    await requestPersistentStorage()
    let blob = await loadPersistedModel()
    if (blob) {
      reportProgress(blob.size, blob.size, 'load', onProgress)
    } else if (isNativeApp()) {
      blob = await downloadNativeModel((loadedBytes, totalBytes) => {
        reportProgress(loadedBytes, totalBytes, 'download', onProgress)
      })
      reportProgress(blob.size, blob.size, 'load', onProgress)
    } else {
      blob = await downloadModelBlob(onProgress)
      reportProgress(blob.size, blob.size, 'load', onProgress)
      await persistModel(blob)
    }
    const wllama = await createRuntime()
    threadCount = inferThreadCount()
    await withTimeout(
      wllama.loadModel([blob], {
        n_ctx: 1024,
        n_threads: threadCount,
        n_gpu_layers: 0,
      }),
      LOAD_TIMEOUT_MS,
      'Modellstart dauert zu lange. App neu öffnen.',
    )
    instance = wllama
    loaded = true
    reportProgress(blob.size, blob.size, 'load', onProgress)
  })()
  try {
    await loading
  } catch (err) {
    loaded = false
    instance = null
    lastError = explainError(err)
    throw new Error(lastError)
  } finally {
    loading = null
  }
}

function samplingOptions() {
  return {
    max_tokens: MAX_GEN_TOKENS,
    temperature: SAMPLE_TEMP,
    top_p: SAMPLE_TOP_P,
    stop: QWEN_STOP,
  }
}

function cleanCompletion(text: string): string {
  return text.replace(/<\|im_end\|>/g, '').trim()
}

async function completeNonStream(prompt: string): Promise<string> {
  if (!instance) throw new Error('Modell nicht geladen. Erst Download starten.')
  const res = await withTimeout(
    instance.createCompletion({
      prompt,
      stream: false,
      ...samplingOptions(),
    }),
    INFER_TIMEOUT_MS,
    'timeout',
  )
  return cleanCompletion(res.choices?.[0]?.text || '')
}

async function completeStream(
  prompt: string,
  onToken?: (piece: string, full: string) => void,
): Promise<string> {
  if (!instance) throw new Error('Modell nicht geladen. Erst Download starten.')
  const ac = new AbortController()
  const stream = await instance.createCompletion({
    prompt,
    stream: true,
    abortSignal: ac.signal,
    ...samplingOptions(),
  })
  let full = ''
  const consume = (async () => {
    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.text || ''
      if (!delta) continue
      full += delta
      const cleaned = cleanCompletion(full)
      onToken?.(delta.replace(/<\|im_end\|>/g, ''), cleaned)
    }
  })()
  try {
    await withTimeout(consume, INFER_TIMEOUT_MS, 'timeout')
  } catch (err) {
    ac.abort()
    throw err
  }
  return cleanCompletion(full)
}

export async function completeChat(
  messages: Array<{ role: string; content: string }>,
  onToken?: (piece: string, full: string) => void,
): Promise<string> {
  if (!instance || !loaded) {
    throw new Error('Modell nicht geladen. Erst Download starten.')
  }
  const mapped = messages.map((m) => ({
    role: toChatRole(m.role),
    content: m.content,
  }))
  const prompt = formatQwenChat(mapped)
  try {
    const text = await completeStream(prompt, onToken)
    if (!text) {
      throw new Error('Keine Antwort vom Modell. Erneut senden.')
    }
    return text
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg === 'timeout' || /zu lange/i.test(msg)) {
      throw err
    }
    const text = await completeNonStream(prompt)
    if (!text) {
      throw new Error('Keine Antwort vom Modell. Erneut senden.')
    }
    onToken?.(text, text)
    return text
  }
}
