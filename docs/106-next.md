# 106 — Yu-Gi-Oh! Master Duel als Duellvorlage **PLAN** (`18.52`–`18.60`)

**Bedingung:** Die Bedienung des Duells folgt der App Yu-Gi-Oh! Master Duel als
direkte Vorlage: Aktivieren-Fenster, Zielwahl auf dem Feld, Kettenstapel,
Kampf- und Endphase, Zonenwahl, Kartenstatus, Pendel und Ritual, Deckeditor
und Duellprotokoll.

**Planungsstand:** **PLAN**. Baut auf Plan 105 auf (Sprints 511–530, Stand
`18.51.3`). Kein Sprint ist gebaut. `APP_VERSION`, `package.json` und die
Test-APK bleiben `18.51.3`, bis jemand `Umsetzen` sagt und das jeweilige
Gateway auf Go steht. `engineStamp` bleibt `18.51.0-ygo-tcg`, bis ein Sprint
die Auflösung ändert (538, 540–542, 544–546).

**Vorlage, kein Nachbau der App-Hülle.** Shop, Gems, Secret Packs, Crafting,
Rangliste, Einsatz-Uhr, Solo-Story, Sleeves, Feld-Skins, Mates und Replay
gehören nicht in diesen Plan. Replay erst, wenn das Protokoll aus Sprint 549
jede Aktion vollständig genug aufschreibt.

**Was 105 schon gelegt hat und dieser Plan nicht noch einmal öffnet:** Zonen
EMZ/MMZ, sechs Phasen, 8000 LP, fünf Startkarten, Handlimit 6, Münzwurf,
Ketten mit LIFO und Spell Speed, Link-Pfeile, Banish, Feldzauber, Deckeditor
mit 40–60 und höchstens 15 Extra-Karten. Sprint 526 hat die Zielwahl als
Hinweis im Text vorbereitet; die volle Tipp-Wahl auf dem Feld ist dort nicht
geschlossen und liegt in 533–534.

---

## Reihenfolge

Zuerst die Frage, dann das Ziel, dann die sichtbare Kette, dann der Kampf,
dann die Zone, dann der Status auf der Karte, dann Pendel und Ritual, dann
der Editor, zuletzt das Protokoll. Ein späteres Tor benutzt das Fenster aus
531. Pendel wartet auf die Zonenwahl, weil Extra-Deck-Monster weiterhin nur
in eine Extra-Monsterzone oder eine von einem eigenen Link gezeigte Spalte
gehen.

| Version | versionCode, erst beim Bauen | Sprints | Gate |
|---|---:|---|---|
| `18.52.0` | 185200 | 531–532 | Aktivieren-Fenster und Schalter OFF / AUTO / ON |
| `18.53.0` | 185300 | 533–534 | Ziele auf dem Feld und in öffentlichen Stapeln |
| `18.54.0` | 185400 | 535–536 | Kettenstapel und Reihenfolge gleichzeitiger Trigger |
| `18.55.0` | 185500 | 537–539 | Knöpfe Kampf und Ende, Kampfschritte, Pfeil und LP-Zahl |
| `18.56.0` | 185600 | 540–542 | Spalte wählen, Xyz-Material, genannte Fusions- und Synchro-Materialien |
| `18.57.0` | 185700 | 543 | Statussymbole auf der Zone und im Blatt |
| `18.58.0` | 185800 | 544–546 | Pendel-Skalen, Pendelbeschwörung, Ritual |
| `18.59.0` | 185900 | 547–548 | Deck links, Suche rechts, Filter, Banlist-Farben, verwandte Karten |
| `18.60.0` | 186000 | 549–550 | Duellprotokoll und Vorlagen-Gate |

Sprintdetails: [`sprint-531.md`](./sprints/sprint-531.md) bis [`sprint-550.md`](./sprints/sprint-550.md).

---

## 1. Säule — Frage und Ziel (`18.52`–`18.53`)

**Ziel:** Ein optionaler Effekt hält das Duell an. Die Karte liegt groß im
Fenster, mit Kettennummer, Ja und Nein. Danach tippt man das Ziel, wenn
mehrere Karten passen.

| Schalter | Wann gefragt wird |
|---|---|
| AUTO | Gegnerische Aktion und eigener Trigger. Voreinstellung. |
| ON | Zusätzlich vor einem Phasenwechsel und nach jeder Auflösung. |
| OFF | Nur Pflicht-Effekte. |

Eigene legale Ziele sind blau, gegnerische rot. Ungültige Zonen bleiben dunkel.
Friedhof, eigenes Deck, eigenes Extra und offene Verbannung tragen ein
Orts-Icon. Gegner-Deck und gegnerisches Extra bleiben verdeckt.

| Version | Sprints | Go |
|---|---|---|
| `18.52.0` | 531–532 | Ja legt auf die Kette, Nein lässt die Karte liegen. OFF verschluckt keinen Pflicht-Effekt. |
| `18.53.0` | 533–534 | Bei zwei oder mehr Kandidaten entscheidet ein Tipp. Ein illegales oder verdecktes gegnerisches Ziel lässt sich nicht bestätigen. |

---

## 2. Säule — Kette und Kampf (`18.54`–`18.55`)

**Ziel:** Die Kette ist ein Stapel der echten Karten, CL1 unten, das letzte
Glied oben. Die Auflösung nimmt das obere Glied zuerst, mit Pause, in
derselben Reihenfolge wie `passDuelChain`. Liegen mehrere eigene Trigger
gleichzeitig, wählt der Spieler das erste Glied.

