import type { RmEdgeKind } from './rm-types.ts'

/** Kuratierte Fähigkeiten — nur mit Folgenbeleg aus S01–S05. Keine Erfindung. */
export type RmSkillDraft = { name: string; code: string; note: string }

export type RmNamedEdge = {
  a: number
  b: number
  kind: Exclude<RmEdgeKind, 'coappear'>
  label: string
  codes: string[]
}

/** IDs aus rickandmortyapi.com, Stand S01–S05. */
export const RM_CORE_IDS = [1, 2, 3, 4, 5] as const

export const RM_SKILLS: Record<number, RmSkillDraft[]> = {
  1: [
    { name: 'Portalgun', code: 'S01E01', note: 'Öffnet Tore zwischen Dimensionen; erste Reise mit Morty.' },
    { name: 'Liebestrank / Cronenberg-Katastrophe', code: 'S01E06', note: 'Serum auf der ganzen Erde, dann Dimensionswechsel.' },
    { name: 'Mikroverse-Batterie', code: 'S02E06', note: 'Eine Zivilisation im Auto-Akku, von Zeep entlarvt.' },
    { name: 'Operation Phoenix (Klon-Transfer)', code: 'S02E07', note: 'Bewusstsein in jüngeren Klon (Tiny Rick); Rick erklärt das Projekt für gescheitert.' },
    { name: 'Persönlicher Schild', code: 'S03E05', note: 'Unsichtbares Feld lenkt Schüsse und Schläge ab; im Kreuzer-Scan als Cybernetik sichtbar.' },
    { name: 'Abschreckungsfeld', code: 'S03E05', note: 'Kontakt-Tod gegen Angreifer während des Kampfes mit Risotto Groupon.' },
    { name: 'Gurken-Körper', code: 'S03E03', note: 'Rick verwandelt sich in eine Gurke und überlebt trotzdem die Ratte/Klo-Odyssee.' },
    { name: 'Operation Phoenix (Auto-Wiederbelebung)', code: 'S04E01', note: 'Nach dem Tod lädt das Protokoll den Geist in fremde Klonwannen.' },
    { name: 'Säurebottich-Speicher', code: 'S04E08', note: 'Rick speichert Mortys Leben und spult fehlgeschlagene Versuche zurück.' },
  ],
  2: [
    { name: 'Überleben unter Ricks Plänen', code: 'S01E01', note: 'Erste Portaltour; Morty hält trotz Panik mit.' },
    { name: 'Vater von Morty Jr.', code: 'S01E07', note: 'Gazorpazorp-Paarung; das Kind wächst extrem schnell.' },
    { name: 'Todeskristall-Visionen', code: 'S04E01', note: 'Morty sieht mögliche Tode und steuert Entscheidungen danach.' },
    { name: 'Toxische Seite (temporär)', code: 'S03E06', note: 'Nach der Detox-Spa-Spaltung handelt ein rücksichtsloser Morty-Anteil.' },
    { name: 'Portalgun (kurz)', code: 'S05E10', note: 'In der Zitadelle nutzt Morty Portale, als Evil Morty die Kurve öffnet.' },
  ],
  3: [
    { name: 'Abenteurerin', code: 'S02E07', note: 'Summer holt Rick aus dem Tiny-Rick-Körper zurück.' },
    { name: 'Purge-Kampf', code: 'S02E09', note: 'Summer überlebt die Säuberungsnacht und tötet Angreifer.' },
    { name: 'Familien-Konfrontation', code: 'S03E09', note: 'Summer geht mit Beth nach Froopyland und stellt sie.' },
    { name: 'Graffiti-Tour', code: 'S05E05', note: 'Summer und Morty in der verbotenen Zone; Rick folgt später.' },
  ],
  4: [
    { name: 'Pferde-Chirurgin', code: 'S01E01', note: 'Beths Beruf steht von der Pilotfolge an fest.' },
    { name: 'Froopyland-Schöpferin', code: 'S03E09', note: 'Rick baute die Welt für Kind-Beth; erwachsene Beth räumt sie auf.' },
    { name: 'Klon-Unklarheit', code: 'S03E09', note: 'Beth lässt einen Klon anlegen; welche Beth bleibt, bleibt offen.' },
    { name: 'Kampf an der Residenz', code: 'S04E10', note: 'Beth und Space-Beth verteidigen die Familie gegen die Föderation.' },
  ],
  5: [
    { name: 'Alltags-Inkompetenz (Serie)', code: 'S01E01', note: 'Jerry ist von Anfang an der schwächste Erwachsene im Haus.' },
    { name: 'Glück im Casino-Abenteuer', code: 'S03E05', note: 'Jerry überlebt das Kreuzfahrt-Komplott und stellt Rick.' },
    { name: 'Mythologie-Vater', code: 'S04E09', note: 'Jerry wird von Glooties Volk als Fruchtbarkeitsfigur benutzt.' },
  ],
  47: [
    { name: 'Veteran / Freund Ricks', code: 'S01E11', note: 'Birdperson erscheint auf Ricks Party und spricht über den Krieg.' },
    { name: 'Hochzeit, dann Schuss', code: 'S02E10', note: 'Tammy enttarnt sich; Birdperson wird erschossen.' },
    { name: 'Phoenixperson-Umbau', code: 'S03E01', note: 'Die Föderation macht aus dem Körper eine Cyborg-Waffe.' },
  ],
  592: [
    { name: 'Cyborg-Kampfkörper', code: 'S04E10', note: 'Phoenixperson greift Rick an, bis Erinnerungen durchbrechen.' },
    { name: 'Erinnerungen zurück', code: 'S05E08', note: 'Rick rekonstruiert Birdpersons Gedächtnis in dessen Bewusstsein.' },
  ],
  118: [
    { name: 'Zitadellen-Intrige', code: 'S01E10', note: 'Evil Morty lässt Evil Rick fallen und entkommt der Jagd.' },
    { name: 'Präsident der Zitadelle', code: 'S03E07', note: 'Im Atlantis-Mixup steuert Evil Morty die Zitadelle.' },
    { name: 'Austritt aus der Kurve', code: 'S05E10', note: 'Evil Morty durchbricht die Central Finite Curve.' },
  ],
  244: [
    { name: 'Überlebt den Parasiten-Test', code: 'S02E04', note: 'Rick schießt ihn an, aber er ist kein Parasit — die Familie kennt ihn wirklich.' },
    { name: 'Langzeit-Genesung', code: 'S02E04', note: 'Er verabschiedet sich ins Koma; spätere Cameos bleiben an dieser Folge hängen.' },
  ],
  242: [
    { name: 'Wunscherfüllung, dann Tod', code: 'S01E05', note: 'Ein Meeseeks existiert nur, bis der Auftrag erledigt ist.' },
    { name: 'Eskalation bei Jerry', code: 'S01E05', note: 'Zwei Schläge im Golf werden zur Meeseeks-Krise.' },
  ],
  372: [
    { name: 'Schwarmbewusstsein', code: 'S02E03', note: 'Unity assimiliert Planetenbevölkerungen und war mit Rick zusammen.' },
  ],
  344: [
    { name: 'Föderations-Spionin', code: 'S02E10', note: 'Tammy erschießt Birdperson auf der Hochzeit.' },
    { name: 'Rückkehr als Offizierin', code: 'S04E10', note: 'Tammy führt den Angriff auf die Smiths.' },
  ],
  180: [
    { name: 'Mortys Schwarm', code: 'S01E11', note: 'Jessica tanzt auf Ricks Party; die Beziehung bleibt einseitig.' },
    { name: 'Date nach dem Säurebottich', code: 'S04E08', note: 'Morty kommt durch gespeicherte Versuche endlich zum Abschlussball.' },
  ],
  329: [
    { name: 'Intelligenz-Helm', code: 'S01E02', note: 'Snuffles wird superintelligent, stellt die Menschen und handelt Frieden aus.' },
  ],
  306: [
    { name: 'Albtraum-Dämon', code: 'S01E02', note: 'Scary Terry jagt in Träumen; Rick und Morty drehen den Spieß um.' },
  ],
  196: [
    { name: 'Auftragskiller', code: 'S02E02', note: 'Krombopulos Michael mietet Rick für eine Gefängnisbefreiung — und stirbt.' },
  ],
  265: [
    { name: 'Gurken-Überleben', code: 'S03E03', note: 'Pickle Rick tötet Ratten, baut einen Exo-Anzug und entkommt der Kanalisation.' },
  ],
  230: [
    { name: 'Extremwachstum', code: 'S01E07', note: 'Morty Jr. wird in Stunden erwachsen und verlässt die Erde.' },
  ],
  7: [
    { name: 'Rick-Morty-Hybrid', code: 'S01E06', note: 'Abradolf Lincler ist ein gescheitertes Gen-Experiment Ricks.' },
  ],
  388: [
    { name: 'Mikroverse-Physik', code: 'S02E06', note: 'Zeep entdeckt, dass seine Welt Ricks Batterie ist, und baut selbst eine Mini-Welt.' },
  ],
  672: [
    { name: 'Meeres-Herrschaft', code: 'S05E01', note: 'Mr. Nimbus kommandiert Ozean und Wetter; alter Rivale Ricks.' },
  ],
  717: [
    { name: 'Elementar-Kräfte', code: 'S05E03', note: 'Planetina fliegt, steuert Wetter und datet Morty — bis er ihre Grenzen sieht.' },
  ],
  667: [
    { name: 'Space-Beth / Defiance', code: 'S04E10', note: 'Die außerirdische Beth kämpft gegen die Föderation; Klonfrage bleibt offen.' },
  ],
  347: [
    { name: 'US-Präsident / „The Thing“', code: 'S03E10', note: 'Curtis duelliert sich mit Rick; seine Waffe durchschlägt Ricks Schild.' },
  ],
  107: [
    { name: 'Familientherapie', code: 'S03E03', note: 'Dr. Wong behandelt die Smiths nach Pickle Rick.' },
  ],
  525: [
    { name: 'App-Werbung / Fruchtbarkeit', code: 'S04E09', note: 'Glootie lockt mit einer App; sein Volk nutzt Jerry.' },
  ],
  331: [
    { name: 'Verwandlung (squanch)', code: 'S02E10', note: 'Squanchy kämpft auf der Hochzeit in Bestienform.' },
  ],
  122: [
    { name: 'Telepathie / Gaswesen', code: 'S02E02', note: 'Fart kommuniziert telepathisch; Morty tötet ihn am Ende.' },
  ],
  285: [
    { name: 'Ursprungs-Rick', code: 'S05E10', note: 'Rick Prime erscheint in der Zitadellen-Rückblende als der Rick, der Ricks Leben zerbrach.' },
  ],
  94: [
    { name: 'Erinnerung / Verlust', code: 'S03E01', note: 'Diane ist in Ricks gefälschter Erinnerung und als Motiv in der Origin-Story.' },
  ],
}

