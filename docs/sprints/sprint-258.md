# Sprint 258 — Werkzeug-Vertrag für das Modell

**Version:** `16.10.0` (versionCode `161000`) — **CODE** (ausgeliefert in `17.0.0`)
**Plan:** [`68-next.md`](../68-next.md) §13 · Upgrade **E** aus [`67-upgrades.md`](../67-upgrades.md)
**Voraussetzung:** Sprint **250** (Kennzahlen), **257** (Bewertungsschicht steht)

## Ziel

Das Modell darf einen Werkzeugaufruf **vorschlagen**. Ausführen darf es ihn
nicht.

## Warum

Agenten-Pfad und Modell-Pfad sind heute getrennt. Findet der Router nichts,
formuliert das Modell frei — es kann kein Werkzeug aufrufen, nur reden.

„Erinnere mich an das, was Peter gestern gesagt hat, eine Stunde bevor der Zug
fährt" hat keinen Parser. Heute wird das nur beredet. Das ist der eigentliche
Abstand zu Claude und ChatGPT: dort schlägt das Modell einen Aufruf mit
Argumenten vor, und das System prüft ihn.

Der Punkt ist nicht, dem Modell zu vertrauen. Der Punkt ist, den **Vorschlag**
vom **Vollzug** zu trennen.

## Heute vs. Ziel

| Heute | Ziel |
|-------|------|
| Router findet nichts → Modell redet | Modell schlägt `{ agent, args }` vor |
| kein Schema je Agent | `zod`-Schema je `AgentSpec` |
| zusammengesetzte Sätze scheitern | Modell zerlegt, Parser bestätigt |
| — | `device`/`write` bleiben bestätigungspflichtig |
| JSON per Prompt erbeten, per Regex gerettet | Grammatik erzwingt es im Decoder |

## Lieferumfang

| ID | Task | Datei | Status |
|----|------|-------|--------|
| S258-1 | `args`-Schema je Werkzeug — **von Hand statt `zod`**, wie in 256 | `engine/tool-contract.ts` | CODE |
| S258-2 | Werkzeugliste für den Prompt, englisch | `engine/tool-contract.ts` | CODE |
| S258-3 | Modellantwort `{ tool, args }` einlesen und validieren | `engine/tool-contract.ts` | CODE |
| S258-4 | Vorschlag durchläuft **dieselbe** Routing-Kette wie eine getippte Äußerung | `engine/director.ts` | CODE |
| S258-5 | Ein Parser muss den Vorschlag bestätigen, sonst kein Vollzug | `engine/tool-contract.ts` | CODE |
| S258-6 | `device`/`write`: Bestätigung Pflicht — **aus dem Katalog, nicht aus dem Vertrag** | `engine/director.ts` | CODE |
| S258-7 | Nur wenn der Router `none` liefert **und** der Satz nach Anweisung aussieht | `engine/director.ts` | CODE |
| S258-8 | Tests statt Eval-Quote (Begründung unten) | `scripts/test-tool-propose.mjs` | CODE |
| S258-9 | `response_format: json_schema` mit `strict` bei Groq nutzen | `engine/groq.ts` | CODE |
| S258-10 | Schema **nicht** doppelt in den Prompt schreiben | `engine/tool-contract.ts` | CODE |
| S258-11 | Rückfallebene ohne erzwungenes JSON: Vorschlagsweg abschalten, nicht raten | `engine/tool-propose.ts` | CODE |
| S258-12 | Ein Modellaufruf je Zug — mit einer dokumentierten Einschränkung | `engine/director.ts` | CODE |
| S258-13 | Latenz auf dem schnellen Pfad unverändert | — | CODE |

## Ergebnis

Sechs Werkzeuge: `set_timer`, `set_alarm`, `create_reminder`,
`create_calendar_event`, `add_shopping_item`, `switch_tv`. Wenige, aber jedes
davon **beweisbar einlösbar** — dazu unten mehr.

### Der Vollzug bleibt deterministisch

Der Kniff, der diesen Sprint klein und sicher macht: ein Vorschlag wird nicht
ausgeführt, sondern **in einen deutschen Satz übersetzt**, und dieser Satz geht
durch dieselbe Kette wie eine getippte Äußerung.

