# Sprint 452 — Lokales Wissen sauber zuordnen

**Version:** `18.29.0` — **PLAN** Must  
**Plan:** [`../100-next.md`](../100-next.md)  
**Voraussetzung:** Sprint 450.

## Ziel

Planung nutzt verfügbare lokale Projekt-/Gedächtnisquellen zuerst und trennt
belegte Fakten von Annahmen und fehlendem Wissen.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S452-1 | Bestehende Retrievalpfade inventarisieren | `engine/retrieve.ts`, `engine/idea.ts` | Vorhandene Retrieve-/Knowledge-Pack-Funktionen wiederverwenden |
| S452-2 | Treffer dem Projekt zuordnen | `engine/idea-plan.ts`, `engine/store.ts` | Quelle, Treffertext und Projektverknüpfung stabil speichern |
| S452-3 | Lücken statt Halluzinationen | `engine/idea.ts`, `engine/project-docs.ts` | Kein Beleg ergibt offene Lücke, keinen erfundenen Fakt |
| S452-4 | Datenschutztests | `scripts/test-idea-plan.mjs` | Keine Notiz-/Gesamthistorie ungefragt an Cloud oder Memory senden |

## Abbruchkriterium

Keinen zweiten Vektorspeicher anlegen und keine fremden persönlichen Daten
automatisch in Projektwissen kopieren.
