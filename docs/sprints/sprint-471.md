# Sprint 471 — Planungswunsch auf Planfelder abbilden

**Version:** `18.33.0` — **PLAN** Must  
**Plan:** [`../101-next.md`](../101-next.md)  
**Voraussetzung:** `18.32.0` Gate bestanden.

## Ziel

Natürliche Planungswünsche werden als kontrollierter Vorschlag den
vorhandenen IdeaPlan-Feldern zugeordnet; der Originalwunsch bleibt erhalten.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S471-1 | Eingaben inventarisieren | Idea-/IdeaPlan-Flows und Tests | Aktuelle Felder, Grenzen und Planungswege verifizieren |
| S471-2 | Übersetzungsbeispiele | Planungs-Goldfälle | Wünsche mit geprüften Anforderungen, offenen Fragen und Struktur abbilden |
| S471-3 | Strukturvorschlag begrenzen | Plan-Parser/Validator | Unbekannte Felder, fehlende IDs und nicht belegte Annahmen ablehnen oder als offen kennzeichnen |
| S471-4 | Original und Vorschlag trennen | Planungszustand | Ursprünglichen Satz unverändert erhalten und erzeugte Inhalte bis zur Prüfung als Vorschlag ausweisen |

## Abbruchkriterium

Wenn die Übersetzung Bedingung oder Rahmenpunkte verliert oder fehlende
Anforderungen erfindet, wird der Vorschlag nicht gespeichert.
