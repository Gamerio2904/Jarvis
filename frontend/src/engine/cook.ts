import { completeGeminiVision, geminiReady } from './gemini.ts'
import { readLastEyeImage } from './agent-session.ts'
import {
  parseCookConfirm,
  parseCookIntent,
  parseSpiceIntent,
  type CookIntent,
} from './cook-parse.ts'
import { forgetSpicePin, readSpicePin, writeSpicePin } from './cook-memory.ts'
import { looksLikeSpice, pickSpices } from './spice-alias.ts'
import { extractRecipesFromHtml, formatCookReply, type CookRecipe } from './recipe-ld.ts'
import { searchWikibooksCookbook } from './wikibooks.ts'
import { getText } from './http-json.ts'
import { jsonUA } from './ua.ts'
import { addShopping, clearPending, getPending, loadSettings, setPending } from './store.ts'
import { fillResearchLinks } from './web-search.ts'
import { isCommNo, isCommYes } from './places-parse.ts'
import type { ResearchMeta } from './research-parse.ts'
import type { ToolMeta } from './tools.ts'

export { parseCookIntent, parseSpiceIntent } from './cook-parse.ts'

const VISION =
  'Nur sichtbare Lebensmittel und Gewürze. Nichts erfinden. Antwort ausschließlich als JSON: {"items":[{"name":"Eier","sure":true}]}. sure=false wenn unsicher (Glas ohne Etikett, verdeckt). Deutsch, kurze Namen.'

type VisionItem = { name: string; sure: boolean }

function tool(action: string, label: string): ToolMeta {
  return { tool_status: 'executed', tool: 'cook', action, label }
}

function researchOf(recipe: CookRecipe): ResearchMeta {
  return {
    query: recipe.title,
    status: 'ok',
    sources: [
      {
        title: recipe.title,
        url: recipe.url,
        snippet: recipe.credit,
        provider: 'cook',
        retrieved_at: new Date().toISOString(),
      },
    ],
  }
}

function parseVisionJson(raw: string): VisionItem[] {
  const m = /\{[\s\S]*\}/.exec(raw || '')
  if (!m) return []
  try {
    const json = JSON.parse(m[0]) as { items?: unknown }
    const items = Array.isArray(json.items) ? json.items : []
    const out: VisionItem[] = []
    for (const row of items) {
      if (!row || typeof row !== 'object') continue
      const name = String((row as { name?: string }).name || '').trim()
      if (name.length < 2 || name.length > 40) continue
      out.push({ name, sure: Boolean((row as { sure?: boolean }).sure) })
    }
    return out
  } catch {
    return []
  }
}

async function readVisionList(): Promise<{ sure: string[]; unsure: string[]; error?: string }> {
  const src = readLastEyeImage()
  if (!src) return { sure: [], unsure: [], error: 'Foto-Knopf unten. Ohne Bild rate ich keinen Vorrat.' }
  if (!geminiReady()) {
    return { sure: [], unsure: [], error: 'Dafür Gemini an. Das Bild geht dann zu Google — nicht lokal.' }
  }
  const m = /^data:(image\/[a-zA-Z0+.-]+);base64,(.+)$/.exec(src)
  if (!m) return { sure: [], unsure: [], error: 'Kein Bild erkannt. JPEG oder PNG wählen.' }
  try {
    const text = await completeGeminiVision(VISION, m[2], m[1])
    const items = parseVisionJson(text)
    return {
      sure: items.filter((i) => i.sure).map((i) => i.name),
      unsure: items.filter((i) => !i.sure).map((i) => i.name),
    }
  } catch (err) {
    return {
      sure: [],
      unsure: [],
      error: err instanceof Error ? err.message : 'Foto nicht gelesen. Netz oder Gemini prüfen.',
    }
  }
}

function extraMissing(recipe: CookRecipe, photo: string[], spices: string[]): string[] {
  const have = [...photo, ...spices]
  return recipe.ingredients.filter((ing) => {
    const low = ing.toLowerCase()
    if (have.some((h) => low.includes(h.toLowerCase()) || h.toLowerCase().includes(low))) return false
    if (looksLikeSpice(ing) && spices.some((s) => low.includes(s.toLowerCase()))) return false
    return true
  })
}