export const RM_NAMED_EDGES: RmNamedEdge[] = [
  { a: 1, b: 2, kind: 'family', label: 'Großvater / Enkel', codes: ['S01E01'] },
  { a: 1, b: 3, kind: 'family', label: 'Großvater / Enkelin', codes: ['S01E01'] },
  { a: 1, b: 4, kind: 'family', label: 'Vater / Tochter', codes: ['S01E01'] },
  { a: 4, b: 5, kind: 'partner', label: 'Ehe', codes: ['S01E01'] },
  { a: 4, b: 2, kind: 'family', label: 'Mutter / Sohn', codes: ['S01E01'] },
  { a: 4, b: 3, kind: 'family', label: 'Mutter / Tochter', codes: ['S01E01'] },
  { a: 5, b: 2, kind: 'family', label: 'Vater / Sohn', codes: ['S01E01'] },
  { a: 5, b: 3, kind: 'family', label: 'Vater / Tochter', codes: ['S01E01'] },
  { a: 1, b: 47, kind: 'ally', label: 'Beste Freunde', codes: ['S01E11', 'S02E10'] },
  { a: 47, b: 344, kind: 'partner', label: 'Hochzeit, dann Verrat', codes: ['S02E10'] },
  { a: 47, b: 592, kind: 'family', label: 'Dieselbe Person nach Umbau', codes: ['S03E01', 'S04E10'] },
  { a: 1, b: 592, kind: 'ally', label: 'Rick vs. / mit Phoenixperson', codes: ['S04E10', 'S05E08'] },
  { a: 1, b: 372, kind: 'partner', label: 'Ex-Beziehung', codes: ['S02E03'] },
  { a: 3, b: 344, kind: 'ally', label: 'Schulfreundin, später Feindin', codes: ['S01E11', 'S02E10'] },
  { a: 2, b: 180, kind: 'partner', label: 'Schwarm / später Date', codes: ['S01E11', 'S04E08'] },
  { a: 1, b: 118, kind: 'enemy', label: 'Gegenspieler', codes: ['S01E10', 'S05E10'] },
  { a: 2, b: 118, kind: 'enemy', label: 'Morty gegen Evil Morty', codes: ['S05E10'] },
  { a: 4, b: 667, kind: 'family', label: 'Beth und Space-Beth', codes: ['S04E10'] },
  { a: 1, b: 672, kind: 'enemy', label: 'Alte Rivalen', codes: ['S05E01'] },
  { a: 2, b: 717, kind: 'partner', label: 'kurze Beziehung', codes: ['S05E03'] },
  { a: 2, b: 230, kind: 'family', label: 'Vater / Morty Jr.', codes: ['S01E07'] },
  { a: 1, b: 331, kind: 'ally', label: 'Kriegsfreund', codes: ['S01E11', 'S02E10'] },
  { a: 1, b: 244, kind: 'ally', label: 'Familie kennt ihn wirklich', codes: ['S02E04'] },
  { a: 1, b: 347, kind: 'enemy', label: 'Rick vs. Präsident', codes: ['S03E10'] },
  { a: 1, b: 285, kind: 'enemy', label: 'Rick vs. Rick Prime', codes: ['S03E01', 'S05E10'] },
  { a: 1, b: 94, kind: 'family', label: 'Rick / Diane (Verlust)', codes: ['S03E01'] },
  { a: 1, b: 388, kind: 'enemy', label: 'Rick vs. Zeep', codes: ['S02E06'] },
  { a: 2, b: 196, kind: 'ally', label: 'Morty befreit das Ziel', codes: ['S02E02'] },
  { a: 1, b: 7, kind: 'family', label: 'Schöpfer / Hybrid', codes: ['S01E06'] },
  { a: 5, b: 525, kind: 'ally', label: 'Jerry und Glootie', codes: ['S04E09'] },
  { a: 4, b: 107, kind: 'ally', label: 'Therapie', codes: ['S03E03'] },
  { a: 344, b: 1, kind: 'enemy', label: 'Tammy jagt Rick', codes: ['S02E10', 'S04E10'] },
]

export const RM_SOURCES = [
  'https://rickandmortyapi.com/documentation',
  'https://github.com/afuh/rick-and-morty-api',
  'https://rickandmorty.fandom.com/wiki/List_of_Rick_Sanchez_C-137%27s_cybernetic_enhancements',
  'https://rickandmorty.fandom.com/wiki/Operation_Phoenix',
]
