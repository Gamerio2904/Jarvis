# Yu-Gi-Oh! Duel — Test-Build `18.31.7`

## Einstieg

Im Chat oder Sprachmodus den Satz **„Jarvis, ich fordere dich zu einem Duell
heraus.“** verwenden. Ultron öffnet das Vollbild-Overlay und bestätigt die
Herausforderung. `Escape` beziehungsweise **Duell schließen** beendet die
Ansicht.

Vor dem Duell im Deckeditor über die YGOPRODeck-Suche Karten in Main- und Extra
Deck übernehmen. Das Main Deck muss 40–60 Karten, das Extra Deck höchstens 15
Karten enthalten. TCG-Kopierlimits, sofern die API sie liefert, werden beim
Hinzufügen berücksichtigt. Der Deckstand wird lokal auf dem Gerät gespeichert.
Extra-Deck-Monster sind mit den unten beschriebenen vereinfachten
Materialregeln beschwörbar.

## Enthaltener Funktionsumfang

- Responsive Vollbild-Overlay für Handy und Tablet mit sichtbaren Zonen für
  Deck, Extra Deck, Friedhof und Spielfeldzauber (beide Seiten), fächerbarer
  Hand, Phasenleiste und Step-by-Step-Darstellung von Jarvis' Zug.
- Kartennamensuche, Kartengrafiken und Kartendaten über YGOPRODeck REST API.
  Die Suche beginnt erst ab zwei Zeichen; dafür werden Suchtext und Netzwerk-
  Metadaten an den Drittanbieter übertragen. Es gibt keinen Offline-Katalog.
- Lokale Deckvalidierung, TCG-Kopierlimits aus der gelieferten Kartendatei und
  lokales Speichern der Decklisten.
- Grundregeln: 8000 LP, fünf Startkarten, sechs Phasen, Normalbeschwörung,
  Tributpflicht nach Stufe, einfache ATK-Kampfauflösung, Zugwechsel und
  Niederlage bei leerem Deck.
- Extra-Deck-Beschwörungen mit Materialprüfung für Fusion (mindestens zwei
  Monster), Synchro (Empfänger und passende Gesamtstufe), Xyz (mindestens zwei
  Monster gleicher Stufe) und Link (Materialanzahl mindestens Link-Wert).
  Materialien gehen auf den Friedhof; das Extra-Deck wird lokal verwaltet.
- Effektunterstützung über Kartentext-Erkennung inkl. Ketten: ziehen, Schaden,
  LP-Gewinn, Negation, Angriffs-Negation, Suche aus dem Deck, Wiederbelebung,
  temporärer ATK-Boost sowie Zerstören (ein Monster, alle Monster, Angriffs-
  Positionen oder Zauber/Fallen). Ketten haben Priorität, Pass-Fenster und
  LIFO-Auflösung. Jarvis kann auf Angriffe und Ketten reagieren.
- Karten-Details per Tap: eigene Feldkarten immer, gegnerische Feldmonster nur
  offen. Das Detailfenster zeigt große Grafik, Werte und Kartentext (live
  aus YGOPRODeck, mit Fallback).
- Spieleraktionen im Duell: Monster normal beschwören **oder verdeckt in
  Verteidigung setzen**, Zauber/Fallen setzen, Position wechseln, Effekte
  aktivieren, Extra-Deck per Overlay (Auto-Material oder manuelle Auswahl).
- Während Jarvis' Zug läuft der Ablauf verzögert in einzelnen Schritten. Falls
  eine eigene Falle aktivierbar ist, erscheint ein kleiner **STOP**-Button am
  Rand zum Unterbrechen; danach kann man reagieren und mit **Weiter** fortsetzen.
- **RL-Trainingslabor:** trainiert eine lineare Softmax-Policy mittels
  episodischem Policy Gradient (REINFORCE mit terminalem Sieg/Remis/Niederlage-
  Signal) auf synthetischen Duellen gegen die Baseline. Das UI startet 500
  Trainingsspiele und kann anschließend 300 separat gesetzte Holdout-Duelle
  gegen dieselbe Baseline evaluieren. Gewichte werden lokal gespeichert und
  beim nächsten Duell von Jarvis verwendet. Der seedbare Runner ist in
  `frontend/src/engine/yugioh-training.ts`; Tests prüfen Wiederholbarkeit und
  Ergebnisbereiche. Referenzlauf (Seed 12345 trainiert, Seed 918273 holdout):
  500 Spiele / 4.394 Policy-Gradient-Updates; Holdout **38,7 %** (116/300)
  gegenüber **25,0 %** Soup-Baseline (75/300), also **+13,7 Prozentpunkte**.
- Karten-Einblendung, Angriffs-/Effekt-/Beschwörungs-Feedback, LP-Balken,
  Glow-Markierung aktivierbarer Karten und `prefers-reduced-motion`-Beachtung.

## Erweitertes Trainingslabor (Engine, CLI und App-UI)