```text
„stell mir einen Timer für den Kuchen im Ofen"   kein Parser
  → Modell:  { tool: 'set_timer', args: { minutes: '12' } }
  → Satz:    „stell einen Timer für 12 Minuten"
  → Router:  timer
  → Frage:   „Verstanden als „stell einen Timer für 12 Minuten". Soll ich?"
  → „ja"  →  derselbe Timer-Agent wie immer
```

Damit gibt es **keinen zweiten Ausführungspfad**. Das Modell kann die
Formulierung verschieben, nie die Ausführung erzwingen, und es gibt keine
Stelle, an der ein Agent mit Argumenten aufgerufen wird, die kein Parser
gesehen hat.

### Die vierte Schranke kommt aus dem Katalog

Geplant war ein Feld je Werkzeug. Gebaut ist eine Regel: bestätigungspflichtig
ist alles, dessen Agent im Katalog nicht `read` ist. Ein Feld kann man beim
siebten Werkzeug vergessen; eine Regel nicht. Praktisch heißt das: **alle
sechs** fragen nach, weil fünf `write` sind und einer `device`.

### Der Vertrag verspricht nur, was der Parser einlöst

`create_reminder` nimmt nur `today` und `tomorrow`. Der Grund steht im Test:
„erinnere mich am 2.10. um 9:00 Uhr an Paket abholen" versteht der
Erinnerungs-Parser **nicht** — er kann nur relative Tage. Ein Werkzeug, das
das trotzdem anböte, würde „ist notiert" sagen und nichts notieren. Für Daten
weiter draußen gibt es `create_calendar_event`, und der Kalender kann es.

Der Test hält das fest: für **jedes** Werkzeug wird ein Beispielaufruf
gerendert und durch den echten Router geschickt. Landet er nicht beim
versprochenen Agenten, ist der Test rot. Ein Werkzeug ohne Beispiel ist
ebenfalls rot.

### Was der Test gefunden hat

Eine Injektion, die beim Entwurf nicht bedacht war: ein Betreff kann einen
zweiten Befehl enthalten. „erinnere mich morgen um 8:00 Uhr an **mach den
Fernseher an**" beansprucht der **Fernseher**, nicht die Erinnerung — der
TV-Parser findet sein Muster mitten im Betreff und bietet höher.

Die dritte Schranke fängt das ab, ohne dass dafür etwas gebaut werden musste:
der bestätigende Agent muss der versprochene sein. `tv ≠ reminder`, also
passiert nichts. Die Erinnerung wird nicht gesetzt **und** der Fernseher geht
nicht an. Das ist der richtige Ausgang: ausgeführt würde sonst etwas anderes
als vorgeschlagen.

### Kein `zod`

Aus demselben Grund wie in [Sprint 256](./sprint-256.md): das Schema ist ein
flacher Beutel aus fünf Feldern, `strict` verbietet ohnehin alles
Interessante (kein `oneOf` an der Wurzel, alle Felder `required`, keine offenen
Maps), und ein Paket im Bundle für eine Handvoll `typeof`-Prüfungen zahlt sich
nicht aus. Optionale Argumente sind `nullable`, nicht `optional` — genau wie
der Plan es verlangt.

## Erzwungenes JSON statt erbetenes (S258-9)

Ein Modell zu **bitten**, JSON zu liefern, und die Antwort dann per Regex zu
retten, ist der übliche und der falsche Weg. Groq unterstützt
`response_format: { type: 'json_schema', strict: true }`: die Grammatik wird im
Decoder erzwungen, ungültige Tokens sind nicht mehr wählbar. Ein Feldname kann
dann nicht mehr falsch geschrieben sein, weil er nicht falsch geschrieben
*werden* kann.

Das ist kein Aufschlag auf das Kontingent — nur ein Parameter. Es spart sogar
Tokens, weil das Schema nicht mehr im Prompt wiederholt und in der Antwort nicht
mehr um Prosa herumgeschnitten werden muss. Daher S258-10: **einmal** als
`response_format`, nicht zusätzlich als Prompt-Text.

Zwei Grenzen, die dokumentiert bleiben müssen:

