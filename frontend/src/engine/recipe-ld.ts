export type CookRecipe = {
  title: string
  url: string
  credit: string
  prepMin: number | null
  cookMin: number | null
  totalMin: number | null
  ovenC: number | null
  yieldText: string
  ingredients: string[]
  steps: string[]
}

const ISO = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)(?:\.\d+)?S)?)?$/i

export function parseIso8601Duration(raw: string): number | null {
  const t = String(raw || '').trim()
  if (!t) return null
  const m = ISO.exec(t)
  if (!m) {
    const loose = /^(\d+)\s*(?:min|minute)/i.exec(t)
    return loose ? Number(loose[1]) : null
  }
  const days = Number(m[1] || 0)
  const hours = Number(m[2] || 0)
  const mins = Number(m[3] || 0)
  const secs = Number(m[4] || 0)
  const total = days * 24 * 60 + hours * 60 + mins + (secs ? 1 : 0)
  return total > 0 ? total : null
}

export function formatMinutes(min: number | null): string {
  if (min == null || min <= 0) return ''
  if (min < 60) return `${min} Min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h} Std ${m} Min` : `${h} Std`
}

export function ovenCelsiusFromText(text: string): number | null {
  const m = /(\d{2,3})\s*°\s*C/i.exec(text || '')
  if (!m) return null
  const n = Number(m[1])
  if (n < 80 || n > 300) return null
  return n
}

function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : v == null ? [] : [v]
}

function textOf(v: unknown): string {
  if (typeof v === 'string') return v.trim()
  if (!v || typeof v !== 'object') return ''
  const o = v as Record<string, unknown>
  return String(o.text || o.name || o['@value'] || '').trim()
}

function stepsFrom(raw: unknown): string[] {
  const out: string[] = []
  for (const row of asArray(raw)) {
    if (typeof row === 'string') {
      const t = row.trim()
      if (t) out.push(t)
      continue
    }
    if (!row || typeof row !== 'object') continue
    const o = row as Record<string, unknown>
    const t = textOf(o)
    if (t) out.push(t)
    for (const inner of asArray(o.itemListElement)) {
      const s = textOf(inner)
      if (s) out.push(s)
    }
  }
  return out
}

function ingredientsFrom(raw: unknown): string[] {
  return asArray(raw)
    .map((x) => textOf(x))
    .filter((s) => s.length >= 2)
}

export function recipeFromJsonLd(node: unknown, pageUrl: string): CookRecipe | null {
  if (!node || typeof node !== 'object') return null
  const o = node as Record<string, unknown>
  const types = asArray(o['@type']).map((x) => String(x).toLowerCase())
  if (!types.includes('recipe')) return null
  const title = textOf(o.name) || textOf(o.headline)
  const ingredients = ingredientsFrom(o.recipeIngredient || o.ingredients)
  const steps = stepsFrom(o.recipeInstructions)
  if (!title || (!ingredients.length && !steps.length)) return null
  const blob = `${title}\n${ingredients.join('\n')}\n${steps.join('\n')}`
  return {
    title,
    url: pageUrl,
    credit: pageUrl,
    prepMin: parseIso8601Duration(String(o.prepTime || '')),
    cookMin: parseIso8601Duration(String(o.cookTime || '')),
    totalMin: parseIso8601Duration(String(o.totalTime || '')),
    ovenC: ovenCelsiusFromText(blob),
    yieldText: textOf(o.recipeYield || o.yield),
    ingredients,
    steps,
  }
}

function walkGraph(node: unknown, acc: unknown[]): void {
  if (!node) return
  if (Array.isArray(node)) {
    for (const n of node) walkGraph(n, acc)
    return
  }
  if (typeof node !== 'object') return
  acc.push(node)
  const o = node as Record<string, unknown>
  if (o['@graph']) walkGraph(o['@graph'], acc)
}

export function extractRecipesFromHtml(html: string, pageUrl: string): CookRecipe[] {
  const out: CookRecipe[] = []
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    try {
      const json = JSON.parse(m[1]) as unknown
      const nodes: unknown[] = []
      walkGraph(json, nodes)
      for (const n of nodes) {
        const rec = recipeFromJsonLd(n, pageUrl)
        if (rec) out.push(rec)
      }
    } catch {
      /* kaputtes Markup */
    }
  }
  return out
}

export function formatCookReply(
  recipe: CookRecipe,
  opts: {
    fromPhoto: string[]
    spiceUsed: string[]
    spiceNote?: string
    extra: string[]
  },
): string {
  const lines: string[] = [recipe.title]
  const prep = formatMinutes(recipe.prepMin)
  const cook = formatMinutes(recipe.cookMin)
  const total =
    formatMinutes(recipe.totalMin) ||
    (recipe.prepMin != null && recipe.cookMin != null
      ? `${formatMinutes(recipe.prepMin + recipe.cookMin)} (prep+Garzeit der Quelle)`
      : '')
  if (prep) lines.push(`Zubereitung: ${prep} (prepTime)`)
  if (cook) lines.push(`Garzeit: ${cook} (cookTime)`)
  if (total) {
    const oven = recipe.ovenC ? ` inkl. Backofen ${recipe.ovenC} °C` : ''
    lines.push(`Gesamtzeit: ${total}${oven}`)
  }
  if (!prep && !cook && !total) lines.push('Quelle nennt keine Zeit.')
  if (recipe.yieldText) lines.push(`Portion: ${recipe.yieldText}`)
  if (opts.spiceNote) lines.push(opts.spiceNote)
  lines.push('')
  lines.push('Zutaten')
  const shown = new Set<string>()
  for (const item of recipe.ingredients) {
    const photo = opts.fromPhoto.some((p) => item.toLowerCase().includes(p.toLowerCase()) || p.toLowerCase().includes(item.toLowerCase()))
    const spice = opts.spiceUsed.some((s) => item.toLowerCase().includes(s.toLowerCase()))
    const tag = photo ? 'Bild' : spice ? 'Gewürzregal' : ''
    lines.push(tag ? `• ${item} — ${tag}` : `• ${item}`)
    shown.add(item.toLowerCase())
  }
  if (opts.extra.length) {
    lines.push('')
    lines.push(`Nicht im Vorrat, Quelle nennt: ${opts.extra.join(', ')}`)
  }
  if (recipe.steps.length) {
    lines.push('')
    lines.push('Zubereitung')
    recipe.steps.forEach((s, i) => lines.push(`${i + 1}. ${s}`))
  }
  if (recipe.credit) {
    lines.push('')
    lines.push(recipe.credit)
  }
  return lines.filter((l, i, a) => l !== '' || a[i - 1] !== '').join('\n')
}
