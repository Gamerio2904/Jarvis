const BRIEF = /^\s*(guten\s+morgen|tageslage|was\s+steht\s+an|was\s+liegt\s+an)\s*[.?!]?\s*$/i

export function isBriefAsk(text: string): boolean {
  return BRIEF.test(text.trim())
}
