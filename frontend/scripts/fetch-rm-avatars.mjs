#!/usr/bin/env node
/** Holt API-Avatare einmal und legt 160×160-JPEGs lokal ab. */
import { existsSync, mkdirSync, writeFileSync, statSync, readdirSync, rmdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import snap from '../src/data/rm-snapshot.json' with { type: 'json' }

const here = dirname(fileURLToPath(import.meta.url))
const outDir = join(here, '../public/rm-avatars')
const rawDir = join(outDir, '.raw')
const SIDE = 160
const QUALITY = 80

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchBuf(url) {
  let wait = 900
  for (let i = 0; i < 10; i++) {
    const res = await fetch(url)
    if (res.ok) return Buffer.from(await res.arrayBuffer())
    if (res.status !== 429 && res.status < 500) throw new Error(`${res.status} ${url}`)
    await sleep(wait + Math.floor(Math.random() * 400))
    wait = Math.min(12_000, Math.round(wait * 1.6))
  }
  throw new Error(`retry exhausted ${url}`)
}

mkdirSync(outDir, { recursive: true })
mkdirSync(rawDir, { recursive: true })
const ids = snap.characters.map((c) => c.id).sort((a, b) => a - b)
const pending = ids.filter((id) => !existsSync(join(outDir, `${id}.jpeg`)) && !existsSync(join(rawDir, `${id}.jpeg`)))
console.log(`avatars todo ${pending.length}/${ids.length}`)

let cursor = 0
async function worker() {
  while (cursor < pending.length) {
    const id = pending[cursor]
    cursor += 1
    const buf = await fetchBuf(`https://rickandmortyapi.com/api/character/avatar/${id}.jpeg`)
    writeFileSync(join(rawDir, `${id}.jpeg`), buf)
    if (cursor % 40 === 0 || cursor === pending.length) console.log(`fetch ${cursor}/${pending.length}`)
    await sleep(80)
  }
}
const workers = Math.min(3, Math.max(1, pending.length))
await Promise.all(Array.from({ length: workers }, () => worker()))

const raws = readdirSync(rawDir).filter((n) => n.endsWith('.jpeg'))
if (raws.length) {
  const py = spawnSync(
    'python3',
    [
      '-c',
      `
from pathlib import Path
from PIL import Image
raw = Path(${JSON.stringify(rawDir)})
out = Path(${JSON.stringify(outDir)})
for p in sorted(raw.glob('*.jpeg'), key=lambda x: int(x.stem)):
    im = Image.open(p).convert('RGB').resize((${SIDE}, ${SIDE}), Image.Resampling.LANCZOS)
    im.save(out / p.name, 'JPEG', quality=${QUALITY}, optimize=True)
    p.unlink()
`,
    ],
    { encoding: 'utf8' },
  )
  if (py.status !== 0) {
    console.error(py.stderr)
    throw new Error('pillow resize failed')
  }
}
try {
  rmdirSync(rawDir)
} catch {
  /* leftover raw */
}
const missing = ids.filter((id) => !existsSync(join(outDir, `${id}.jpeg`)))
if (missing.length) throw new Error(`fehlende Avatare: ${missing.slice(0, 8).join(', ')}`)
let bytes = 0
for (const id of ids) bytes += statSync(join(outDir, `${id}.jpeg`)).size
console.log(`wrote ${ids.length} avatars (${(bytes / 1024 / 1024).toFixed(1)} MB) → ${outDir}`)