async function fetchJsonLdRecipe(url: string): Promise<CookRecipe | null> {
  if (!/^https?:\/\//i.test(url)) return null
  try {
    const { status, text } = await getText(url, { Accept: 'text/html', 'User-Agent': jsonUA })
    if (status < 200 || status >= 300 || !text) return null
    return extractRecipesFromHtml(text, url)[0] || null
  } catch {
    return null
  }
}

export function themealdbKeyOk(key: string): boolean {
  const k = key.trim()
  return Boolean(k) && k !== '1'
}

async function fetchMealDb(ingredients: string[]): Promise<CookRecipe | null> {
  const key = loadSettings().themealdb_api_key.trim()
  if (!themealdbKeyOk(key)) return null
  const q = encodeURIComponent(ingredients[0] || '')
  if (!q) return null
  try {
    const filter = `https://www.themealdb.com/api/json/v1/${encodeURIComponent(key)}/filter.php?i=${q}`
    const { status, text } = await getText(filter, { Accept: 'application/json' })
    if (status < 200 || status >= 300 || !text) return null
    const json = JSON.parse(text) as { meals?: Array<{ idMeal?: string; strMeal?: string }> }
    const id = String(json.meals?.[0]?.idMeal || '')
    if (!id) return null
    const look = `https://www.themealdb.com/api/json/v1/${encodeURIComponent(key)}/lookup.php?i=${encodeURIComponent(id)}`
    const rec = await getText(look, { Accept: 'application/json' })
    if (rec.status < 200 || rec.status >= 300 || !rec.text) return null
    const body = JSON.parse(rec.text) as { meals?: Array<Record<string, string | null>> }
    const meal = body.meals?.[0]
    if (!meal) return null
    const ingredients: string[] = []
    for (let i = 1; i <= 20; i += 1) {
      const name = String(meal[`strIngredient${i}`] || '').trim()
      const measure = String(meal[`strMeasure${i}`] || '').trim()
      if (!name) continue
      ingredients.push(measure ? `${measure} ${name}` : name)
    }
    const steps = String(meal.strInstructions || '')
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean)
    const src = String(meal.strSource || '').trim()
    const page = src || `https://www.themealdb.com/meal/${id}`
    return {
      title: String(meal.strMeal || 'Rezept'),
      url: page,
      credit: `TheMealDB${src ? ` · ${src}` : ''}`,
      prepMin: null,
      cookMin: null,
      totalMin: null,
      ovenC: null,
      yieldText: '',
      ingredients,
      steps,
    }
  } catch {
    return null
  }
}

export async function findCookRecipe(ingredients: string[]): Promise<CookRecipe | null> {
  const wiki = await searchWikibooksCookbook(ingredients)
  if (wiki) return wiki
  const q = `Rezept ${ingredients.slice(0, 4).join(' ')}`
  const meta = await fillResearchLinks(q, '')
  for (const s of (meta.sources || []).slice(0, 3)) {
    if (!s.url) continue
    const ld = await fetchJsonLdRecipe(s.url)
    if (ld?.steps.length) return ld
  }
  return fetchMealDb(ingredients)
}

async function composeRecipe(
  conversationId: string,
  photo: string[],
): Promise<{ reply: string; research?: ResearchMeta; tool: ToolMeta }> {
  const pin = await readSpicePin()
  const recipe = await findCookRecipe(photo)
  if (!recipe || !recipe.steps.length) {
    return {
      reply: 'Kein belegtetes Rezept zu diesen Zutaten. Ich rate keines aus dem Kopf.',
      tool: tool('empty', 'Kein Rezept'),
    }
  }
  const spiceNames = recipe.ingredients.filter((i) => looksLikeSpice(i))
  const picked = pickSpices(pin, spiceNames)
  const extra = extraMissing(recipe, photo, picked.used)
  const spiceNote = picked.onlySaltPepper
    ? 'Gewürzregal nur Salz und Pfeffer — genau die.'
    : picked.used.length
      ? `Gewürze aus dem Regal: ${picked.used.join(', ')}.`
      : pin.length
        ? 'Kein Gewürz aus dem Pin passt; ich erfinde keines.'
        : ''
  const reply = formatCookReply(recipe, {
    fromPhoto: photo,
    spiceUsed: picked.used,
    spiceNote,
    extra,
  })
  if (extra.length) {
    await setPending({
      conversation_id: conversationId,
      tool: 'cook',
      action: 'shop',
      args: { missing: extra },
      preview: extra.join(', '),
      created_at: new Date().toISOString(),
    })
    return {
      reply: `${reply}\n\n${extra[0]} fehlt. Auf die Einkaufsliste?`,
      research: researchOf(recipe),
      tool: tool('recipe', 'Koch'),
    }
  }
  await clearPending(conversationId)
  return { reply, research: researchOf(recipe), tool: tool('recipe', 'Koch') }
}

function confirmLine(sure: string[], unsure: string[]): string {
  const seen = sure.length ? `Ich sehe: ${sure.join(', ')}.` : 'Nichts Sicheres auf dem Bild.'
  const extra = unsure.length ? ` Unsicher: ${unsure.join(', ')} — weggelassen.` : ''
  return `${seen}${extra} Stimmt das?`
}

