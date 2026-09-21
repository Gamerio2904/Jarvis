# Sprint 328 — 18.8 härten

**Version:** `18.8.5` — **CODE** Must
**Plan:** [`79-next.md`](../79-next.md)
**Voraussetzung:** 323–327 soweit Must.

## Ziel

Eine Probe über Rollback, Download und Termin-Fristen. Kein neues
Feature. Sideload **`18.8.0`** (versionCode `180800`).

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S328-1 | Gold | Tests | Sätze aus [`79-next.md`](../79-next.md) §4. `GOLD_EXPECT`-Keys = `TEST_PROMPTS`. Neue Keys in **GOLD_EXPECT**, nicht nur REGRESS. `TEST_COPY_GROUPS`-Titel unverändert. `PROBE_COPY_GROUPS`.length 13. `unassignedCopyTitles()` leer |
| S328-2 | Konflikte | Parser | `in 10 Minuten Milch` bleibt reminder. Offset-Parser nur nach Kalender-Pending oder mit „davor“. `Termin absagen` bleibt delete, keine Frage |
| S328-3 | Budget | Notify | ≤5 Offsets. Restore cancelt nur Lauf-IDs. p95-Idle unverändert |
| S328-4 | Copy | CHANGELOG 79 | Rollback ≠ Hausstand-Wipe. Download am Dock. Sideload `18.8.0` |
| S328-5 | PO | [`TEST-18.8.md`](../TEST-18.8.md) | Gerät 18.8.0 |
| S328-6 | Docs | `42`, `09`, `apk` | Erst wenn Execute; dieser Sprint-Doc ändert sie nicht vorab (PLAN-Index darf 79 schon listen) |

## Won’t

- 18.5 mitziehen.
- Cloud-Kalender. Titel-Schnitt liegt in 329, nicht hier zurückdrehen.

## Abbruchkriterium

Probe aus [`79-next.md`](../79-next.md) §6 fällt (Timer bleibt nach
Lauf, Dock ohne Download, Termin ohne Frage, Gold-Keys ≠ TEST_PROMPTS,
PROBE ≠ 13).

## Manuell

Siehe Plan §6.
