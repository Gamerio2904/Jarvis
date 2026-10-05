export function memoryBlock(items: Array<{ key: string; value: string }>): string {
  const name = items.find((m) => m.key === 'name')?.value?.trim()
  const nameRule = name
    ? `Der Nutzer heißt ${name}. Verwenden Sie nur diesen Namen. Erfinden Sie keinen anderen Vornamen.`
    : 'Der Nutzer hat keinen Namen hinterlegt. Erfinden Sie keinen Vornamen.'
  if (!items.length) {
    return `Langzeitgedächtnis (lokal und Cloud gleich):\n${nameRule}`
  }
  const lines = items
    .slice(0, 16)
    .map((m) => `- ${m.key}: ${m.value}`)
    .join('\n')
  return `Langzeitgedächtnis (lokal und Cloud gleich):\n${lines}\n${nameRule}\nNutzen Sie nur Fakten aus dieser Liste. Widerspruch („kein … mehr“) heißt: der Wert ist weg — nicht wieder einstreuen. Keinen Extra-Befehl abwarten. Nichts erfinden, das nicht in der Liste steht. Ton bleibt Jarvis: ruhig, Understatement.`
}
