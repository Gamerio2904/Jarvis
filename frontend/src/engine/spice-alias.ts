/** Kleine DE/EN-Tabelle. Kein FlavorDB, keine OFF-Vollladung. */

const CANON: Record<string, string> = {
  salz: 'Salz',
  salt: 'Salz',
  seasalt: 'Salz',
  meersalz: 'Salz',
  pfeffer: 'Pfeffer',
  pepper: 'Pfeffer',
  blackpepper: 'Pfeffer',
  schwarzepfeffer: 'Pfeffer',
  paprika: 'Paprika',
  sweetpaprika: 'Paprika',
  edelsuess: 'Paprika',
  chili: 'Chili',
  chilli: 'Chili',
  cayenne: 'Chili',
  oregan: 'Oregano',
  oregano: 'Oregano',
  thymian: 'Thymian',
  thyme: 'Thymian',
  basilikum: 'Basilikum',
  basil: 'Basilikum',
  rosmarin: 'Rosmarin',
  rosemary: 'Rosmarin',
  kuemmel: 'Kümmel',
  kummel: 'Kümmel',
  caraway: 'Kümmel',
  kreuzkuemmel: 'Kreuzkümmel',
  kreuzkummel: 'Kreuzkümmel',
  cumin: 'Kreuzkümmel',
  zimt: 'Zimt',
  cinnamon: 'Zimt',
  muskat: 'Muskat',
  nutmeg: 'Muskat',
  nelke: 'Nelken',
  nelken: 'Nelken',
  clove: 'Nelken',
  cloves: 'Nelken',
  lorbeer: 'Lorbeer',
  bayleaf: 'Lorbeer',
  curry: 'Curry',
  kurkuma: 'Kurkuma',
  turmeric: 'Kurkuma',
  ingwer: 'Ingwer',
  ginger: 'Ingwer',
  knoblauchpulver: 'Knoblauchpulver',
  garlicpowder: 'Knoblauchpulver',
  zwiebelpulver: 'Zwiebelpulver',
  onionpowder: 'Zwiebelpulver',
  petersilie: 'Petersilie',
  parsley: 'Petersilie',
  schnittlauch: 'Schnittlauch',
  chives: 'Schnittlauch',
  dill: 'Dill',
  majoran: 'Majoran',
  marjoram: 'Majoran',
  salbei: 'Salbei',
  sage: 'Salbei',
  vanille: 'Vanille',
  vanilla: 'Vanille',
  anis: 'Anis',
  koriander: 'Koriander',
  coriander: 'Koriander',
  cilantro: 'Koriander',
}

export function spiceKey(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '')
}

export function canonSpice(raw: string): string | null {
  const t = raw.replace(/[.!?,;:]+$/g, '').trim()
  if (t.length < 2 || t.length > 40) return null
  const hit = CANON[spiceKey(t)]
  if (hit) return hit
  if (/gewürz|spice|kraut/i.test(t) && t.split(/\s+/).length > 3) return null
  if (/^[A-ZÄÖÜ]/.test(t) || t.length <= 18) return t.replace(/\s+/g, ' ')
  return null
}

export function splitSpiceNames(raw: string): string[] {
  const parts = raw
    .split(/[,;/]| und | sowie | \+ /i)
    .map((p) => p.replace(/^(?:auch|noch|dazu)\s+/i, '').trim())
    .filter(Boolean)
  const out: string[] = []
  const seen = new Set<string>()
  for (const p of parts) {
    const c = canonSpice(p)
    if (!c) continue
    const k = spiceKey(c)
    if (seen.has(k)) continue
    seen.add(k)
    out.push(c)
  }
  return out
}

export function sameSpice(a: string, b: string): boolean {
  const ca = canonSpice(a)
  const cb = canonSpice(b)
  if (!ca || !cb) return spiceKey(a) === spiceKey(b) && spiceKey(a).length > 2
  return spiceKey(ca) === spiceKey(cb)
}

export function pickSpices(
  pin: string[],
  recipeNames: string[],
): { used: string[]; missing: string[]; onlySaltPepper: boolean } {
  const used: string[] = []
  const missing: string[] = []
  for (const rec of recipeNames) {
    const hit = pin.find((p) => sameSpice(p, rec))
    if (hit) {
      if (!used.some((u) => sameSpice(u, hit))) used.push(hit)
    } else if (looksLikeSpice(rec)) {
      missing.push(rec)
    }
  }
  const onlySaltPepper =
    pin.length > 0 && pin.every((p) => sameSpice(p, 'Salz') || sameSpice(p, 'Pfeffer'))
  return { used, missing, onlySaltPepper }
}

export function looksLikeSpice(raw: string): boolean {
  const k = spiceKey(raw)
  if (CANON[k]) return true
  return /\b(salz|pfeffer|paprika|chili|oregano|thymian|basilikum|rosmarin|kümmel|kuemmel|zimt|muskat|curry|kurkuma|ingwer|nelke|lorbeer|koriander|dill|salbei|vanille)\b/i.test(
    raw,
  )
}
