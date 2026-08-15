import { formatQwenChat, toChatRole } from '../src/engine/prompt.ts'
import { scrubReply, isAlexaParkedAsk, isAlexaPurchaseAsk, isHelpCommand } from '../src/engine/guards.ts'

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(msg)
}

assert(toChatRole('foo') === 'user', 'unknown role -> user')
assert(toChatRole('assistant') === 'assistant', 'assistant role')

const prompt = formatQwenChat([
  { role: 'system', content: 'Du bist Jarvis.' },
  { role: 'user', content: 'Guten Abend.' },
])
assert(prompt.includes('<|im_start|>system'), 'system tag')
assert(prompt.includes('<|im_start|>user'), 'user tag')
assert(prompt.endsWith('<|im_start|>assistant\n'), 'assistant prefix')

assert(isHelpCommand('/hilfe'), 'help command')
assert(!isHelpCommand('hilfe mal'), 'not help')

const scrubbed = scrubReply('Hallo du, dein Name?')
assert(/Sie/.test(scrubbed) || /Ihr/.test(scrubbed), `siezen scrub: ${scrubbed}`)

assert(isAlexaPurchaseAsk('Kann Jarvis über Alexa kaufen?'), 'alexa kauf')
assert(isAlexaPurchaseAsk('Bestell das über den Echo Dot'), 'echo bestell')
assert(!isAlexaPurchaseAsk('Was ist Alexa?'), 'alexa ohne kauf')
assert(!isAlexaPurchaseAsk('Todo: Milch kaufen'), 'todo ohne alexa')
assert(isAlexaParkedAsk('Kann ich Jarvis auf dem Echo Show 5 laufen lassen?'), 'echo show runtime')
assert(isAlexaParkedAsk('Dinge auf dem Amazon Bildschirm anzeigen'), 'amazon bildschirm')
assert(isAlexaParkedAsk('Code auf Alexa hochladen nach Werkseinstellungen'), 'werksreset upload')
assert(!isAlexaParkedAsk('Was ist Alexa?'), 'alexa smalltalk')
assert(!isAlexaParkedAsk('Todo: Milch kaufen'), 'todo ohne alexa parked')

console.log('engine smoke ok')
