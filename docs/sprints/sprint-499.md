# Sprint 499 — Planherkunft und Annahmen nachweisen

**Version:** `18.40.0` — **CODE*** Must  
**Plan:** [`../103-next.md`](../103-next.md)  
**Voraussetzung:** 495.

## Ziel

Nutzer erkennen, welche Planinhalte manuell bestätigt, aus einer lokalen
Quelle übernommen, recherchiert oder noch Hypothese sind.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S499-1 | Provenienzfelder | `idea-plan.ts` | Herkunft und Bestätigungsstatus gezielt an Anforderungen/Entscheidungen binden; vorhandene `PlanEvidence` konsistent weiterverwenden. |
| S499-2 | Belegansicht | Workbench/Quellen | Quelle, URL, Abrufzeit und Bezug anzeigen; fehlende oder ungültige Quellen sichtbar lassen. |
| S499-3 | Vorschlagsprüfung | Planungsablauf | KI-Änderungen als unbestätigt markieren und erst nach expliziter Übernahme in den gültigen Plan schreiben. |

## Abbruchkriterium

Eine Hypothese wird als bestätigte Tatsache dargestellt oder ein Planvorschlag
verändert gespeicherte Daten ohne Zustimmung.
