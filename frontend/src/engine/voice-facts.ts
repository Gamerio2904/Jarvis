const FACT_PATTERNS = [
  /\b\d+(?:[.,:/-]\d+)*\b/g,
  /https?:\/\/\S+/gi,
  /[„“"]([^”"]+)[”"]/g,
  /\b(?:unsicher|vermutlich|wahrscheinlich|offen|konflikt|abgebrochen|fehlgeschlagen|nicht bestätigt|quelle(?:n)?|warnung)\b/gi,
  /\b(?:in|aus|nach|von|bei|zwischen|laut|quelle)\s+([A-ZÄÖÜ][\p{L}\p{N}'-]*(?:\s+[A-ZÄÖÜ][\p{L}\p{N}'-]*){0,2})/gu,
]

export function protectedVoiceFacts(text: string): string[] {
  const facts = new Set<string>()
  for (const pattern of FACT_PATTERNS) {
    pattern.lastIndex = 0
    for (const match of text.matchAll(pattern)) {
      const fact = (match[1] || match[0]).trim()
      if (fact) facts.add(fact.toLocaleLowerCase('de-DE'))
    }
  }
  return [...facts]
}

export function preservesVoiceFacts(source: string, candidate: string): boolean {
  const lower = candidate.toLocaleLowerCase('de-DE')
  return protectedVoiceFacts(source).every((fact) => lower.includes(fact))
}
