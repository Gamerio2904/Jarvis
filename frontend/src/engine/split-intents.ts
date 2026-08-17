const TOOLISH =
  /\b(wecker|weck|timer|termin|kalender|erinner|todo|aufgabe|wetter|tv|fernseh|lautstärke|sender|note|notiz|suche|schau(en)?\s+nach|was\s+steht|fahr|fahrmodus|spiel|spotify|navigier|route|wohnt|einkauf|liste|los|zuhause|geburtstag|foto|auge|ruf|tel|ventilator|lüfter)\b/i;

const MEMORY_WRITE = /^(ich\s+heiße|merk\s+dir|ich\s+bin|ich\s+wohne|ich\s+mag|ich\s+trinke)/i;

/** Zwei Tool-Sätze an „und“. Memory-Sätze („Ich heiße Max und trinke Kaffee“) bleiben ganz. */
export function splitIntents(text: string): string[] {
  const raw = text.trim();
  if (!raw || MEMORY_WRITE.test(raw)) return [raw];
  if (!/\s+und\s+/i.test(raw)) return [raw];
  const parts = raw.split(/\s+und\s+/i).map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2 || parts.length > 3) return [raw];
  if (parts.every((p) => TOOLISH.test(p))) return parts;
  return [raw];
}
