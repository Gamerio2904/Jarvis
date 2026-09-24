#!/usr/bin/env node
/** Holt den kanonischen Stand der Rick-and-Morty-API (REST, kein Auth). */
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const out = join(here, '../src/data/rm-snapshot.json')

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchJson(url) {
  let wait = 800
  for (let i = 0; i < 8; i++) {
    const res = await fetch(url)
    if (res.ok) return res.json()
    if (res.status !== 429 && res.status < 500) throw new Error(`${res.status} ${url}`)
    await sleep(wait)
    wait = Math.min(8000, wait * 2)
  }
  throw new Error(`retry exhausted ${url}`)
}

async function fetchAll(kind) {
  const rows = []
  let url = `https://rickandmortyapi.com/api/${kind}`
  while (url) {
    const body = await fetchJson(url)
    rows.push(...body.results)
    url = body.info?.next || ''
    if (url) await sleep(220)
  }
  return rows
}

function episodeId(url) {
  const m = /\/episode\/(\d+)/.exec(url || '')
  return m ? Number(m[1]) : 0
}

const episodes = await fetchAll('episode')
const characters = await fetchAll('character')

const snap = {
  meta: {
    source: 'https://rickandmortyapi.com',
    docs: 'https://rickandmortyapi.com/documentation',
    project: 'https://github.com/afuh/rick-and-morty-api',
    license: 'BSD-3-Clause',
    canon: 'TV-Serie Adult Swim; Netflix-Katalog in DE ist dieselbe Serie',
    coverage: 'S01–S05',
    fetched_at: new Date().toISOString(),
  },
  episodes: episodes.map((e) => ({
    id: e.id,
    code: e.episode,
    name: e.name,
    air: e.air_date,
  })),
  characters: characters.map((c) => ({
    id: c.id,
    name: c.name,
    status: c.status,
    species: c.species,
    type: c.type || '',
    gender: c.gender,
    origin: c.origin?.name || '',
    location: c.location?.name || '',
    eps: (c.episode || []).map(episodeId).filter((n) => n > 0),
  })),
}

writeFileSync(out, `${JSON.stringify(snap)}\n`)
console.log(`wrote ${snap.characters.length} characters, ${snap.episodes.length} episodes → ${out}`)
