import { formatQwenChat, toChatRole } from '../src/engine/prompt.ts'
import { scrubReply, isHelpCommand } from '../src/engine/guards.ts'
import { isSafeHost, parsePlugCommand, plugUrl } from '../src/engine/plugs-parse.ts'

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

assert(parsePlugCommand('PC an')?.kind === 'switch', 'pc an')
const pcAn = parsePlugCommand('Mach den Rechner aus')
assert(pcAn?.kind === 'switch' && pcAn.ids.includes('pc') && pcAn.on === false, 'rechner aus')
const leds = parsePlugCommand('LEDs an')
assert(leds?.kind === 'switch' && leds.ids.includes('leds') && leds.on, 'leds an')
const allOff = parsePlugCommand('alles aus')
assert(allOff?.kind === 'switch' && allOff.ids.length === 3 && !allOff.on, 'alles aus')
assert(parsePlugCommand('Steckdosen')?.kind === 'list', 'liste')
assert(parsePlugCommand('Hallo') === null, 'kein stecker')
assert(isSafeHost('192.168.1.50'), 'ipv4')
assert(!isSafeHost('http://evil'), 'no url')
assert(plugUrl('192.168.1.50', 'tasmota', 'on').includes('Power%20On'), 'tasmota on')
assert(plugUrl('192.168.1.50', 'shelly', 'off').includes('turn=off'), 'shelly off')

console.log('engine smoke ok')
