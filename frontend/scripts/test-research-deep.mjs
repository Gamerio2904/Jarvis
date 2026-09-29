// @ts-nocheck
import assert from 'node:assert/strict'
import 'fake-indexeddb/auto'

const mem = Object.create(null)
globalThis.localStorage = {
  getItem: (k) => (k in mem ? mem[k] : null),
  setItem: (k, v) => {
    mem[k] = String(v)
  },
  removeItem: (k) => {
    delete mem[k]
  },
  clear: () => {
    for (const k of Object.keys(mem)) delete mem[k]
  },
}

const {
  isDeepResearch,
  isOpenSourceAsk,
  deepResearchQueries,
  deepRoleQueries,
  isLiveLookup,
} = await import('../src/engine/research-parse.ts')
const { githubToken, searchGithubRepos } = await import('../src/engine/github-search.ts')
const { saveSettings } = await import('../src/engine/store.ts')

assert.equal(isDeepResearch('Recherchiere tief: Anzugs-Energiequelle ehrlich, ohne Marvel-Magie'), true)
assert.equal(isDeepResearch('Recherchiere tief: Open-Source Kalender ICS Parser'), true)
assert.equal(isDeepResearch('recherchier Benzinpreis'), false)
assert.equal(isLiveLookup('recherchier Benzinpreis'), true)
assert.equal(isOpenSourceAsk('suche Open Source zu ICS'), true)

const roles = deepRoleQueries('Recherchiere tief: Anzugs-Energiequelle ehrlich')
assert.ok(roles.length >= 3, `Rollen ${roles.length}`)
assert.ok(roles.some((r) => r.role === 'core'))
assert.ok(roles.some((r) => r.role === 'constraint'))
assert.ok(roles.some((r) => r.role === 'wiki'))
const qs = deepResearchQueries('Recherchiere tief: Open-Source Kalender ICS Parser')
assert.ok(qs.some((q) => /github/i.test(q)))
assert.ok(qs.length <= 5)
assert.ok(qs.length >= 3)

assert.equal(githubToken(), '')
const gh = await searchGithubRepos('ics calendar parser')
assert.equal(gh.sources.length, 0)
assert.match(gh.note, /unvollständig|ohne GitHub/i)

saveSettings({ github_token: '' })
const again = await searchGithubRepos('tictactoe')
assert.equal(again.sources.length, 0)

console.log('ok test-research-deep')
