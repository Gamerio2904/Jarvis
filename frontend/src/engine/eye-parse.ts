const EYE = /^\s*(?:lies\s+das\s+foto|was\s+steht\s+auf\s+dem\s+zettel|schau\s+das\s+bild|auge|foto\s+lesen)\s*[.?!]?\s*$/i
const SHOW =
  /\bzeig(?:e)?(?:\s+(?:mal\s+)?)?(?:das\s+)?bild(?:\s+an)?(?:\s+(?:im|in\s+dem|um)\s+chat)?\b/i

export function parseEyeIntent(text: string): boolean {
  const t = text.trim()
  return EYE.test(t) || SHOW.test(t)
}

export function isShowEyeImage(text: string): boolean {
  return SHOW.test(text.trim())
}