export async function handleCook(
  conversationId: string,
  text: string,
): Promise<{
  handled: boolean
  reply?: string
  tool?: ToolMeta
  lastTool?: string
  research?: ResearchMeta
}> {
  const pending = await getPending(conversationId)
  if (pending?.tool === 'cook' && pending.action === 'shop') {
    if (isCommNo(text)) {
      await clearPending(conversationId)
      return { handled: true, reply: 'Einkauf unverändert.', tool: tool('shop', 'Koch'), lastTool: 'cook' }
    }
    if (isCommYes(text)) {
      const missing = Array.isArray(pending.args.missing) ? pending.args.missing.map(String) : []
      for (const item of missing.slice(0, 8)) await addShopping(item, conversationId)
      await clearPending(conversationId)
      return {
        handled: true,
        reply: missing.length ? `Auf der Liste: ${missing.slice(0, 8).join(', ')}.` : 'Einkauf unverändert.',
        tool: tool('shop', 'Koch'),
        lastTool: 'cook',
      }
    }
  }
  if (pending?.tool === 'cook' && pending.action === 'confirm') {
    const follow = parseCookConfirm(text)
    let items = Array.isArray(pending.args.items) ? pending.args.items.map(String) : []
    const unsure = Array.isArray(pending.args.unsure) ? pending.args.unsure.map(String) : []
    if (follow?.kind === 'confirm_no') {
      await clearPending(conversationId)
      return { handled: true, reply: 'Kein Rezept.', tool: tool('cancel', 'Koch'), lastTool: 'cook' }
    }
    if (follow?.kind === 'confirm_drop') {
      items = items.filter((i) => !i.toLowerCase().includes(follow.name.toLowerCase()))
      await setPending({
        ...pending,
        args: { items, unsure },
        preview: items.join(', '),
        created_at: new Date().toISOString(),
      })
      return { handled: true, reply: confirmLine(items, unsure), tool: tool('confirm', 'Koch'), lastTool: 'cook' }
    }
    if (follow?.kind === 'confirm_add') {
      if (!items.some((i) => i.toLowerCase() === follow.name.toLowerCase())) items.push(follow.name)
      await setPending({
        ...pending,
        args: { items, unsure },
        preview: items.join(', '),
        created_at: new Date().toISOString(),
      })
      return { handled: true, reply: confirmLine(items, unsure), tool: tool('confirm', 'Koch'), lastTool: 'cook' }
    }
    if (follow?.kind === 'confirm_yes') {
      if (!items.length) {
        await clearPending(conversationId)
        return { handled: true, reply: 'Ohne bestätigte Zutat kein Rezept.', tool: tool('empty', 'Koch'), lastTool: 'cook' }
      }
      const out = await composeRecipe(conversationId, items)
      return { handled: true, ...out, lastTool: 'cook' }
    }
  }

  const intent: CookIntent | null = parseCookIntent(text)
  if (!intent) return { handled: false }

  if (intent.kind === 'spice_recall') {
    const pin = await readSpicePin()
    return {
      handled: true,
      reply: pin.length ? `Liegt: ${pin.join(', ')}.` : 'Keine Gewürze gespeichert.',
      tool: tool('recall', 'Gewürze'),
      lastTool: 'cook',
    }
  }
  if (intent.kind === 'spice_forget') {
    const gone = await forgetSpicePin()
    return {
      handled: true,
      reply: gone ? 'Gewürze sind weg.' : 'Keine Gewürze gespeichert.',
      tool: tool('forget', 'Gewürze'),
      lastTool: 'cook',
    }
  }
  if (intent.kind === 'spice_store') {
    let names = intent.names
    let origin: 'user' | 'tool' = 'user'
    if (!names.length) {
      const vis = await readVisionList()
      if (vis.error && !readLastEyeImage()) {
        return { handled: true, reply: 'Foto-Knopf oder die Namen sagen.', tool: tool('ask', 'Gewürze'), lastTool: 'cook' }
      }
      if (vis.error) return { handled: true, reply: vis.error, tool: tool('ask', 'Gewürze'), lastTool: 'cook' }
      names = vis.sure
      origin = 'tool'
      if (!names.length) {
        return {
          handled: true,
          reply: vis.unsure.length
            ? `Unsicher: ${vis.unsure.join(', ')} — nicht gespeichert.`
            : 'Nichts Sicheres auf dem Bild.',
          tool: tool('empty', 'Gewürze'),
          lastTool: 'cook',
        }
      }
    }
    const pin = await writeSpicePin(names, { merge: intent.merge, conversationId, origin })
    return {
      handled: true,
      reply: `Liegt: ${pin.join(', ')}.`,
      tool: tool('store', 'Gewürze'),
      lastTool: 'cook',
    }
  }

  const vis = await readVisionList()
  if (vis.error) return { handled: true, reply: vis.error, tool: tool('ask', 'Koch'), lastTool: 'cook' }
  if (!vis.sure.length) {
    return {
      handled: true,
      reply: vis.unsure.length
        ? `Unsicher: ${vis.unsure.join(', ')} — nicht verwendet. Foto-Knopf nochmal, klarer.`
        : 'Nichts Sicheres auf dem Bild. Foto-Knopf unten.',
      tool: tool('empty', 'Koch'),
      lastTool: 'cook',
    }
  }
  await setPending({
    conversation_id: conversationId,
    tool: 'cook',
    action: 'confirm',
    args: { items: vis.sure, unsure: vis.unsure },
    preview: vis.sure.join(', '),
    created_at: new Date().toISOString(),
  })
  return {
    handled: true,
    reply: confirmLine(vis.sure, vis.unsure),
    tool: tool('confirm', 'Koch'),
    lastTool: 'cook',
  }
}
