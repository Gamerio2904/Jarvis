import { formatQwenChat, toChatRole } from '../src/engine/prompt.ts'
import { scrubReply, isHelpCommand } from '../src/engine/guards.ts'
import { inferThreadCount } from '../src/engine/threads.ts'

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

assert(inferThreadCount(1) === 2, 'thread floor 2')
assert(inferThreadCount(2) === 2, '2 cores -> 2')
assert(inferThreadCount(4) === 3, '4 cores -> 3')
assert(inferThreadCount(8) === 4, 'thread cap 4')

console.log('engine smoke ok')
