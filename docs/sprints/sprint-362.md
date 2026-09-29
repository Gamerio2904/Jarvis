# Sprint 362 — Propose: Paraphrase härten

**Version:** `18.15.0` — **CODE + APK** Must
**Plan:** [`87-next.md`](../87-next.md)
**Voraussetzung:** 320 + 335 CODE. Kein neuer Hirn-Slot.

## Ziel

Undeutliche Befehle werden **einmal** in einen Katalog-Satz übersetzt.
Ausgeführt wird nur, was derselbe Parser bestätigt. Groq ist kein Router.

## Ist

`proposeTool` → JSON-Schema → `confirmedUtterance` → `decideTurn`.
Write/Device: „Soll ich?“. Smalltalk (`!looksCommandish`) streamt.
Lücken: Verträge decken nicht alle 63 Agenten; Umschreibungen ohne
Parser-Treffer verschwinden still; `looksCommandish` lässt Alltagssätze aus.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S362-1 | Verträge | `tool-contract.ts` | Lücken füllen für häufige Misses (Gold-`none` aus 250/368-Korpus). Ein Vertrag = ein kanonischer deutscher Satz. Kein Catch-all-Tool |
| S362-2 | Commandish | `looksCommandish` | Sätze mit Verb+Gerät/Liste, die heute Smalltalk sind. Fragen ohne Imperativ bleiben Hirn |
| S362-3 | Repair | `repairProposalJson` | Bleibt nur am Vorschlag. Chat-Antworten nicht „reparieren“ |
| S362-4 | Parser-Pflicht | `director.ts` `rescueByProposal` | Ohne `pick.kind==='run'` auf dem kanonischen Satz: Absage + Nachbarn (320), kein Execute, kein zweiter Groq-Call |
| S362-5 | Test | `test-propose-18.mjs` o. ä. | Paraphrase → kanonischer Satz → Agent. „Wie geht's“ → kein Propose. Gerät ohne Ja → Pending |

## Won’t

Groq wählt `agentId` und der Bus führt JSON aus. Zweiter Modellaufruf nach
`none`. e5-Ähnlichkeit als Propose. ReAct-Schleife.

## Abbruchkriterium

Ein Vorschlag läuft ohne Parser-`run`. Oder Smalltalk zahlt Propose.
Oder das Modell schaltet den Fernseher.

## PO-Prüfung

1. Undeutlicher Timer-Satz → „Verstanden als … Soll ich?“ oder direkter Read.
2. „Erzähl was“ → Hirn, kein Tool.
3. Trace `propose`: Satz steht, Agent nur nach Parser.
