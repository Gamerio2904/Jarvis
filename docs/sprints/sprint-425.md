# Sprint 425 — Modell füllt Varianten

**Version:** `18.25.0` — **CODE** Must
**Plan:** [`97-next.md`](../97-next.md) §1 §6
**Voraussetzung:** 424. Der Parser kennt `Entwirf`.

## Ziel

Ein Aufruf füllt bis zu drei Varianten aus festen Bausteinen.
Ungültiges fällt weg. Leerer Text bleibt ehrlich.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S425-1 | Füllung | `entwurf-fill.ts` | Ein Aufruf. Eingabe: Arbeitstext und die sechs Art-Namen. Ausgabe: Titel, bis zu drei Varianten, jede höchstens sechs Bausteine `art` und `zeile`. Zeile auf 42 Zeichen. Art außerhalb der Tabelle weg. Variante ohne Baustein weg. Über drei Varianten fällt der Rest weg |
| S425-2 | Zeile | `store.ts` | Gültige Füllung schreibt eine Zeile, Status `offen`, `pick` leer. Die vorige offene Zeile wird `zu`. Keine Idee, kein Ablauf, kein Portfolio |
| S425-3 | Leere | `entwurf-fill.ts` | Keine gültige Variante: keine Zeile, Antwort `Kein Entwurf. Der Text nennt keine Fläche.` Groq und der 0,5B-Fallback benutzen dieselben Felder |

## Won't

Rahmen, CSS aus dem Modell, ReactBits, eine laufende Liste.

## Abbruchkriterium

Der Entwurf zeigt einen Termin, den der Text nicht nennt, oder eine siebte Art.
