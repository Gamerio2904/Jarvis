/**
 * Verbletzte Sätze nach vorne drehen.
 *
 * „Stell einen Timer für zehn Minuten" verstehen die Parser. „Einen Timer für
 * zehn Minuten stellen" nicht — dieselbe Bitte, deutsche Wortstellung. Das ist
 * keine Mehrdeutigkeit, die ein Rangkriterium lösen könnte: es kommt schlicht
 * kein Kandidat zustande (gemessen in `scripts/eval/separability.mjs`).
 *
 * Die Umschrift läuft deshalb **nur, wenn sonst niemand zuständig ist**. Auf
 * dem schnellen Pfad wird sie nie berührt, und sie kann keinen Treffer
 * verdrängen — nur einen erzeugen, wo vorher das Modell übernommen hätte.
 */

/** Infinitiv am Satzende → Befehlsform am Satzanfang. */
const STEM: Record<string, string> = {
  stellen: 'stell',
  setzen: 'setz',
  machen: 'mach',
  notieren: 'notiere',
  starten: 'starte',
  spielen: 'spiel',
  suchen: 'such',
  zeigen: 'zeig',
  schicken: 'schick',
  senden: 'sende',
  öffnen: 'öffne',
  planen: 'plan',
  erinnern: 'erinnere',
}

/** Trennbare Verben: der Zusatz bleibt hinten, wo ihn die Parser erwarten. */
const SPLIT: Record<string, { stem: string; particle: string }> = {
  eintragen: { stem: 'trag', particle: 'ein' },
  anlegen: { stem: 'leg', particle: 'an' },
  hinzufügen: { stem: 'füg', particle: 'hinzu' },
  aufschreiben: { stem: 'schreib', particle: 'auf' },
}

/**
 * Höflichkeit und Modalverben vor dem eigentlichen Wunsch. „Kannst du mir
 * einen Timer stellen" ist gesprochen häufiger als der nackte Befehl.
 */
const LEAD =
  /^\s*(?:(?:und\s+)?(?:bitte\s+)?(?:kannst|kannste|könntest|würdest|magst|willst)\s+du(?:\s+bitte)?|ich\s+(?:will|möchte|muss|brauche)|bitte)\s+/i

/** „mir", „mal", „doch" zwischen Verb und Sache tragen nichts zur Absicht bei. */
const FILLER = /^(?:mir|uns|mal|doch|eben|kurz|schnell)\s+/i

const INFINITIVE = new RegExp(
  `^(.*\\S)\\s+(${[...Object.keys(STEM), ...Object.keys(SPLIT)].join('|')})\\s*([.!?]*)$`,
  'i',
)

/**
 * Gibt die umgestellte Fassung zurück oder `null`, wenn der Satz nicht
 * verbletzt ist. Der Aufrufer entscheidet, ob er sie braucht.
 */
export function frontVerb(text: string): string | null {
  let rest = text.trim()
  if (!rest || rest.length > 160) return null
  if (/\?\s*$/.test(rest) && !LEAD.test(rest)) return null
  const lead = LEAD.exec(rest)
  if (lead) rest = rest.slice(lead[0].length)
  while (FILLER.test(rest)) rest = rest.replace(FILLER, '')
  const hit = INFINITIVE.exec(rest)
  if (!hit) return null
  const body = hit[1].trim()
  if (!body) return null
  const verb = hit[2].toLowerCase()
  const split = SPLIT[verb]
  if (split) return `${split.stem} ${body} ${split.particle}`
  return `${STEM[verb]} ${body}`
}