- **Nur auf der Cloud-Ebene.** Das lokale `wllama` kann GBNF grundsätzlich, aber
  der Weg ist hier nicht gebaut. Ohne erzwungenes JSON wird der Vorschlagsweg
  **abgeschaltet** (S258-11), nicht mit Regex nachgebaut. Der Router von heute
  ist dann der ganze Weg — schlechter, aber vorhersagbar.
- **`strict` verbietet Konstrukte.** Kein `oneOf` an der Wurzel, alle Felder
  `required`, keine offenen Maps. Die `zod`-Schemas aus S258-1 müssen darauf hin
  entworfen werden; optionale Argumente werden `nullable`, nicht `optional`.

## Sprache der Werkzeug-Beschreibungen

Alles, was in diesem Sprint neu entsteht — Werkzeugnamen, Feldnamen,
`description`-Texte, Aufzählungswerte — wird **englisch** geschrieben. Begründung
in [`69-modell-grundlagen.md`](../69-modell-grundlagen.md) §2.2: Struktur- und
Formatanweisungen werden auf Englisch zuverlässiger befolgt, und diese Texte
erreichen den Nutzer nie.

Die Persona in `persona.ts` bleibt **deutsch und unangetastet**. Sie demonstriert
Ton und Siezen, ist damit faktisch ein Few-Shot-Beispiel, und Beispiele in der
falschen Sprache kosten 15–20 % Genauigkeit. Es gibt hier also keine Migration,
nur eine Regel für Neues:

```text
maschinenseitig, erreicht nie den Nutzer   →  englisch
wird gesprochen oder angezeigt             →  deutsch
```

## Ein Aufruf, nicht zwei

Der Vorschlagsweg darf die Runde **nicht teurer machen**. Heute gilt bei
`none`: ein Modellaufruf, das Modell redet. Naiv umgesetzt würde daraus: ein
Aufruf für den Vorschlag, dann ausführen, dann ein zweiter Aufruf fürs
Formulieren — doppelte Latenz und doppeltes Kontingent für denselben Zug.

Deshalb als Bedingung, nicht als Optimierung:

| Fall | Antwort kommt von | Modellaufrufe |
|------|-------------------|---------------|
| `device` / `write` bestätigt und ausgeführt | Vorlage wie heute bei Parser-Treffern | **1** |
| `read` mit prüfbarem Ergebnis | Vorlage plus Ergebnis | **1** |
| Vorschlag verworfen (Schema oder Parser) | Rückfall auf den freien Text desselben Aufrufs | **1** |

Der Trick ist der letzte Fall: der Vorschlag und die Prosa-Antwort kommen aus
**einem** Aufruf, weil `device`- und `write`-Antworten in Jarvis ohnehin aus
Vorlagen bestehen und kein Modell brauchen. Nur wenn ein `read`-Agent ein
Ergebnis liefert, das sprachlich eingebettet werden muss, ist ein zweiter Aufruf
überhaupt eine Frage — und dann entscheidet die Messung aus 250, nicht das
Gefühl.

### Wie es gebaut ist, und wo es abweicht

Die ersten beiden Zeilen stimmen: ein bestätigter Vorschlag wird von einem
Agenten mit Vorlage beantwortet, **ein** Aufruf.

Die dritte Zeile ist bewusst anders gelöst. Der verworfene Vorschlag fällt
**nicht** auf die Prosa desselben Aufrufs zurück, sondern auf den normalen
Modellweg — also zwei Aufrufe. Der Grund ist die erste Priorität: der normale
Weg trägt Gedächtnis, Arbeitsspeicher, letzten Schritt und ggf. Recherche in
den Prompt. Die Antwort aus dem Vorschlags-Aufruf hätte nichts davon. Eine
nackte Antwort auszugeben, um einen Aufruf zu sparen, wäre ein Tausch von
Antwortqualität gegen Kontingent — und das an einer Stelle, an der das Modell
gerade signalisiert hat, dass es nicht weiß, was zu tun ist.

Stattdessen wird der Fall **selten** gemacht, mit zwei Maßnahmen:

