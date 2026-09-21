# Sprint 329 — Prompt-Pakete neu schneiden

**Version:** `18.8.6` — **CODE** Must
**Plan:** [`79-next.md`](../79-next.md) §7
**Voraussetzung:** 323–328 soweit Must.

## Ziel

Alle Testprompts liegen in **sinnvollen Kategorien**, nicht in
Versions-Archiven (V2–V9, Alltag 8.34, Kaputt 6.50). Jede Gruppe gehört
zu einer Spur. Nichts verschwindet.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S329-1 | Katalog | `test-copy.ts` | Versionstitel mergen: V2/V3 → Einstellungen; V4 → Foto Notiz Dokument; V5/Recall → Gedächtnis; V6 → Fernseher; V7/V8 → PC; V9 → Randfälle; Screenshots zusammen; Welt/Bühne/Globus → Welt & Lage; Alltag 8.x → Alltag Extra. Unique-Texte behalten |
| S329-2 | Spuren | `probe-lanes.ts` | `LANE_TITLES` auf die neuen Titel. `unassignedCopyTitles()` leer |
| S329-3 | Probe | `PROBE_SOURCES` | 13 Packs mit Alltagsnamen, Memory-10 zuerst. Kein V1–V9 mehr |
| S329-4 | Tests | `test-014` `test-app-ui` `test-memory-10` `test-alltag` | Titel-Asserts auf die neuen Namen. Texte bleiben in `allTestCopyTexts` |
| S329-5 | Hilfe | `guards.ts` | „Probe V1–V9“ → Spur Probe |

## Won’t

- Storylines löschen. Debug-Lauf-Katalog leeren.
- Gold-Keys nur in REGRESS. 18.5 mitziehen.

## Abbruchkriterium

Ein bisheriger Copy-Text fehlt. Oder eine Gruppe hängt in keiner Spur.
Oder Probe hat nicht Memory-10 als erstes Pack.

## Manuell

Einstellungen → Tests: Spuren Heute bis Lauf, Kategorien ohne V2/V8/8.34.
Suche findet „Zahnarzt“ und „Watchliste“.
