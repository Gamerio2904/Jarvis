const EYE = /^\s*(?:lies\s+das\s+foto|was\s+steht\s+auf\s+dem\s+zettel|schau\s+das\s+bild|auge|foto\s+lesen)\s*[.?!]?\s*$/i

export function parseEyeIntent(text: string): boolean {
  return EYE.test(text.trim())
}