- **Das Tor.** `looksCommandish` verlangt ein Domänenwort (Timer, Wecker,
  Termin, Liste, Fernseher …) **und** eine Befehlsform oder deren höfliche
  Umschreibung („kannst du …", „ich möchte …"), und schließt Fragewörter aus.
  „Was ist ein Timer" kostet keinen Aufruf, „stell mir einen Timer für den
  Kuchen im Ofen" schon. Smalltalk und Wissensfragen — der häufigste Fall —
  gehen unverändert direkt und **gestreamt** ans Modell.
- **Das kleine Kontingent.** Der Vorschlag läuft auf `llama-3.1-8b-instant`
  mit **14.400** Requests am Tag. Der zweite Aufruf im Verwerfungsfall belastet
  also nicht das knappe Budget (1.000/Tag), sondern das vierzehnfache. „Doppelt"
  gilt für die Anzahl, nicht für die Knappheit.

Damit bleibt die Latenz des schnellen Pfads unberührt (S258-13): wo heute ein
Parser greift, wird `looksCommandish` nie gefragt, weil der Vorschlagsweg erst
nach `pick.kind === 'none'` beginnt.

## Die vier Schranken

```text
1. Modell schlägt vor        { agent, args }
2. Schema prüft              zod — falsche Argumente fallen hier
3. Parser bestätigt          kein Parser-Treffer, kein Vollzug
4. Nutzer bestätigt          bei sideEffect: device | write
```

Damit bleibt „Erfolg nur bei prüfbarem Ergebnis" erhalten. Die Reichweite wächst
trotzdem, weil Schritt 1 Sätze zerlegen kann, für die es keinen Parser gibt.

Der Vorschlag greift **nur**, wenn der Router `none` liefert. Für alles, was ein
Parser sicher erkennt, ändert sich nichts — der schnelle, deterministische Weg
bleibt der Normalfall.

## Abbruchkriterium

**Ein Modellvorschlag erreicht ein Gerät ohne Bestätigung.** Das ist die eine
Grenze, die dieses Projekt nie überschreitet: kein Modell hat die Hand am
Fernseher. Findet der Test einen Weg daran vorbei, wird der Sprint zurückgezogen.

Zweites Kriterium: die Fehlgriffe steigen. Ein Vorschlag, der öfter falsch als
hilfreich ist, macht die App unberechenbar.

Drittes: **der `none`-Pfad wird langsamer oder teurer.** Ein zusätzlicher
Modellaufruf pro Zug wäre bei 1.000 Requests am Tag eine Halbierung der
Nutzbarkeit. S258-12 ist deshalb Bedingung, nicht Feinschliff.

## Tests

```bash
cd frontend
npm run test:tool-propose     # neu: Vertrag, Schranken, ein Zug durch den Director
npm run eval:report           # Trefferquote hält, Prompt nicht länger
npm run test:turn-e2e
npm run test:agents-robust
npm run test:prompts
npx tsc -b && npm run lint
```

`test:tool-propose` deckt alles ab, was der Plan verlangt: erfundenes Werkzeug
(`launch_missiles`) wird verworfen, falsche Argumente erzeugen keinen Satz
(Minuten `0`, `9000`, „zehn"; Uhrzeit `25:00`, `07:60`; Datum `2026-13-02`),
ein `device`-Vorschlag ohne „ja" erreicht nichts, und eine Wissensfrage kostet
**keinen** Aufruf — geprüft mit einem `fetch`, das beim Aufruf den Test rot
färbt.

Der Kern ist ein echter Zug durch den Director mit `fake-indexeddb` und
gefälschter Groq-Antwort: „stell mir einen Timer für den Kuchen im Ofen" →
Rückfrage, Timer-Liste **unverändert** → „nein" → immer noch unverändert →
nochmal fragen, „ja" → der Timer steht wirklich, fällig in zwölf Minuten.

**S258-8 ohne Eval-Quote.** Die `none`-Quote im Korpus kann diesen Sprint nicht
messen: der Vorschlagsweg braucht ein Netz und einen Schlüssel, und `eval`
läuft ohne beides. Eine Quote, die im Test immer denselben Wert liefert, ist
keine Messung. Gemessen wird stattdessen die Grenze — dass ohne Bestätigung
nichts passiert — und das geht in Node vollständig.
