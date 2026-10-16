import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
const chat = readFileSync(new URL('../src/ui/MiniChat.tsx', import.meta.url), 'utf8')
const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8')

assert.match(app, /const \[planChatOn, setPlanChatOn\] = useState\(true\)/)
assert.match(app, /const planningBoard =/)
assert.match(app, /liveHud\.tischplatte_on/)
assert.match(app, /plan_phase === 'live' \|\| liveHud\.plan_phase === 'go'/)
assert.match(app, /dock="plan"\s+open=\{planChatOn\}/)
assert.match(app, /setPlanChatOn\(\(v\) => !v\)/)
assert.match(app, /planningBoard && planChatOn \? ' is-plan-chat'/)
assert.match(chat, /className="plan-chat-switch"/)
assert.match(chat, /aria-label=\{dock === 'plan' \? 'Chat aus' : 'Chat zuklappen'\}/)
assert.match(chat, /dock === 'plan' \? 'Aus' : 'Zu'/)
assert.match(css, /\.app\.is-plan-chat \.main\.is-home/)
assert.match(css, /body\.is-plan-chat \.gui-stage/)
assert.doesNotMatch(css, /\.app\.is-planning \.main\.is-home/)

console.log('test-plan-chat ok')