- `yugioh-decks.ts`: erzeugt wechselnde Decks aus fünf Archetypen (aggro,
  control, combo, balanced, burn) mit Effekt-Monstern, Zaubern, Tunern und
  Extra Deck. **burn** wird nie trainiert und dient nur als unbekannter
  Gegner in der Auswertung.
- `yugioh-net.ts`: 28 Aktionsmerkmale (Handkarten, Effekte, Ketten-Entscheidungen,
  Extra-Deck-Beschwörung, Kampfausgang, LP/Feld-Kontext), ein kleines
  neuronales Netz (16 tanh-Neuronen) oder ein lineares Modell darüber,
  REINFORCE mit Baseline, Entropie-Bonus und Adam, Auswahl des besten
  Validierungsstands sowie Model Soup über Spezialisten (aggro/control/combo)
  mit gemeinsamem Startpunkt und Greedy-Aufnahme.
- `npm run train:duel-net [Episoden] [Spiele] [Seed]` gibt eine Vergleichstabelle aus.

Referenzlauf (4000 Episoden, 600 Holdout-Duelle, Seed 918273, wechselnde
Decks beider Seiten): Zufall 62,7 %, Heuristik 81,2 %, Linear 80,2 %,
Netz 80,7 %, Netz-Soup 79,5 %. Das Netz lernt also deutlich mehr als
Zufallsspiel und erreicht die handgeschriebene Heuristik auch gegen den
unbekannten Archetyp, **übertrifft sie aber nicht**; Unterschiede von
1–2 Punkten liegen im Messrauschen. Der Gegner ist die skriptgesteuerte
Engine-KI. Das Netz wurde auf der Spielerseite trainiert.
das Netz steuert nun auch Jarvis im echten Duell (siehe unten).

### Netz steuert Jarvis, echte Decks

- Im Deck-Menü wählt man das **Jarvis-Gehirn** (Neuronales Netz oder alte
  Skript-KI) und das **Jarvis-Deck** (Ultron-Zufallspool, eigenes Deck oder festes echtes Deck).
  Ist noch kein Netz gespeichert, trainiert die App beim Start kurz eins
  (1500 Episoden) und speichert es lokal.
- Jarvis' Zug läuft über `jarvisStep`: Das Brett wird gespiegelt, damit
  dieselben Regeln und Merkmale wie im Training gelten. Das Netz (oder die
  Skript-KI) wählt sichtbar Schritt für Schritt Beschwörung, Extra-Deck,
  Effekte und Angriffe; Ketten laufen weiter über die Engine-Priorität.
- Simulation (60 Duelle gegen die Heuristik als „Spieler“, wechselnde Decks):
  Netz-Jarvis gewann 20/60, die alte Skript-KI 12/60. Das ist eine Simulation,
  keine Aussage über Spaß oder Turnierstärke.
- **Echte Decks:** 46 offizielle TCG-Structure-Decks (Kartenlisten mit echten
  Stückzahlen aus den Yugipedia-Set-Listen, Kartendaten von YGOPRODeck) sind
  eingebettet (`yugioh-real-decks.ts`, erzeugt von
  `scripts/build-ygo-decks.mjs`) und per Tipp ladbar. 14 weitere Structure
  Decks fehlen, weil Karten (Skill Cards, Tokens, Namensabweichungen) nicht
  auflösbar waren oder die Größe nicht 40–60/≤15 ergab.
- **Ultron-Pool:** 25 dieser echten Decks; Jarvis zieht bei jedem Duell zufällig
  eines und nennt es im Hinweis. Alternativ: eigenes Deck oder ein festes Deck.
- Eingebettet sind Name, Typ, ATK/DEF, Stufe, Subtyp (z. B. Quick-Play/Counter)
  und geparste Effekte; Volltexte lädt die UI bei Bedarf live. Bilder werden
  zur Laufzeit von images.ygoprodeck.com geladen (Netz nötig). Die Banlist gilt
  nur im Deckbuilder, nicht für diese Decks.
- Stand der gebündelten Effekte nach Re-Enrichment
  (`scripts/enrich-ygo-effects.mjs`): 1395 Karten insgesamt, 430 Karten mit
  simuliertem Effekt (u. a. 118 Boost, 105 Search, 74 Draw, 57 Negate, 32 Damage,
  24 Destroy, 8 Negate-Attack, 5 Revive).
- Die generierten Archetyp-Decks dienen weiter nur Training und Auswertung.

## Münzwurf vor dem Duell

Vor jedem normalen Duell (du gegen Ultron) läuft eine Münzwurf-Animation
(3D-Flip, „DU“ gegen „ULTRON“), die per `coinFlip()` entscheidet, wer beginnt.
Gewinnt Ultron, setzt `giveFirstTurn()` ihn auf Zug 1 (ohne Ziehen, wie beim
Spieler) und die Schritt-Automatik spielt seinen Zug; danach zieht der Spieler.
Tippen oder „Überspringen“ beendet die Animation, das Ergebnis bleibt gleich.
Bei `prefers-reduced-motion` entfällt die Drehung. Die Animation wurde nur gebaut
und typgeprüft, nicht auf einem Gerät gesehen. Self-Play-Matches (Sprint 503)
nutzen keinen Münzwurf.

