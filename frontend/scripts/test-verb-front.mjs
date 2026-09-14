import assert from 'node:assert/strict'

/**
 * Sprint 257 — verbletzte Sätze, Zahlwörter im Satz, Pro-Formen nach einem
 * Gerätezug. Alles Fälle, in denen vorher **kein Kandidat** zustande kam.
 *
 * Der Sprint war als Intent-Ähnlichkeit geplant. Der Zensus in
 * `scripts/eval/separability.mjs` hat gezeigt, dass der Fall, den Ähnlichkeit
 * lösen soll (zwei gleich starke Kandidaten), nie eintritt — dieser Test
 * deckt den Fall ab, der stattdessen eintritt.
 */

const { frontVerb } = await import('../src/engine/verb-front.ts')
const { decideTurn } = await import('../src/engine/route-pick.ts')
const { routeForEval, routeCtx } = await import('../src/engine/eval/route-eval.ts')
const { expandZahlenworte } = await import('../src/engine/zahlenworte.ts')
const { parseTvIntent } = await import('../src/engine/tv-parse.ts')
const { AMBIG_PROBES } = await import('../src/engine/eval/ambig-probes.ts')

// ------------------------------------------------------- Umstellung allein

assert.equal(frontVerb('einen Timer für zehn Minuten stellen'), 'stell einen Timer für zehn Minuten')
assert.equal(frontVerb('Milch auf die Einkaufsliste setzen'), 'setz Milch auf die Einkaufsliste')
assert.equal(frontVerb('die Musik lauter machen'), 'mach die Musik lauter')
assert.equal(frontVerb('den Zahnarzt für morgen eintragen'), 'trag den Zahnarzt für morgen ein')
assert.equal(frontVerb('den Termin anlegen'), 'leg den Termin an')

/** Höflichkeitsform und Modalverb davor — gesprochen der Normalfall. */
assert.equal(frontVerb('Kannst du mir einen Timer für zehn Minuten stellen'), 'stell einen Timer für zehn Minuten')
assert.equal(frontVerb('Könntest du bitte das Licht ausmachen'), null, 'ausmachen kennen die Parser schon')
assert.equal(frontVerb('Ich möchte einen Timer für fünf Minuten stellen'), 'stell einen Timer für fünf Minuten')
assert.equal(frontVerb('Bitte die Musik leiser machen'), 'mach die Musik leiser')

/** Kein verbletzter Satz, keine Umstellung. */
assert.equal(frontVerb('stell einen Timer für zehn Minuten'), null)
assert.equal(frontVerb('Wie spät ist es'), null)
assert.equal(frontVerb(''), null)
assert.equal(frontVerb('   '), null)
assert.equal(frontVerb('stellen'), null, 'ohne Inhalt keine Umstellung')
assert.equal(frontVerb('Was soll ich machen?'), null, 'eine Frage ist keine Anweisung')
assert.equal(frontVerb(`${'sehr langer Satz '.repeat(20)}stellen`), null, 'Längengrenze')

// --------------------------------------------- Umstellung nur als Rückfall

/**
 * Der teure Teil ist nicht die Umstellung, sondern die Zusicherung: sie darf
 * nur greifen, wenn sonst niemand zuständig ist. Sonst verschiebt sie
 * Treffer, die heute richtig sind.
 */
const schonRichtig = routeCtx('stell einen Timer für zehn Minuten')
assert.equal(decideTurn(schonRichtig).ctx.text, schonRichtig.text, 'die Vorlage bleibt, wenn sie trägt')

const verbletzt = routeCtx('einen Timer für zehn Minuten stellen')
const gedreht = decideTurn(verbletzt)
assert.notEqual(gedreht.ctx.text, verbletzt.text, 'hier wird gedreht')
assert.equal(gedreht.pick.kind, 'run')
assert.equal(gedreht.pick.id, 'timer')
/**
 * Und die gedrehte Fassung muss der Handler bekommen. Würde nur der Router
 * sie sehen, ginge der Zug an `timer` und dessen Parser fände nichts.
 */
assert.match(gedreht.ctx.text, /^stell /)

// Ein Satz, den auch die Umstellung nicht rettet, bleibt ohne Kandidat.
const ohne = decideTurn(routeCtx('einen Kuchen backen'))
assert.equal(ohne.pick.kind, 'none')
assert.equal(ohne.ctx.text, 'einen Kuchen backen', 'ohne Treffer bleibt die Vorlage stehen')

// ------------------------------------------------------------- Zahlwörter

assert.equal(expandZahlenworte('erinnere mich morgen um acht an den Zahnarzt'), 'erinnere mich morgen um 8 an den Zahnarzt')
assert.equal(expandZahlenworte('stell den Wecker auf sieben'), 'stell den Wecker auf 7')
assert.equal(expandZahlenworte('um acht abends'), 'um 8 abends')
/** „um drei Dinge" ist keine Uhrzeit und bleibt in Ruhe. */
assert.equal(expandZahlenworte('kümmere dich um drei Sachen'), 'kümmere dich um drei Sachen')
assert.equal(expandZahlenworte('ich freue mich auf zwei Wochen Urlaub'), 'ich freue mich auf zwei Wochen Urlaub')

assert.equal(routeForEval('Erinnere mich morgen um acht an den Zahnarzt'), 'reminder')
assert.equal(routeForEval('Stell den Wecker auf sieben'), 'alarm')

// ------------------------------------------------- Pro-Form nach TV-Zug

/**
 * „Mach das aus" schaltete ab, „mach das an" nicht — dieselbe Geste, zwei
 * Ergebnisse. Ursache war eine Ausnahme auf `das|du|es`, gedacht gegen
 * „mach **du** das an" als Bestätigung einer angebotenen Suche.
 */
for (const text of ['mach das an', 'stell das an', 'schalt das mal an', 'mach das aus', 'mach an']) {
  assert.equal(routeForEval(text, { lastTool: 'tv' }), 'tv', `nach einem TV-Zug: ${text}`)
}
assert.equal(parseTvIntent('Mach du das an', true), null, 'die Such-Bestätigung bleibt ausgenommen')
assert.equal(parseTvIntent('Schau dir das an', true), null, 'das „an" gehört zum Verb')
assert.equal(parseTvIntent('Fernseher an')?.action, 'on')

/** Ohne Bezug bleibt die Pro-Form beim Modell — raten wäre schlimmer. */
assert.equal(routeForEval('mach das an'), 'llm')

// ------------------------------------------------------------ kein Rückfall

/** Keine der Ambig-Sonden darf durch die Umstellung plötzlich raten. */
for (const probe of AMBIG_PROBES) {
  const before = routeCtx(probe)
  const after = decideTurn(before)
  if (after.ctx.text !== before.text) {
    assert.equal(after.pick.kind, 'run', `umgestellt, aber ohne Treffer: ${probe}`)
  }
}

console.log('OK test-verb-front')
