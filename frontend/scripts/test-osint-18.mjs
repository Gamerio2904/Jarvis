import assert from 'node:assert/strict'
import { parseOsintIntent } from '../src/engine/osint-parse.ts'
import { parseWontIntent } from '../src/engine/wont-parse.ts'
import { parseDriveIntent } from '../src/engine/drive-parse.ts'
import { parseWatchlistIntent } from '../src/engine/watchlist-parse.ts'
import { pickRoute } from '../src/engine/route-pick.ts'

assert.equal(parseOsintIntent('WHOIS example.com')?.kind, 'domain')
assert.equal(parseOsintIntent('Wer hat example.com')?.kind, 'domain')
assert.equal(parseOsintIntent('IP 8.8.8.8 auf der Kugel')?.kind, 'ip')
assert.equal(parseOsintIntent('Was ist CVE-2024-1234')?.kind, 'cve')
assert.equal(parseOsintIntent('Steht Example auf der Sanktionsliste')?.kind, 'sanctions')
assert.equal(parseOsintIntent('Scan 8.8.8.8')?.kind, 'refuse_scan')
assert.equal(parseOsintIntent('Zeig Erdbeben'), null)
assert.equal(parseWontIntent('Zeig Kameras')?.reason, 'cctv')
assert.equal(parseDriveIntent('Öffne das watchlist overlay'), null)
assert.equal(parseWatchlistIntent('Öffne das watchlist overlay')?.kind, 'show')
assert.equal(pickRoute('Öffne das watchlist overlay'), 'watchlist')
assert.equal(pickRoute('WHOIS example.com'), 'osint')
assert.equal(pickRoute('Scan 8.8.8.8'), 'osint')
assert.equal(pickRoute('Zeig Kameras'), 'wont')
assert.equal(pickRoute('Zeig Erdbeben'), 'hud')
assert.equal(pickRoute('Briefing zur Lage'), 'hud')

console.log('test:osint-18 ok')