Die Phase springt über zwei Knöpfe: Kampf und Ende. Main 2 gibt es nur nach
einem Kampf. Der erste Zug bietet keinen Kampfknopf. In der Kampfphase stehen
die Schritte Start, Angriffsdeklaration, Schadensrechnung und Ende. Vor der
Schadensrechnung bleibt ein Antwortfenster. Ein Pfeil verbindet Angreifer und
Ziel, die LP-Differenz erscheint als Zahl. `prefers-reduced-motion` behält
Pfeil und Zahl ohne Flug.

Sprint 538 ändert die Auflösung und erhöht `engineStamp`.

---

## 3. Säule — Zone, Material, Status (`18.56`–`18.57`)

**Ziel:** Eine Beschwörung mit mehreren legalen Spalten wartet auf einen Tipp.
Extra-Deck-Monster nur in eine freie Extra-Monsterzone oder eine Hauptspalte,
auf die ein eigener Link zeigt. Keine sechste Hauptzone.

Xyz-Material bleibt unter der Karte und steht im Blatt. Es gilt nicht als
zerstört und liegt nicht im Friedhof, nur weil beschworen wurde. Ein Effekt,
der Material abnimmt, bleibt fail-closed, bis ein Kartentext ihn in einem
späteren Sprint verlangt. Dieser Plan erfindet das Abnehmen nicht.

Nennt ein Fusions- oder Synchro-Text einen Namen oder eine Stufensumme, gilt
diese Angabe. Fehlt sie, bleibt die bisherige Mindestregel. Ein mehrdeutiger
Text ist fail-closed und zeigt die Meldung.

Negiert, unzielbar und immun erscheinen als Symbol auf der liegenden Karte
und als Zeile im Blatt, neben Attribut, Stufe oder Rang oder Link-Pfeilen
und der Typzeile. Das Symbol verschwindet, wenn der Zustand endet.

Sprints 540–542 erhöhen `engineStamp`.

---

## 4. Säule — Pendel, Ritual, Editor, Protokoll (`18.58`–`18.60`)

**Ziel:** Zwei Skalen-Slots sitzen links und rechts der Monsterreihe. Nur
eine Karte mit gelieferter Skala belegt einen Slot. Fehlt die Skala, bleibt
die Karte als Pendel unspielbar, ohne erfundene Zahl.

Ein Pendelmonster, das vom Feld auf den Friedhof ginge, liegt stattdessen
offen im Extra Deck. Die Pendelbeschwörung nimmt einmal pro Zug Monster aus
der Hand und aus diesem Extra, deren Stufe zwischen den beiden Skalen liegt.
Monster aus dem Extra brauchen eine Extra-Monsterzone oder einen eigenen
Link-Zeiger.

Ritual beschwört aus der Hand. Die Tributmonster erreichen mindestens die
Ritualstufe und gehen auf den Friedhof. Nennt der Text eine Ritualzauber,
liegt diese Karte dabei. Ritual verbraucht die Normalbeschwörung nicht.

Der Deckeditor zeigt das Deck links und die Suche rechts. Filter sind Typ,
Attribut, Stufe, Rasse, Archetyp und Effekttext, auf dem schon geladenen
Bestand. Die Zähler 40–60 und 0–15 und die Kopierlimits bleiben. Banlist-Farben
kommen nur aus dem gelieferten Kopierlimit: 0 verboten, 1 limitiert, 2
semi-limitiert. Verwandte Karten sind andere Karten desselben Archetyp-Namens
im lokalen Katalog. Fehlt der Name, bleibt die Liste leer und sagt das.

Das Protokoll unter der Statuszeile schreibt eine Zeile je Beschwörung,
Aktivierung, Kettenglied, Angriff und Phasenwechsel, in der Reihenfolge der
Engine. Es erfindet keine Zeile.

Sprints 544–546 erhöhen `engineStamp`.

---

## 5. Abhängigkeiten

- 532 hängt an 531. 533 an 531. 534 an 533. 535 an 531. 536 an 535.
- 537 hängt an 532, weil ON vor dem Phasenwechsel fragt.
- 538 hängt an 537. 539 an 538.
- 540 hängt an der Zonenregel aus 511. 541 und 542 hängen an 540.
- 544 hängt an 540. 545 an 544. 546 hängt an 533, weil Tribut ein Ziel ist.
- 547 und 548 hängen nicht an der Matte. 549 hängt an 535, damit die
  Kettenreihenfolge im Protokoll dieselbe ist. 550 hängt an 531–549.

## 6. Gemeinsames Gate (`18.60.0`)

1. `npm run test:yugioh-duel`, `test:yugioh-rules` und `test:yugioh-fidelity` bleiben grün.
2. Jede Version 18.52 bis 18.59 hat die Goldfälle aus ihrem Sprint.
3. [`yugioh-duel.md`](./yugioh-duel.md) nennt die neuen Grenzen und die offenen Lücken.
4. Kein Sprint dieses Plans setzt `APP_VERSION` oder baut eine APK. Das bleibt ein eigener Release-Schritt nach Go.

## 7. Lücken

- Material von einer Xyz-Karte abnehmen, sobald ein Kartentext es verlangt.
- Replay aus dem Protokoll.
- Vollständige Link-Master-Rule und historische Pendel-Ausnahmen.
- OCG gegen TCG. Dieser Plan bleibt bei der bisher verwendeten TCG-Linie.
- Offline-Vollkatalog. Filter laufen über den eingebetteten Bestand und bereits geladene Suche.
- Jede der eingebetteten Karten mit einem offiziellen Skript. Die Vorlage ist die Bedienung. Die Effekt-Engine bleibt die Teilsimulation aus Plan 105.

Vorgänger: [`105-next.md`](./105-next.md). Umfang heute: [`yugioh-duel.md`](./yugioh-duel.md).
