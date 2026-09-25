import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import 'fake-indexeddb/auto'
import { PKG_VERSION, versionCodeOf } from './app-version.mjs'

if (!globalThis.localStorage) {
  const mem = new Map()
  globalThis.localStorage = {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => void mem.set(String(k), String(v)),
    removeItem: (k) => mem.delete(k),
    clear: () => mem.clear(),
    key: (i) => [...mem.keys()][i] ?? null,
    get length() {
      return mem.size
    },
  }
}

const { APP_VERSION, DEFAULT_SETTINGS, addShopping, clearPending, listShopping, setPending } = await import(
  '../src/engine/store.ts',
)
const { parseIso8601Duration, formatMinutes, extractRecipesFromHtml, formatCookReply, ovenCelsiusFromText } =
  await import('../src/engine/recipe-ld.ts')
const { canonSpice, pickSpices, splitSpiceNames } = await import('../src/engine/spice-alias.ts')
const { parseCookConfirm, parseCookIntent, parseSpiceIntent } = await import('../src/engine/cook-parse.ts')
const { parseCookbookExtract } = await import('../src/engine/wikibooks.ts')
const { forgetSpicePin, readSpicePin, writeSpicePin } = await import('../src/engine/cook-memory.ts')
const { handleCook, themealdbKeyOk } = await import('../src/engine/cook.ts')
const { parseMemoryFacts, isMemoryWrite } = await import('../src/engine/memory-parse.ts')
const { parseFoodIntent } = await import('../src/engine/food.ts')
const { pickRoute } = await import('../src/engine/route-pick.ts')
const { GOLD_EXPECT } = await import('../src/engine/eval/corpus.ts')
const { TEST_PROMPTS } = await import('../src/engine/test-prompts.ts')
const { allTestCopyTexts, PROBE_COPY_GROUPS } = await import('../src/engine/test-copy.ts')
const { shouldProxyWebHost } = await import('../src/engine/web-proxy.ts')
const { AGENT_SWEEP } = await import('../src/engine/agents/sweep.ts')
const { EXECUTOR_IDS } = await import('../src/engine/agents/executor-ids.ts')
const { PROMPT_SLICES } = await import('../src/engine/agents/prompt-slices.ts')

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const appSrc = readFileSync(join(root, 'src/App.tsx'), 'utf8')
const settingsSrc = readFileSync(join(root, 'src/ui/SettingsScreen.tsx'), 'utf8')

assert.equal(APP_VERSION, '18.11.4')
assert.equal(PKG_VERSION, '18.11.4')
assert.equal(APP_VERSION, PKG_VERSION)
assert.notEqual(APP_VERSION, '18.5.0')
assert.equal(versionCodeOf('18.11.4'), 181104)
assert.ok(versionCodeOf('18.11.4') > versionCodeOf('18.10.0'))
assert.equal(DEFAULT_SETTINGS.themealdb_api_key, '')

assert.equal(parseIso8601Duration('PT15M'), 15)
assert.equal(parseIso8601Duration('PT1H'), 60)
assert.equal(parseIso8601Duration('PT1H15M'), 75)
assert.equal(parseIso8601Duration('PT45M'), 45)
assert.equal(formatMinutes(15), '15 Min')
assert.equal(formatMinutes(60), '1 Std')
assert.equal(ovenCelsiusFromText('Backofen 180 °C'), 180)
assert.equal(ovenCelsiusFromText('ohne Grad'), null)

const html = `<script type="application/ld+json">${JSON.stringify({
  '@type': 'Recipe',
  name: 'Testpasta',
  prepTime: 'PT15M',
  cookTime: 'PT30M',
  totalTime: 'PT45M',
  recipeYield: '2',
  recipeIngredient: ['200 g Nudeln', '2 Eier', 'Salz', 'Pfeffer', 'Parmesan'],
  recipeInstructions: [{ '@type': 'HowToStep', text: 'Nudeln kochen.' }, { '@type': 'HowToStep', text: 'Eier unterheben.' }],
})}</script>`
const ld = extractRecipesFromHtml(html, 'https://example.test/pasta')
assert.equal(ld.length, 1)
assert.equal(ld[0].prepMin, 15)
assert.equal(ld[0].cookMin, 30)
assert.equal(ld[0].totalMin, 45)
assert.equal(ld[0].title, 'Testpasta')
assert.deepEqual(ld[0].steps, ['Nudeln kochen.', 'Eier unterheben.'])

