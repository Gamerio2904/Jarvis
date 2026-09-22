# Sprint 337 — 18.9 härten

**Version:** `18.9.6` — **PLAN** Must
**Plan:** [`80-next.md`](../80-next.md)
**Voraussetzung:** 331–336 soweit Must.

## Ziel

Eine Probe über Recover-Ansage, Caps, Write-Schutz und Gold. Kein neues
Feature. Sideload bleibt `18.8.3`, bis ein APK-Execute kommt.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S337-1 | Gold + Auto-Debug | Tests `test-copy.ts` | Neue **eigenständige** Recover-Sätze nur wenn sie ohne Mock routen. In **bestehende** der 13 Probe-Spuren, kein 14. Pack. Keys = `TEST_PROMPTS` = `GOLD_EXPECT`. `unassignedCopyTitles()` leer. Mock-Pfad bleibt `test-recover.mjs` |
| S337-2 | Konflikte | Parser | Recover stiehlt nicht Kalender-Frist oder Timer. `in 10 Minuten Milch` bleibt reminder |
| S337-3 | Budget | Bus | p95-Idle unverändert. Recover-Cap 2. Write 1 Lauf |
| S337-4 | Copy | CHANGELOG 80 | Recover ≠ freies Web. 18.5 unberührt |
| S337-5 | PO | [`TEST-18.9.md`](../TEST-18.9.md) | Gerät nach Execute |
| S337-6 | Docs | `42` `09` `apk` | Erst wenn Execute; PLAN-Index darf 80 schon listen |

## Won’t

- 18.5 mitziehen. Gold-Keys ohne TEST_PROMPT.

## Abbruchkriterium

Probe aus [`80-next.md`](../80-next.md) §6 fällt. Oder Gold-Keys ≠ TEST_PROMPTS.

## Manuell

Siehe Plan §6.
