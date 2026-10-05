const BRIEF =
  /^\s*(guten\s+morgen|tageslage|was\s+steht\s+an|was\s+liegt\s+an|was\s+kommt\s+heute(?:\s+dran)?|was\s+ist\s+heute(?:\s+los)?)\s*[.?!]?\s*$/i

export function isBriefAsk(text: string): boolean {
  return BRIEF.test(text.trim())
}
