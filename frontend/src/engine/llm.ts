import { Wllama } from '@wllama/wllama/esm/index.js'
import wasmUrl from '@wllama/wllama/esm/wasm/wllama.wasm?url'
import compatWasmUrl from '@wllama/wllama-compat/wasm/wllama.wasm?url'
import compatWorkerCode from '@wllama/wllama-compat/wasm/wllama.js?raw'
import { FAST_MODEL, activeModel, isGeminiConfigured, saveSettings } from './store'
import { hasCachedModel, isNativeApp, loadPersistedModel, persistModel, requestPersistentStorage, downloadNativeModel, useModelSpec } from './model-cache'
import { formatQwenChat, packChat, QWEN_STOP, toChatRole } from './prompt'

export type DownloadProgress = {
  loaded: number
  total: number
  pct: number
  phase: 'download' | 'load'
}

export { hasCachedModel }

let loadedId: 'fast' | 'sharp' | null = null
const FIRST_TOKEN_MS = 45_000
const INFER_TIMEOUT_MS = 90_000
const LOAD_TIMEOUT_MS = 180_000
const MAX_NEW_TOKENS = 128

let instance: Wllama | null = null
let loaded = false
let loading: Promise<void> | null = null
let progress: DownloadProgress = { loaded: 0, total: 0, pct: 0, phase: 'download' }
let lastError: string | null = null
let threadCount = 2

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
  const spec = activeModel()
  const urls = [
    `https://huggingface.co/${spec.repo}/resolve/main/${spec.file}?download=true`,
    `https://huggingface.co/${spec.repo}/resolve/main/${spec.file}`,
  ]
  let last: unknown = null
  for (const url of urls) {
    try {
      let blob: Blob
      try {
        blob = await downloadViaXhr(url, onProgress)
      } catch {
        blob = await downloadViaFetch(url, onProgress)
      }
      if (blob.size < spec.minBytes) {
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

export async function releaseModel(): Promise<void> {
  const w = instance
  instance = null
  loaded = false
  loadedId = null
  loading = null
  lastError = null
  if (w) {
    try {
      await w.exit()
    } catch {
      /* optional */
    }
  }
}

export async function ensureModel(
  onProgress?: (p: DownloadProgress) => void,
): Promise<void> {
  if (isGeminiConfigured()) {
    throw new Error('Lokales Modell bleibt aus, solange Gemini an ist.')
  }
  const want = activeModel()
  useModelSpec(want)
  if (loaded && instance && loadedId === want.id) return
  if (loaded && loadedId !== want.id) await releaseModel()
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
    const cores = navigator.hardwareConcurrency || 2
    threadCount = Math.max(1, Math.min(4, Math.floor(cores / 2) || 2))
    try {
      await withTimeout(
        wllama.loadModel([blob], {
          n_ctx: want.id === 'sharp' ? 768 : 512,
          n_batch: 128,
          n_threads: threadCount,
          n_gpu_layers: 0,
        }),
        LOAD_TIMEOUT_MS,
        'Modellstart dauert zu lange. App neu öffnen.',
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      const oom = /memory|oom|allocat/i.test(msg)
      if (oom && want.id === 'sharp') {
        saveSettings({ model_variant: 'fast' })
        useModelSpec(FAST_MODEL)
        throw new Error('1.5B passt nicht in den Speicher. Zurück auf 0.5B — unter Modell erneut starten.')
      }
      throw err
    }
    instance = wllama
    loaded = true
    loadedId = want.id
    try {
      await withTimeout(
        wllama.createCompletion({
          prompt:
            '<|im_start|>system\nDu bist Jarvis.<|im_end|>\n<|im_start|>user\nping<|im_end|>\n<|im_start|>assistant\n',
          max_tokens: 1,
          temperature: 0,
          cache_prompt: true,
        } as never),
        20_000,
        'Warmstart übersprungen',
      )
    } catch {
      /* Warmstart ist optional — Modell bleibt geladen. */
    }
    reportProgress(blob.size, blob.size, 'load', onProgress)
  })()
  try {
    await loading
  } catch (err) {
    loaded = false
    loadedId = null
    instance = null
    lastError = explainError(err)
    if (want.id === 'sharp' && /1\.5B passt nicht/.test(lastError)) {
      useModelSpec(FAST_MODEL)
    }
    throw new Error(lastError)
  } finally {
    loading = null
  }
}

function cleanPiece(text: string): string {
  return text.replace(/<\|im_end\|>/g, '').replace(/<\|im_start\|>/g, '')
}

async function completeStreaming(
  prompt: string,
  onToken?: (piece: string, full: string) => void,
): Promise<string> {
  if (!instance) throw new Error('Modell nicht geladen. Erst Download starten.')
  const ac = new AbortController()
  let acc = ''
  let gotToken = false
  const firstTimer = setTimeout(() => {
    if (!gotToken) ac.abort()
  }, FIRST_TOKEN_MS)
  const totalTimer = setTimeout(() => ac.abort(), INFER_TIMEOUT_MS)
  try {
    await instance.createCompletion({
      prompt,
      stream: true,
      onData: (chunk: { choices?: Array<{ text?: string }> }) => {
        const piece = chunk.choices?.[0]?.text || ''
        if (!piece) return
        gotToken = true
        acc += piece
        onToken?.(piece, cleanPiece(acc).trim())
      },
      max_tokens: MAX_NEW_TOKENS,
      temperature: 0.7,
      repeat_penalty: 1.12,
      top_p: 0.85,
      cache_prompt: true,
      stop: QWEN_STOP,
      abortSignal: ac.signal,
    } as never)
  } catch (err) {
    if (cleanPiece(acc).trim()) return cleanPiece(acc).trim()
    if (ac.signal.aborted) {
      throw new Error(
        gotToken
          ? 'timeout'
          : 'Modell denkt zu lange. Andere Apps schließen und erneut senden.',
      )
    }
    throw err
  } finally {
    clearTimeout(firstTimer)
    clearTimeout(totalTimer)
  }
  return cleanPiece(acc).trim()
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
  const prompt = formatQwenChat(packChat(mapped))
  const text = await completeStreaming(prompt, onToken)
  if (!text) {
    return 'Einen Moment. Noch einmal senden?'
  }
  return text
}
