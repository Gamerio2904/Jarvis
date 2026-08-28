const TOOLISH =
  /\b(wecker|weck|timer|termin|kalender|erinner|todo|aufgabe|wetterstatistik|wetter|tv|fernseh|lautstärke|sender|note|notiz|suche|schau(en)?\s+nach|was\s+steht|fahr|fahrmodus|spiel|spotify|navigier|route|wohnt|einkauf|liste|los|zuhause|geburtstag|foto|auge|ruf|tel|ventilator|lüfter|tanke|tanken|tankstelle|standort|nachrichten?|steckdose|unwetter|ferien|dollar|euro|kurs|bundesliga|iss|mond|schach|dwd|lage|traceroute|tracert|statistik|sprachnotiz|zusammenfassen|bar|kneipe|pub|taxi|uber|freenow|sprachnachricht|whatsapp|nachricht|sms|schreib|bestell|körper|koerper|kugel|erde|weltkugel|grillen|gesetz|park)\b/i

const MEMORY_WRITE = /^(ich\s+heiße|merk\s+dir|ich\s+bin|ich\s+wohne|ich\s+mag|ich\s+trinke)/i

const SPLIT = /\s+und\s+|\s+dann\s+|\s+danach\s+|\s*,\s+|(?<=[a-zäöüß])\.\s+(?=[A-ZÄÖÜ])/i

/** Tool-Sätze an und/dann/Komma. Memory-Sätze bleiben ganz. */
export function splitIntents(text: string): string[] {
  const raw = text.trim()
  if (!raw || MEMORY_WRITE.test(raw)) return [raw]
  if (!SPLIT.test(raw)) return [raw]
  const parts = raw.split(SPLIT).map((p) => p.trim()).filter(Boolean)
  if (parts.length < 2 || parts.length > 5) return [raw]
  if (parts.every((p) => TOOLISH.test(p))) return parts
  return [raw]
}
