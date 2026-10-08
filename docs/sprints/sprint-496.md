# Sprint 496 — Abhängigkeiten sichtbar und typisiert machen

**Version:** `18.39.0` — **CODE*** Must  
**Plan:** [`../103-next.md`](../103-next.md)  
**Voraussetzung:** 495.

## Ziel

Bestehende Sprintabhängigkeiten werden als verständliche, validierte
Beziehungen angezeigt und beim Freigeben eines Sprints berücksichtigt.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S496-1 | Relationstypen | `idea-plan.ts` | `depends_on`, `blocks` und `related` als eng begrenzte Typen einführen; bestehendes `haengt_an` verlustfrei migrieren. |
| S496-2 | Graphansicht | Workbench/PSP | Abhängigkeiten und Blockaden pro Sprint darstellen; keine freie Pfad- oder Skriptaktion. |
| S496-3 | Gate-Prüfung | Validator/Eval | Zyklen, unbekannte Ziele, Selbstbezug und Go trotz blockierender Vorgänger erkennen; konkrete Erklärung liefern. |

## Abbruchkriterium

Eine Migration ändert Relationsrichtung, ein Zyklus bleibt unentdeckt oder
eine ungeklärte Blockade wird als Go ausgegeben.
