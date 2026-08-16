const ORD: Record<string, number> = {
  erste: 0,
  erstes: 0,
  '1.': 0,
  zweite: 1,
  zweites: 1,
  '2.': 1,
  dritte: 2,
  drittes: 2,
  '3.': 2,
  vierte: 3,
  '4.': 3,
}

export function parseOrdinalFollowUp(text: string): { index: number; del: boolean } | null {
  const m =
    /^\s*(?:lösch(?:e)?\s+)?das\s+(erste|erstes|zweite|zweites|dritte|drittes|vierte|1\.|2\.|3\.|4\.)\s*$/i.exec(
      text.trim(),
    )
  if (!m) return null
  const index = ORD[m[1].toLowerCase()]
  if (index === undefined) return null
  return { index, del: /^lösch/i.test(text.trim()) }
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
