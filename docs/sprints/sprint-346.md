# Sprint 346 — Koch härten, Copy, Tests

**Version:** `18.11.4` — **CODE** Must
**Plan:** [`84-next.md`](../84-next.md)
**Voraussetzung:** 342–345.

## Ziel

Gold, Sweep und Copy trennen Koch, Lebensmittel und Recherche.
Kein stilles Rezept, kein offenes Quellen-`details`. Meilenstein `18.11`.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S346-1 | Copy | `test-copy.ts` | Nutella → food; Carbonara suchen → research; Foto-Rezept → cook; merke Gewürze → cook/memory Pin |
| S346-2 | Gold | corpus / TEST_PROMPTS | Keys = Copy-Gruppen; kein 14. Probe-Pack erfinden wenn 13 bleiben soll |
| S346-3 | Sweep | `AGENT_SWEEP` | 64. Satz liegt, Prompt-Slice nicht leer |
| S346-4 | GUI | `gui-cook` o. ä. | Quellen zu; Confirm ohne Ja kein Rezept; Wiki-Carbonara ohne erfundene Minuten |
| S346-5 | Docs | CHANGELOG `09` TEST-18.11 apk-Zeile | Version `18.11.4`, nicht 18.5 |

## Won’t

Neuen Organizer. Probe-Pack 14 nur für Koch. 18.10-APK als 18.11 ausgeben.

## Abbruchkriterium

Gold-Keys ≠ TEST_PROMPTS. Oder Carbonara-Suche landet auf cook ohne Bild.

## Manuell

[`TEST-18.11.md`](../TEST-18.11.md) einmal durch. Sideload erst nach
Execute, nicht in diesem PLAN-Zug.
