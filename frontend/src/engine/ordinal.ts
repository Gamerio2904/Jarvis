const ORD: Record<string, number> = {
  erste: 0,
  erstes: 0,
  ersten: 0,
  '1.': 0,
  '1': 0,
  zweite: 1,
  zweites: 1,
  zweiten: 1,
  '2.': 1,
  '2': 1,
  dritte: 2,
  drittes: 2,
  dritten: 2,
  '3.': 2,
  '3': 2,
  vierte: 3,
  vierten: 3,
  '4.': 3,
  '4': 3,
}

export function parseOrdinalFollowUp(text: string): { index: number; del: boolean } | null {
  const raw = text.trim()
  const m =
    /^\s*(?:lösch(?:e)?\s+)?(?:das|die|der|den)\s+(erste[ns]?|zweite[ns]?|dritte[ns]?|vierte[ns]?|1\.?|2\.?|3\.?|4\.?)(?:\s+(?:davon|da|bitte))?\s*$/i.exec(
      raw,
    )
  const n = /^\s*(?:nummer|nr\.?)\s*([1-4])\s*$/i.exec(raw)
  const token = m?.[1] || n?.[1]
  if (!token) return null
  const index = ORD[token.toLowerCase()]
  if (index === undefined) return null
  return { index, del: /^lösch/i.test(raw) }
}

export function rewriteOrdinal(
  text: string,
  tool: string,
  titles: string[],
): string | null {
  const hit = parseOrdinalFollowUp(text)
  if (!hit) return null
  if (!titles.length) return null
  const title = titles[hit.index]
  if (!title) return null
  if (!hit.del) return null
  if (tool === 'calendar') return `lösche Termin ${title}`
  if (tool === 'todo') return `lösche Todo ${title}`
  if (tool === 'reminder') return `lösche Erinnerung ${title}`
  if (tool === 'shopping') return `${title} hab ich`
  if (tool === 'alarm') return `lösche Wecker ${title}`
  return null
}
