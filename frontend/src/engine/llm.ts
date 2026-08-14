import { Wllama } from '@wllama/wllama/esm/index.js'
import wasmUrl from '@wllama/wllama/esm/wasm/wllama.wasm?url'
import { DEFAULT_MODEL } from './store'

export type DownloadProgress = { loaded: number; total: number; pct: number }

let instance: Wllama | null = null
let loaded = false
let loading: Promise<void> | null = null
let progress: DownloadProgress = { loaded: 0, total: 0, pct: 0 }
let lastError: string | null = null

export function isModelReady(): boolean {
  return loaded
}

export function getDownloadProgress(): DownloadProgress {
  return progress
}

export function getLlmError(): string | null {
  return lastError
}

export async function ensureModel(
  onProgress?: (p: DownloadProgress) => void,
): Promise<void> {
  if (loaded && instance) return
  if (loading) return loading
  loading = (async () => {
    lastError = null
    const wllama = new Wllama(
      { default: wasmUrl },
      { allowOffline: true },
    )
    await wllama.loadModelFromHF(
      { repo: DEFAULT_MODEL.repo, file: DEFAULT_MODEL.file },
      {
        n_ctx: 2048,
        n_threads: 1,
        n_gpu_layers: 0,
        progressCallback: ({ loaded: l, total: t }) => {
          const total = t || 1
          progress = {
            loaded: l,
            total,
            pct: Math.min(100, Math.round((l / total) * 100)),
          }
          onProgress?.(progress)
        },
      },
    )
    instance = wllama
    loaded = true
  })()
  try {
    await loading
  } catch (err) {
    loaded = false
    instance = null
    lastError = err instanceof Error ? err.message : String(err)
    throw err
  } finally {
    loading = null
  }
}

export async function completeChat(
  messages: Array<{ role: string; content: string }>,
  onToken?: (piece: string, full: string) => void,
): Promise<string> {
  if (!instance || !loaded) {
    throw new Error('Modell nicht geladen. Erst Download starten.')
  }
  const mapped = messages.map((m) => ({
    role: (m.role === 'assistant' ? 'assistant' : m.role === 'system' ? 'system' : 'user') as
      | 'system'
      | 'user'
      | 'assistant',
    content: m.content,
  }))
  const stream = await instance.createChatCompletion({
    messages: mapped,
    stream: true,
    max_tokens: 180,
    temperature: 0.72,
    top_p: 0.88,
  })
  let acc = ''
  for await (const chunk of stream) {
    const piece = chunk.choices?.[0]?.delta?.content || ''
    if (!piece) continue
    acc += piece
    onToken?.(piece, acc)
  }
  return acc.trim()
}
