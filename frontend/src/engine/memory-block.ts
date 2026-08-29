export function memoryBlock(items: Array<{ key: string; value: string }>, question = ''): string {
  const name = items.find((m) => m.key === 'name')?.value?.trim()
  const nameRule = name
    ? `Der Nutzer heißt ${name}. Verwenden Sie nur diesen Namen. Erfinden Sie keinen anderen Vornamen.`
    : 'Der Nutzer hat keinen Namen hinterlegt. Erfinden Sie keinen Vornamen.'
  if (!items.length) {
    return `Langzeitgedächtnis (lokal und Cloud gleich):\n${nameRule}`
  }
  const q = question.toLowerCase()
  const tokens = q.split(/[^a-zäöüß0-9]+/i).filter((w) => w.length > 3)
  const ranked = items.map((m) => {
    const blob = `${m.key} ${m.value}`.toLowerCase()
    const hit = tokens.some((w) => blob.includes(w)) || (q && blob.includes(q.slice(0, 24)))
    return { m, hit }
  })
  const picked = (q ? ranked.filter((x) => x.hit) : ranked).slice(0, q ? 6 : 8)
  const use = picked.length ? picked : []
  if (!use.length) {
    return `Langzeitgedächtnis (lokal und Cloud gleich):\n${nameRule}\nKeine weiteren Einträge passen zur aktuellen Frage. Nichts erfinden.`
  }
  const lines = use.map((x) => `- ${x.m.key}: ${x.m.value}`).join('\n')
  return `Langzeitgedächtnis (lokal und Cloud gleich):\n${lines}\n${nameRule}\nNutzen Sie nur Fakten aus dieser Liste. Widerspruch („kein … mehr“) heißt: der Wert ist weg — nicht wieder einstreuen. Keinen Extra-Befehl abwarten. Nichts erfinden, das nicht in der Liste steht. Ton bleibt Jarvis: ruhig, Understatement.`
}
