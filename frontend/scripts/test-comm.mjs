import assert from 'node:assert/strict'
import {
  parseContactsScan,
  parseContactsList,
  parseEmailStore,
  parseMailIntent,
  parseWaInbox,
  looksLikeEmail,
  mailHostFor,
} from '../src/engine/comm-parse.ts'
import { parseWontIntent } from '../src/engine/wont-parse.ts'
import { parseSms } from '../src/engine/places-parse.ts'
import { pickRoute } from '../src/engine/route-pick.ts'
import { HELP_TEXT } from '../src/engine/guards.ts'
import { GOLD_EXPECT } from '../src/engine/eval/corpus.ts'
import { TEST_PROMPTS } from '../src/engine/test-prompts.ts'
import { AGENT_SWEEP } from '../src/engine/agents/sweep.ts'

assert.equal(parseContactsScan('Kontakte scannen')?.kind, 'contacts_scan')
assert.equal(parseContactsScan('Lies mein Telefonbuch')?.kind, 'contacts_scan')
assert.equal(parseContactsScan('Telefonbuch einlesen')?.kind, 'contacts_scan')
assert.equal(parseContactsScan('Wetter heute'), null)
assert.equal(parseContactsScan('Zeig meine Kontakte'), null)
assert.equal(parseContactsList('Zeig meine Kontakte')?.kind, 'contacts_list')
assert.equal(parseContactsList('Welche Nummern kennst du')?.kind, 'contacts_list')
assert.equal(parseContactsList('Kontakte scannen'), null)
{
  const stored = parseEmailStore('Mama, Mail name@gmx.de')
  assert.equal(stored?.kind, 'email_store')
  assert.equal(stored && stored.kind === 'email_store' ? stored.name : null, 'mama')
  assert.equal(stored && stored.kind === 'email_store' ? stored.email : null, 'name@gmx.de')
}
assert.equal(parseEmailStore('Mail von Mama: name@gmx.de')?.kind, 'email_store')
assert.equal(parseEmailStore('Schreib mir eine E-Mail'), null)
assert.equal(parseEmailStore('Freundin, Tel 01711234567'), null)

assert.equal(parseMailIntent('Lies meine E-Mails')?.kind, 'mail_read')
assert.equal(parseMailIntent('Neue Mails')?.kind, 'mail_read')
assert.equal(parseMailIntent('Schreib mir eine E-Mail')?.kind, 'mail_write')
{
  const w = parseMailIntent('Schreib mir eine E-Mail')
  assert.equal(w && w.kind === 'mail_write' ? w.to : null, '')
  const mama = parseMailIntent('Schreib eine E-Mail an Mama')
  assert.equal(mama && mama.kind === 'mail_write' ? mama.to : null, 'mama')
}
assert.equal(parseMailIntent('E-Mail an test@example.com Hallo')?.kind, 'mail_write')
assert.ok(looksLikeEmail('name@gmx.de'))
assert.equal(mailHostFor('a@gmail.com'), 'imap.gmail.com')
assert.equal(mailHostFor('a@gmx.de'), 'imap.gmx.net')
assert.equal(mailHostFor('a@web.de', 'imap.custom.de'), 'imap.custom.de')

assert.equal(parseWaInbox('Was steht auf WhatsApp')?.kind, 'wa_inbox')
assert.equal(parseWaInbox('WhatsApp von Mama')?.query, 'mama')
assert.equal(parseWaInbox('Antworte Mama auf WhatsApp ich bin unterwegs')?.kind, 'wa_reply')
{
  const r = parseWaInbox('Antworte Mama auf WhatsApp ich bin unterwegs')
  assert.equal(r && r.kind === 'wa_reply' ? r.body : null, 'ich bin unterwegs')
}
assert.equal(parseWaInbox('WhatsApps beantworten')?.kind, 'wa_reply')

assert.equal(parseWontIntent('Schreib mir eine E-Mail'), null)
assert.equal(parseSms('Schreib Mama auf WhatsApp ich bin unterwegs')?.kind, 'whatsapp')
assert.equal(parseSms('Schreib mir eine E-Mail'), null)

assert.equal(pickRoute('Kontakte scannen'), 'maps')
assert.equal(pickRoute('Zeig meine Kontakte'), 'maps')
assert.equal(pickRoute('Mama, Mail name@gmx.de'), 'maps')
assert.equal(pickRoute('Lies meine E-Mails'), 'maps')
assert.equal(pickRoute('Schreib mir eine E-Mail'), 'maps')
assert.equal(pickRoute('Was steht auf WhatsApp'), 'maps')
assert.equal(pickRoute('Antworte Mama auf WhatsApp ich bin unterwegs'), 'maps')
assert.equal(pickRoute('Mach ein Foto'), 'wont')

assert.equal(GOLD_EXPECT['Schreib mir eine E-Mail'], 'maps')
assert.equal(GOLD_EXPECT['Kontakte scannen'], 'maps')
assert.equal(GOLD_EXPECT['Zeig meine Kontakte'], 'maps')
assert.equal(GOLD_EXPECT['Mama, Mail name@gmx.de'], 'maps')
assert.equal(GOLD_EXPECT['Lies meine E-Mails'], 'maps')
assert.equal(GOLD_EXPECT['Was steht auf WhatsApp'], 'maps')
assert.ok(TEST_PROMPTS.includes('Kontakte scannen'))
assert.ok(TEST_PROMPTS.includes('Zeig meine Kontakte'))
assert.equal(AGENT_SWEEP.wont, 'Mach ein Foto')

assert.match(HELP_TEXT, /Telefonbuch nach Ja/)
assert.match(HELP_TEXT, /E-Mail lesen mit App-Passwort/)
assert.match(HELP_TEXT, /kein stilles WhatsApp/)
assert.match(HELP_TEXT, /sichtbare Meldung/)

console.log('test:comm ok — Scan, Liste, Mail merken, IMAP-Host, Mail-Write, WhatsApp-Inbox, Routing')
