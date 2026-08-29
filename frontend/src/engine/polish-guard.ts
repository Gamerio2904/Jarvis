const PLACE_BODY =
  'berlin|london|paris|hamburg|münchen|muenchen|stuttgart|rom|wien|madrid|tokio|tokyo|moskau|peking|new york|washington|kairo|sydney|istanbul|dublin|prag|warschau|athen|oslo|stockholm|helsinki|amsterdam|brüssel|bruessel|kiew|dubai|seoul|bangkok|singapur|chicago|toronto|nairobi|lagos|kapstadt|ingersheim|heilbronn|köln|koeln|frankfurt'

function placesIn(text: string): string[] {
  const re = new RegExp(`\\b(${PLACE_BODY})\\b`, 'gi')
  return [...text.matchAll(re)].map((m) => m[0].toLowerCase())
}

export function guardPolish(facts: string, polished: string): string {
  const draft = (polished || '').trim()
  const pack = (facts || '').trim()
  if (!draft) return pack
  if (!pack) return draft
  const factNums = new Set((pack.match(/\d+(?:[.,]\d+)?/g) || []).map((n) => n.replace(',', '.')))
  const outNums = draft.match(/\d+(?:[.,]\d+)?/g) || []
  for (const n of outNums) {
    if (!factNums.has(n.replace(',', '.'))) return pack
  }
  const factPlaces = new Set(placesIn(pack))
  const outPlaces = placesIn(draft)
  for (const p of outPlaces) {
    if (factPlaces.size && !factPlaces.has(p)) return pack
  }
  if (draft.length > 420) return pack
  return draft
}
