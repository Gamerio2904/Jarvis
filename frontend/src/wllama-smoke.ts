import { Wllama } from '@wllama/wllama/esm/index.js'
import wasmUrl from '@wllama/wllama/esm/wasm/wllama.wasm?url'
import compatWasmUrl from '@wllama/wllama-compat/wasm/wllama.wasm?url'
import compatWorkerCode from '@wllama/wllama-compat/wasm/wllama.js?raw'
import { formatQwenChat, QWEN_STOP } from './engine/prompt'

const out = document.getElementById('out')!

function log(line: string) {
  out.textContent = `${out.textContent}\n${line}`
}

function abs(path: string): string {
  return new URL(path, document.baseURI).href
}

const TINY_URL =
  'https://huggingface.co/ggml-org/models/resolve/main/tinyllamas/stories260K.gguf'

async function main() {
  log(`wasm ${abs(wasmUrl)}`)
  const res = await fetch(TINY_URL)
  if (!res.ok) throw new Error(`tiny gguf HTTP ${res.status}`)
  const blob = await res.blob()
  log(`gguf bytes ${blob.size}`)
  if (blob.size < 50_000) throw new Error('tiny gguf too small')

  const wllama = new Wllama({ default: abs(wasmUrl) })
  wllama.setCompat({
    wasm: abs(compatWasmUrl),
    worker: { code: compatWorkerCode },
  })
  await wllama.loadModel([blob], { n_ctx: 256, n_threads: 1, n_gpu_layers: 0 })
  log('model loaded')

  const prompt = formatQwenChat([
    { role: 'system', content: 'Reply with one short German word.' },
    { role: 'user', content: 'Sag nur: Hallo' },
  ])
  const result = await wllama.createCompletion({
    prompt,
    stream: false,
    max_tokens: 24,
    temperature: 0.2,
    stop: QWEN_STOP,
  })
  const text = (result.choices?.[0]?.text || '').trim()
  log(`reply: ${text || '(empty)'}`)
  if (!text) throw new Error('empty completion')
  log('PASS')
}

main().catch((err) => {
  log(`FAIL ${err instanceof Error ? err.message : String(err)}`)
})