const formatted = formatCookReply(ld[0], {
  fromPhoto: ['Eier', 'Nudeln'],
  spiceUsed: ['Salz', 'Pfeffer'],
  spiceNote: 'Gewürzregal nur Salz und Pfeffer — genau die.',
  extra: ['Parmesan'],
})
assert.match(formatted, /Zubereitung: 15 Min/)
assert.match(formatted, /Gesamtzeit: 45 Min/)
assert.match(formatted, /Parmesan/)
assert.match(formatted, /Gewürzregal nur Salz und Pfeffer/)
assert.doesNotMatch(formatted, /DummyJSON|leckeres Gericht aus/)

assert.equal(canonSpice('black pepper'), 'Pfeffer')
assert.deepEqual(splitSpiceNames('Pfeffer, black pepper, Salz'), ['Pfeffer', 'Salz'])
const picked = pickSpices(['Salz', 'Pfeffer'], ['black pepper', 'Oregano', 'salt'])
assert.deepEqual(picked.used, ['Pfeffer', 'Salz'])
assert.equal(picked.onlySaltPepper, true)

assert.equal(parseCookIntent('Suche im Internet nach Carbonara-Rezept'), null)
assert.equal(parseCookIntent('Suche im Internet nach einem guten Carbonara-Rezept'), null)
assert.equal(parseCookIntent('Zutaten von Nutella'), null)
assert.equal(parseCookIntent('Was bedeutet Waschschüssel 40?'), null)
assert.equal(parseCookIntent('Was kann ich aus dem Foto kochen')?.kind, 'recipe')
assert.equal(parseCookIntent('Was kann ich damit kochen?')?.kind, 'recipe')
assert.equal(parseSpiceIntent('Merke dir meine Gewürze: Salz, Pfeffer, Paprika')?.kind, 'spice_store')
assert.equal(parseSpiceIntent('Merke dir dazu noch Thymian')?.kind, 'spice_store')
assert.equal(parseSpiceIntent('Merke dir dazu noch Thymian')?.merge, true)
assert.equal(parseSpiceIntent('Welche Gewürze habe ich?')?.kind, 'spice_recall')
assert.equal(parseSpiceIntent('Vergiss meine Gewürze')?.kind, 'spice_forget')
assert.equal(parseCookConfirm('Ja')?.kind, 'confirm_yes')
assert.equal(parseCookConfirm('ohne Nudeln')?.kind, 'confirm_drop')
assert.equal(parseCookConfirm('dazu Sahne')?.kind, 'confirm_add')
assert.ok(parseFoodIntent('Zutaten von Nutella'))
assert.equal(isMemoryWrite('Merke dir meine Gewürze'), false)
assert.deepEqual(parseMemoryFacts('Merke dir meine Gewürze'), [])
assert.deepEqual(parseMemoryFacts('Merk dir: FritzBox-Passwort ist Blau12')[0]?.key, 'notiz')

const carbonara = parseCookbookExtract(
  'Kochbuch/ Spaghetti alla carbonara',
  `== Zutaten ==
* 400 g Spaghetti
* 200 g Guanciale
* 4 Eier
* 80 g Pecorino pro Person
* Salz
* Pfeffer

== Zubereitung ==
* Nudeln in Salzwasser garen.
* Speck auslassen.
* Eier mit Käse verrühren.
* Alles mischen.`,
  'https://de.wikibooks.org/wiki/Kochbuch/_Spaghetti_alla_carbonara',
)
assert.ok(carbonara)
assert.ok(carbonara.steps.length >= 3)
assert.equal(carbonara.prepMin, null)
assert.equal(carbonara.cookMin, null)
assert.equal(carbonara.totalMin, null)
assert.equal(carbonara.yieldText, '')
const wikiReply = formatCookReply(carbonara, { fromPhoto: ['Eier', 'Nudeln'], spiceUsed: ['Salz', 'Pfeffer'], extra: ['Pecorino'] })
assert.match(wikiReply, /Quelle nennt keine Zeit/)
assert.doesNotMatch(wikiReply, /\b15 Min\b|\b45 Min\b/)
assert.match(wikiReply, /CC-BY-SA/)

assert.equal(themealdbKeyOk(''), false)
assert.equal(themealdbKeyOk('1'), false)
assert.equal(themealdbKeyOk('abc'), true)

