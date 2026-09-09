# Sprint 258 — Werkzeug-Vertrag für das Modell

**Version:** `16.11.0` (versionCode `161100`) — **PLAN**
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
| S258-1 | `args`-Schema (`zod`) je `AgentSpec` | `agents/parse-catalog.ts` | PLAN |
| S258-2 | `zod-to-json-schema` → Werkzeugliste für den Prompt | `engine/tool-schema.ts` | PLAN |
| S258-3 | Modellantwort `{ agent, args }` einlesen und validieren | `engine/tool-propose.ts` | PLAN |
| S258-4 | Vorschlag durchläuft **dieselbe** Policy wie ein Parser-Treffer | `engine/policy.ts` | PLAN |
| S258-5 | Ein Parser muss den Vorschlag bestätigen, sonst kein Vollzug | `director.ts` | PLAN |
| S258-6 | `device`/`write`: Bestätigung Pflicht (V9-Hardening) | `director.ts` | PLAN |
| S258-7 | Nur wenn der Router `none` liefert — kein Zweitweg für klare Fälle | `director.ts` | PLAN |
| S258-8 | Eval: `none`-Quote sinkt, Fehlgriffe steigen nicht | `scripts/eval/report.mjs` | PLAN |
| S258-9 | `response_format: json_schema` mit `strict` bei Groq nutzen | `engine/groq.ts` | PLAN |
| S258-10 | Schema **nicht** doppelt in den Prompt schreiben | `engine/tool-schema.ts` | PLAN |
| S258-11 | Rückfallebene ohne erzwungenes JSON: Vorschlagsweg abschalten, nicht raten | `engine/tool-propose.ts` | PLAN |

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

## Tests

```bash
cd frontend
npm run eval:report           # none-Quote sinkt, Trefferquote hält
npm run test:turn-e2e         # Bestätigungspflicht greift
npm run test:agents-robust
npm run test:prompts
npx tsc -b && npm run lint
```

Neu abzudecken: ein erfundener Agent im Vorschlag wird verworfen, falsche
Argumente fallen am Schema, ein `device`-Vorschlag ohne Bestätigung erreicht
nichts, und ein klarer Parser-Fall geht **nicht** über den Modellweg.
