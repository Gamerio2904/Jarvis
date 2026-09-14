# Sprint 267 — Coach: selten und aus der Bewertung

**Version:** `17.8.0` — **PLAN** Should
**Plan:** [`70-next.md`](../70-next.md)
**Voraussetzung:** Sprint **266** (Centipawn liegt vor)

## Ziel

Jarvis klingt wie ein Mitspieler, nicht wie ein Kommentator-Radio. Die
Screenshots wollen Intelligenz — **nicht** jeden Zug besprechen.

## Regel (hart, testbar)

Sei `delta = cp_nach_user − cp_vor_user` aus Sicht des Users (positiv =
besser für ihn).

| Bedingung | Kommentar (deutsch, fest, kein LLM) |
|-----------|-------------------------------------|
| `delta <= -150` (Patzer) | `Das hätte ich nicht getan.` |
| `delta >= +150` und nicht nur ein offensichtlicher Schlag | `Schlauer Zug.` |
| Matt in ≤3 gegen den User nach seinem Zug | `Danach wird es eng.` |
| sonst | **nichts** |

Zusätzlich: höchstens **ein** Kommentar alle drei eigene Züge, auch wenn
zwei Patzer hintereinander kommen — der zweite schweigt (sonst Radio).

Keine Namen „Master“. Kein „interessanter Versuch“-Füllsel.

LLM-Umformulierung **verboten** in diesem Sprint: feste Sätze halten den
Ton und kosten 0 Tokens. Wer später würzen will, misst in einem eigenen
Sprint gegen diese Baseline.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S267-1 | Eval vor/nach | `chess-engine.ts` | Vor User-Zug `cp`, nach User-Zug `cp`. Worker zweimal oder `eval` nach `go`. Ergebnis in `chess-coach.ts` |
| S267-2 | `commentFor(delta, plySinceComment)` | `chess-coach.ts` **neu** | Reine Funktion, Node-testbar, keine UI |
| S267-3 | Anzeige | `ChessMode` Leiste unter dem Brett + optional eine Zeile in `content` wenn Kommentar ≠ null. TTS darf den Kommentar lesen (kurz) |
| S267-4 | Ohne Engine | Stufe 1 (Negamax) liefert grobes Material. Schwelle dann `-200` / `+200` oder Coach **aus** — ehrlicher als falsches Lob. Default: Coach nur ab Stufe 2 |
| S267-5 | Test | `test-chess-coach.mjs` | delta -200 → Patzer-Satz. delta 10 → `null`. Zwei Patzer in Folge, `plySinceComment=1` → zweites `null` |

## Won’t

- Eröffnungsnamen aus einer Cloud-DB.
- Trash-Talk, Memes, jedes Mal „gute Partie“.
- Modell schreibt freie Kommentare.

## Abbruchkriterium

Mehr als ein Kommentar in drei Zügen in einem Testdurchlauf mit absichtlichen
Patzern. Oder ein Kommentar ohne Eval (Rate-Text).