const conv = 'cook-test'
await clearPending(conv)
await setPending({
  conversation_id: conv,
  tool: 'cook',
  action: 'confirm',
  args: { items: ['Eier', 'Nudeln'], unsure: ['Glas rot'] },
  preview: 'Eier, Nudeln',
  created_at: new Date().toISOString(),
})
const drop = await handleCook(conv, 'ohne Nudeln')
assert.equal(drop.handled, true)
assert.match(drop.reply || '', /Eier/)
assert.doesNotMatch(drop.reply || '', /Zubereitung|Carbonara|Rezept/)
const add = await handleCook(conv, 'dazu Sahne')
assert.match(add.reply || '', /Sahne/)
assert.match(add.reply || '', /Stimmt das/)
const no = await handleCook(conv, 'Nein')
assert.match(no.reply || '', /Kein Rezept/)
assert.doesNotMatch(no.reply || '', /Zubereitung/)

await setPending({
  conversation_id: conv,
  tool: 'cook',
  action: 'shop',
  args: { missing: ['Parmesan'] },
  preview: 'Parmesan',
  created_at: new Date().toISOString(),
})
const keepShop = await handleCook(conv, 'Nein')
assert.match(keepShop.reply || '', /unverändert/)
assert.equal((await listShopping()).some((i) => /Parmesan/i.test(i.title)), false)
await setPending({
  conversation_id: conv,
  tool: 'cook',
  action: 'shop',
  args: { missing: ['Parmesan'] },
  preview: 'Parmesan',
  created_at: new Date().toISOString(),
})
const yesShop = await handleCook(conv, 'Ja')
assert.match(yesShop.reply || '', /Parmesan/)
assert.ok((await listShopping()).some((i) => /Parmesan/i.test(i.title)))

const pin1 = await writeSpicePin(['Pfeffer', 'black pepper', 'Salz'], { conversationId: conv, origin: 'user' })
assert.deepEqual(pin1, ['Pfeffer', 'Salz'])
assert.deepEqual(await readSpicePin(), ['Pfeffer', 'Salz'])
const pin2 = await writeSpicePin(['Thymian'], { merge: true, conversationId: conv })
assert.deepEqual(pin2, ['Pfeffer', 'Salz', 'Thymian'])
const pin3 = await writeSpicePin(['Oregano'], { merge: false, conversationId: conv })
assert.deepEqual(pin3, ['Oregano'])
assert.equal(await forgetSpicePin(), true)
assert.deepEqual(await readSpicePin(), [])

assert.equal(pickRoute('Was kann ich aus dem Foto kochen'), 'cook')
assert.equal(pickRoute('Merke dir meine Gewürze'), 'cook')
assert.equal(pickRoute('Welche Gewürze habe ich?'), 'cook')
assert.equal(pickRoute('Zutaten von Nutella'), 'food')
assert.equal(pickRoute('Was bedeutet Waschschüssel 40?'), 'haushalt')
assert.equal(pickRoute('Mach ein Foto'), 'wont')
assert.equal(GOLD_EXPECT['Suche im Internet nach Carbonara-Rezept'], 'research')
assert.equal(GOLD_EXPECT['Was kann ich aus dem Foto kochen'], 'cook')
assert.deepEqual(Object.keys(GOLD_EXPECT).sort(), [...TEST_PROMPTS].sort())
for (const p of TEST_PROMPTS) assert.ok(allTestCopyTexts().includes(p), p)
assert.equal(PROBE_COPY_GROUPS.length, 13)
assert.equal(AGENT_SWEEP.cook, 'Was kann ich aus dem Foto kochen')
assert.ok(EXECUTOR_IDS.includes('cook'))
assert.ok(PROMPT_SLICES.cook?.promptSlice)
assert.equal(shouldProxyWebHost('de.wikibooks.org'), true)
assert.equal(shouldProxyWebHost('www.themealdb.com'), true)
assert.match(appSrc, /<details className="sources-block">/)
assert.doesNotMatch(appSrc, /<details className="sources-block" open/)
assert.match(appSrc, /1 Quelle/)
assert.match(settingsSrc, /TheMealDB/)
assert.doesNotMatch(settingsSrc, /themealdb_api_key: '1'|themealdb_api_key: \"1\"/)

void addShopping
console.log(`test:cook ok — 18.11.4 Koch, Pin, JSON-LD, Wiki ohne erfundene Minuten`)
