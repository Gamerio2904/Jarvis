# Sprint 331 — Recover-Kern

**Version:** `18.9.0` — **CODE** Must
**Plan:** [`80-next.md`](../80-next.md)
**Voraussetzung:** `18.8.4` auf main. Kein 18.5.

## Ziel

Nach einem Read-Fail sagt Jarvis, **was** nicht ging, und startet den
nächsten erlaubten Schritt. Höchstens zwei Alternativen. Write/Device
bleiben bei einem Lauf.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S331-1 | Typen | `recover.ts` | `RecoverStep { id, label, run }`. `RecoverPlan { agent, steps }` max 2 steps nach dem ersten Fail |
| S331-2 | Ansage | `recover.ts` `announceSwitch` | Deutsch: „{quelle} geht nicht. Ich versuche {nächste}.“ Kein Erfolgston |
| S331-3 | Director | `director.ts` | Nach `failed` Read: Plan fahren, Ansagen in die Reply ketten, dann Ergebnis oder `failureReply` |
| S331-4 | Ctx | `route-types.ts` `working-memory.ts` | `last_failed_tool` + `noteFail` in `RouteCtx`. Prior senkt denselben Agenten nicht ins Plaudern |
| S331-5 | Cap | Tests | 3. Fail stoppt. Write-Agent ohne Recover-Plan. `dispatchAttempts` Read bleibt 2 (Bus) plus Registry extra, nicht endlos |

## Won’t

- LLM wählt die URL. Freies Web. Write-Zweitlauf.

## Abbruchkriterium

Ein Write (Kalender) läuft zweimal. Oder Ansage fehlt, obwohl umgeschaltet wurde.

## Manuell

News-Mock 503, dann `Nachrichten`. Satz enthält „geht nicht“ und eine zweite Methode oder Absage.
