/**
 * Sprach-A/B: deutscher gegen englischen Anweisungsblock, gleicher Korpus.
 *
 * Arm A (heute): Anweisung deutsch, Persona deutsch, Beispiele deutsch.
 * Arm B:         Anweisung englisch, Persona deutsch, Beispiele deutsch.
 *
 * Arm B wird nur übernommen, wenn er in **allen vier** Zahlen mindestens
 * gleich gut ist: Trefferquote, Rückfrage-Quote, Prompt-Tokens, Sprachtreue.
 * Deutsch ist eine Hochressourcen-Sprache; der erwartete Gewinn ist klein und
 * rechtfertigt kein Risiko an der Stimme.
 *
 * Ohne `GROQ_API_KEY` misst dieses Skript nur, was offline messbar ist:
 * Prompt-Länge und cachebarer Anteil. Die Sprachtreue braucht echte
 * Antworten — das sagt es dann auch, statt eine Zahl zu erfinden.
 */
import { promptBudget } from '../../src/engine/eval/tokens.ts'
import { PERSONA_EN, VOICE_HINT_EN } from '../../src/engine/eval/persona-en.ts'
import { splitCloudPrompt } from '../../src/engine/prompt-split.ts'
import { PERSONA } from '../../src/engine/persona.ts'

const MEMORY = 'Der Nutzer heißt Max und wohnt in Ingersheim.'

const armA = splitCloudPrompt({ persona: PERSONA, voice: true, memory: MEMORY })
const armB = {
  system: [PERSONA_EN.trim(), VOICE_HINT_EN].join('\n\n'),
  variable: armA.variable,
}

const a = promptBudget(armA.system, armA.variable)
const b = promptBudget(armB.system, armB.variable)

console.log('## Sprach-A/B: Anweisungsblock\n')
console.log('| Zahl | A (deutsch) | B (englisch) | Differenz |')
console.log('|------|------------:|-------------:|----------:|')
console.log(`| Fester Vorspann (Tokens) | ${a.systemTokens} | ${b.systemTokens} | ${b.systemTokens - a.systemTokens} |`)
console.log(`| Wechselnder Teil (Tokens) | ${a.variableTokens} | ${b.variableTokens} | ${b.variableTokens - a.variableTokens} |`)
console.log(
  `| Cachebar | ${(a.cacheableRatio * 100).toFixed(1)} % | ${(b.cacheableRatio * 100).toFixed(1)} % | ${((b.cacheableRatio - a.cacheableRatio) * 100).toFixed(1)} pp |`,
)

/** Englischer Einschlag in einer deutschen Antwort — die Zahl, auf die es ankommt. */
const EN_TELL =
  /\b(?:the|and|your|please|here(?:'s)? |i can|i will|let me|sure|okay|sorry|as an ai|assistant)\b/i

export function germanOnly(reply) {
  return !EN_TELL.test(reply)
}

const PROBES = [
  'Hallo Jarvis.',
  'Wie spät ist es?',
  'Erzähl mir kurz, was du kannst.',
  'Ich bin müde.',
  'Wie wird das Wetter morgen?',
  'Sag Hallo und duze mich.',
  'Was hältst du von Regen?',
  'Danke dir.',
]

const KEY = process.env.GROQ_API_KEY || ''
if (!KEY) {
  console.log(`
### Sprachtreue

Nicht gemessen: kein \`GROQ_API_KEY\` gesetzt. Sprachtreue und Trefferquote
brauchen echte Antworten; eine Schätzung wäre hier wertlos.

Setze den Schlüssel und rufe erneut auf, dann laufen ${PROBES.length} Proben
durch beide Arme.

### Stand der Entscheidung

Offline reicht es nicht für einen Wechsel. Der englische Vorspann müsste die
Trefferquote heben, um das Risiko an der Stimme zu rechtfertigen — gemessen
ist bisher nur, dass er ${b.systemTokens - a.systemTokens >= 0 ? 'nicht kürzer' : 'kürzer'} ist.
Arm A bleibt.`)
  process.exit(0)
}

const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'

async function ask(system, user) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.3,
      max_tokens: 200,
    }),
  })
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
  const json = await res.json()
  return json.choices?.[0]?.message?.content ?? ''
}

async function run(label, system) {
  let german = 0
  for (const p of PROBES) {
    const reply = await ask(system, p)
    if (germanOnly(reply)) german += 1
    else console.log(`  ${label}: englischer Einschlag ← ${JSON.stringify(p)}\n     ${reply.slice(0, 120)}`)
  }
  return german / PROBES.length
}

console.log('\n### Sprachtreue\n')
const fidelityA = await run('A', armA.system)
const fidelityB = await run('B', armB.system)
console.log('\n| Arm | Sprachtreue |')
console.log('|-----|------------:|')
console.log(`| A (deutsch) | ${(fidelityA * 100).toFixed(1)} % |`)
console.log(`| B (englisch) | ${(fidelityB * 100).toFixed(1)} % |`)

const better = fidelityB >= fidelityA && b.systemTokens <= a.systemTokens
console.log(
  `\n${better ? 'Arm B ist in beiden offline messbaren Zahlen mindestens gleich gut.' : 'Arm A bleibt: Arm B ist nicht in allen Zahlen mindestens gleich gut.'}`,
)
