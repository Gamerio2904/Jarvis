# Sprint 330 — Prompts erweitern + 18.8 Gold

**Version:** `18.8.7` — **CODE** Must
**Plan:** [`79-next.md`](../79-next.md) §4 und §7
**Voraussetzung:** 325–329.

## Ziel

Die Pakete decken Rollback, Termin-Fristen und Download ab. Neue Sätze
stehen in **GOLD_EXPECT** und `TEST_PROMPTS`, nicht nur in REGRESS.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S330-1 | Kalender | Gruppe Kalender | Folge-Prompts: 24 h und 2 h davor, am Termin, keine Erinnerung, 1 Stunde davor. Als Copy, Offset-Satz **nicht** allein in `TEST_PROMPTS` (braucht Pending) |
| S330-2 | 18.8 | Gruppe neu | Debug-Rollback, Download am Dock, Termin-Frage — zum Handtesten |
| S330-3 | Fläche | 18.7 + Heute | `Zeig Filme`, `Kalender zu` wo der Parser das kann. Lücken aus 18.8-Probe |
| S330-4 | Gold | `test-prompts.ts` `corpus.ts` | Neue eigenständige Sätze in beiden. Keys = TEST_PROMPTS. `allTestCopyTexts` enthält jeden TEST_PROMPT |
| S330-5 | Story | `STORYLINE_GROUPS` | Eine kurze 18.8-Reihe: Termin → Fristen → Debug-Hinweis |

## Won’t

- Offset-Satz als Gold-Route ohne Pending (würde Timer/Reminder stehlen).
- Gruppentitel wieder auf V1–V9 drehen.

## Abbruchkriterium

`eval:migrate` tot (Gold-Key ohne TEST_PROMPT oder umgekehrt). Oder
Kalender-Gruppe ohne Fristen-Prompt.

## Manuell

Kalender-Gruppe: Termin anlegen, dann den Fristen-Prompt im selben Chat.
18.8-Gruppe laut vorlesen.
