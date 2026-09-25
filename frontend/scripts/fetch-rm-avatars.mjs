#!/usr/bin/env node
/** Lädt alle Snapshot-Avatare nach public/rm-avatars. Bei 429 warten. */
import { mkdirSync, writeFileSync, existsSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'

const here = dirname(fileURLToPath(import.meta.url))
const snap = JSON.parse(readFileSync(join(here, '../src/data/rm-snapshot.json'), 'utf8'))
const outDir = join(here, '../public/rm-avatars')
mkdirSync(outDir, { recursive: true })

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function fetchOne(id) {
  const dest = join(outDir, `${id}.jpeg`)
  if (existsSync(dest) && statSync(dest).size > 32) return 'ok'
  const url = `https://rickandmortyapi.com/api/character/avatar/${id}.jpeg`
  let wait = 600
  for (let i = 0; i < 8; i++) {
    const res = await fetch(url, { headers: { Accept: 'image/jpeg' } })
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer())
      if (buf.length < 32) throw new Error(`empty ${id}`)
      writeFileSync(dest, buf)
      return 'ok'
    }
    if (res.status !== 429 && res.status < 500) throw new Error(`${res.status} ${id}`)
    await sleep(wait)
    wait = Math.min(8000, wait * 2)
  }
  throw new Error(`retry ${id}`)
}

const ids = snap.characters.map((c) => c.id)
let ok = 0
const conc = 4
for (let i = 0; i < ids.length; i += conc) {
  const chunk = ids.slice(i, i + conc)
  const rows = await Promise.all(
    chunk.map(async (id) => {
      try {
        await fetchOne(id)
        ok += 1
        return null
      } catch (err) {
        return String(err?.message || err)
      }
    }),
  )
  const fail = rows.filter(Boolean)
  if (fail.length) {
    console.error(fail.join('\n'))
    process.exit(1)
  }
  if (i && i % 40 === 0) await sleep(200)
}
console.log(`fetch-rm-avatars ok — ${ok}/${ids.length}`)