## Statusblase und Self-Play

Während Jarvis zieht, zeigt eine Blase oben rechts „Ultron denkt nach …“ bzw. die
letzte Aktion (setzt Karte, beschwört, greift an); bei STOP „pausiert“. Self-Play,
Zugsuche, Dev-Umschalter, Review, Nachweis und Verify sind in **`18.45.0`**
implementiert — siehe [`104-next.md`](./104-next.md).

Plan **105** (Sprints **511–530**, **`18.51.0`**) ist als **TCG-Subset** umgesetzt:
EMZ/MMZ-Kapazität über Link, Turn-1 ohne Battle Phase, Spell Speed 2/3 in Ketten,
Banish-Zone, erweiterte Effektarten (Banish, Bounce, Mill, Field-Aura), Schema v2
mit Coverage-/Fidelity-Metriken im Nachweis. Details: [`105-next.md`](./105-next.md).

## Was noch fehlt (geplant)

Pendel, vollständiges PSCT pro Karten-ID, Zielwahl-UI für alle Texte, Competitive-
Edge-Cases und offizielle Judge-Rulings bleiben außerhalb des Scope — siehe
**Bewusste Grenzen** unten.

## Self-Play und Zugsuche (Engine, ohne UI)

- [`yugioh-selfplay.ts`](../frontend/src/engine/yugioh-selfplay.ts): zwei Agenten
  spielen ein ganzes Match abwechselnd. Der Stand liegt immer aus Sicht der ziehenden
  Seite vor (sie ist `player`), Engine und Netz bleiben unverändert. Pro Seite wird ein
  zufälliges Deck gezogen (`generated`, `real`, `mixed`), per Seed reproduzierbar.
  `stepSelfPlayMatch` führt einen sichtbaren Schritt aus, `playSelfPlayMatch` das
  ganze Match. Jede Aktion landet mit Kandidaten, Bewertung vorher/nachher und
  Suchinfo in einem Protokoll (Grundlage für Sprint 507).
- [`yugioh-search.ts`](../frontend/src/engine/yugioh-search.ts): Beam Search mit
  iterativer Vertiefung über Aktionsfolgen, Stellungsbewertung, Stellungstabelle,
  Stichproben für die verdeckte Gegnerhand/-Karten und Boltzmann-Wahl. Profile:
  `game` (bis Stabilität, hart 30 s), `training` und `proof` (nur Knotenbudget,
  keine Uhr, damit Nachspielen reproduzierbar ist).
- Gemessen (Suche ohne Netz gegen Heuristik, 400 Matches, Seiten abwechselnd):
  generierte Decks ca. 62 % (±5), echte Decks ca. 52 % (±5, nicht von 50 %
  unterscheidbar). Das sagt nichts über Turnierstärke.
- Grenzen: Die Suche modelliert den Gegnerzug nicht, nur die Skript-Antworten der
  Engine; der Anziehende hat einen Vorteil; die Gegnerliste gilt als bekannt.

## Bewusste Grenzen

Dies bleibt ein **vereinfachter Prototyp**, keine vollständige
Yu-Gi-Oh!-Implementierung. Das Policy-Gradient-Verfahren ist tatsächlich
ausführbar und die Winrate wird auf getrennten simulierten Holdout-Spielen
gemessen; beide laufen aber nur in einer synthetischen Regelsimulation gegen
die eingebaute Baseline. Das ist weder Training auf vollständigen echten
Karten-/Duellverläufen noch eine Aussage über Turnier-Winrate oder
Generalisierung.

Die Effekt-Erkennung bleibt heuristisch (Schema v2 + PSCT-Atome), deckt aber nicht
alle ~1395 Karten ab. Unklare OPT-Texte sind fail-closed. Explizite Spielerauswahl
für Ziele fehlt oft noch; Errata-Tabelle ist minimal. Viele Turnier-Edge-Cases
(Pendel, Kettendetails, gleichzeitige Effekte nur grob) sind vereinfacht.

## Prüfen

```bash
cd frontend
npm run test:yugioh-duel
npm run test:yugioh-rules
npm run test:yugioh-fidelity
npm run build
```

Der Testlauf prüft Sprachtrigger, Mittelwertbildung, Start-Hand, Phasen,
Normal-/Tributbeschwörung, Kampf, Zugwechsel, Deck-out, unterstützte Effekte,
Kettennegation, Synchro-Materialien, reproduzierbares Training und
Fusion-/Xyz-/Link-Materialien sowie den messbaren Holdout-Vergleich.
YGOPRODeck-Netzwerkzugriff, Audio, Animationen und
Android-Gerätebedienung müssen zusätzlich am Zielgerät manuell geprüft werden.

## Version / APK

App-Version **`18.51.0`**, Android `versionCode 185100`, debug-signierter
Test-Build (Self-Play 503–510 + TCG-Subset 511–530). Build: `./build-apk.sh`;
Sideload: `releases/Jarvis.apk`.
