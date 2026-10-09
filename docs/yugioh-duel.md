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

- Responsive Vollbild-Overlay für Handy und Tablet mit Jarvis-/Spielerfeld,
  fünf Monster- und Zauber-/Fallen-Plätzen, Friedhof, Deckzählern, Hand und
  Statusleiste.
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
- Begrenzte Effektunterstützung über Kartentext-Erkennung: ziehen, Schaden,
  LP-Gewinn, ein gegnerisches Monster zerstören und Negation des letzten
  Kettenglieds. Ketten bekommen fortlaufende IDs, gegnerische Priorität,
  Pass-Fenster und LIFO-Auflösung. Jarvis reagiert auf unterstützte
  Negationskarten.
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
- Karten-Einblendung, Beschwörungs-/Angriffs-/Effekt-Feedback und
  `prefers-reduced-motion`-Beachtung.

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
- Jarvis' Zug läuft über `runNetJarvisTurn`: Das Brett wird gespiegelt, damit
  dieselben Regeln und Merkmale wie im Training gelten. Das Netz wählt Beschwörung,
  Extra-Deck-Beschwörung, Effekte und Angriffe. Reagiert Jarvis mit einem Effekt,
  beantwortet die Kette der Spieler weiterhin über den skriptgesteuerten Responder
  (er kann also automatisch eine Negation aus deiner Hand spielen).
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
- Eingebettet sind Name, Typ, ATK/DEF, Stufe und die geparsten Effekte, nicht
  der Kartentext. Bilder werden zur Laufzeit von images.ygoprodeck.com geladen
  (Netz nötig). Die Banlist gilt nur im Deckbuilder, nicht für diese Decks.
  Nicht unterstützte Effekte (alles außer Ziehen/Schaden/Heilen/Zerstören/
  Negieren) werden als Karte ohne Effekt gespielt.
- Die generierten Archetyp-Decks dienen weiter nur Training und Auswertung.

## Bewusste Grenzen

Dies bleibt ein **vereinfachter Prototyp**, keine vollständige
Yu-Gi-Oh!-Implementierung. Das Policy-Gradient-Verfahren ist tatsächlich
ausführbar und die Winrate wird auf getrennten simulierten Holdout-Spielen
gemessen; beide laufen aber nur in einer synthetischen Regelsimulation gegen
die eingebaute Baseline. Das ist weder Training auf vollständigen echten
Karten-/Duellverläufen noch eine Aussage über Turnier-Winrate oder
Generalisierung.

Die Effekt-Erkennung ist absichtlich auf fünf generische Effektformen
beschränkt. Sie interpretiert keine Kosten, Bedingungen, Timing-Fenster,
Zielwahlen, Kartentexte in natürlicher Sprache vollständig oder Errata.
Negation zielt auf das letzte Kettenglied. Kampfpositionen, Spezialbeschwörungs-
Beschränkungen, korrekte Materialien/Kartennamen bei Fusion, Link-Regeln,
Extra-Monsterzonen, Quick-Play-/Trap-Timing, komplexe Damage Steps,
Archetype-Deckgenerierung und Turnierregeln fehlen weiterhin. Die UI zeigt die
Regelvereinfachungen an; unbekannte Texteffekte werden nicht als ausführbar
ausgegeben.

## Prüfen

```bash
cd frontend
npm run test:yugioh-duel
npm run build
```

Der Testlauf prüft Sprachtrigger, Mittelwertbildung, Start-Hand, Phasen,
Normal-/Tributbeschwörung, Kampf, Zugwechsel, Deck-out, unterstützte Effekte,
Kettennegation, Synchro-Materialien, reproduzierbares Training und
Fusion-/Xyz-/Link-Materialien sowie den messbaren Holdout-Vergleich.
YGOPRODeck-Netzwerkzugriff, Audio, Animationen und
Android-Gerätebedienung müssen zusätzlich am Zielgerät manuell geprüft werden.

## Version / APK

App-Version `18.31.7`, Android `versionCode 183107`, debug-signierter
Test-Build. Die Android-Geräteabnahme und Release-Freigabe sind offen. Der
Build-Einstieg ist `./build-apk.sh`; das erzeugte Sideload liegt in
`releases/Jarvis.apk`.
