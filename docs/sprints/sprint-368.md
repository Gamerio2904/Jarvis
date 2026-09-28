# Sprint 368 — Parser-Korrektur → Gold, Härten

**Version:** `18.15.0` — **PLAN** Must (paralleles Lesen Should)
**Plan:** [`87-next.md`](../87-next.md)
**Voraussetzung:** 361–367. Korpus `GOLD_EXPECT` = `TEST_PROMPTS`.

## Ziel

Ein Parser-Miss wird ein **Test**, nicht ein Gewicht. Optional: ein
Lese-Agent holt zwei Quellen parallel und sagt **einen** Satz. Kein Schwarm.

## Ist

Gold in `frontend/src/engine/eval/corpus.ts`. Misses bleiben mündlich.
`Promise.all` existiert in Retrieve und Globe-Brief — **in einem** Handler.
Director startet nie zwei Domänen-Agenten.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S368-1 | Miss-Log | Debug-Export / Trace | Bei `pick.kind==='none'` oder Nutzer-Widerspruch nach Tool: Utterance + erwarteter Agent (wenn Nutzer nennt) als Zeile. Kein Cloud-Upload |
| S368-2 | Gold-Import | `eval/corpus.ts` `TEST_PROMPTS` | Kanon: eine Datei. Neue Fälle nur wenn `decideTurn` den Agenten **jetzt** treffen *soll* und ein Parser existiert. Sonst Won’t-Zeile, kein Fake-Gold |
| S368-3 | Korrektur-Satz | Parser oder Pending | „Nein, das war der Timer“ nach Miss → nächster Gold-Kandidat `timer`, nicht Groq-Fine-Tune |
| S368-4 | Parallel-Lesen Should | Ein bestehender Read-Agent (z. B. news Recover) | `Promise.all` zweier **Allowlist**-Fetches, **ein** fused Satz, Quellen genannt. Kein zweiter `runAgent` |
| S368-5 | Gold / TEST | `TEST-18.15.md` + Auto-Debug | 361–367 Sätze. `GOLD_EXPECT`-Keys = `TEST_PROMPTS`. tsc. Kein Diebstahl TV vs. Film |
| S368-6 | Docs | `66-agents-ist.md` nur Ist nach Execute | In diesem PLAN nicht umschreiben. Nach Execute: ein Agent/Zug, 63, Groq primär |

## Won’t

Gewichte trainieren. 0,5B ersetzen ohne Messung. Zweiter Director-Agent
im Zug. LLM-Organizer. e5 in Gold-Wahl. Merge anderer Draft-PRs.

## Abbruchkriterium

Korrektur ändert ONNX/GGUF. Oder Gold behauptet einen Agenten, den der
Parser nicht hat. Oder fused Read startet `tv` parallel.

## PO-Prüfung

1. Bekannter Miss → nach 368 in `test:prompts` grün, ohne Modell-Update.
2. „Nein, Timer“ nach falschem Wecker: nächster gleicher Satz trifft Timer **oder** ehrliche Nachfrage — dokumentiert.
3. Nachrichten: ein Satz, zwei Quellen, kein zweiter Agent in der Trace.
4. APK erst nach Execute; bis dahin Sideload `18.14.2`.
