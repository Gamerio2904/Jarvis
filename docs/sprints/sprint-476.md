# Sprint 476 — Eindeutigen Kontext prüfen

**Version:** `18.34.0` — **PLAN** Must  
**Plan:** [`../101-next.md`](../101-next.md)  
**Voraussetzung:** Sprint 475.

## Ziel

Bevor Ultron nachfragt, darf er passende Angaben aus dem aktuellen Gespräch
oder einem ausdrücklich passenden lokalen Kontext verwenden — aber nicht
raten.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S476-1 | Kontextquellen begrenzen | Pending-/Gesprächslogik | Aktuelle Äußerung und passenden Gesprächskontext zuerst berücksichtigen |
| S476-2 | Lokalen Recall abgrenzen | Notiz-/Gedächtniszugriff | Persistente Information nur nutzen, wenn Nutzerabsicht und eindeutiger Treffer passen |
| S476-3 | Mehrdeutigkeit erkennen | Recall-Tests | Mehrere mögliche Inhalte führen zu einer Rückfrage, nicht zur willkürlichen Auswahl |
| S476-4 | Provenienz anzeigen | Antwort/Tool-Ergebnis | Bei aus vorhandenem Kontext ergänzten Angaben erkennbar machen, woher sie stammen |

## Abbruchkriterium

Kein globales oder fremdes Wissen, keine externe Recherche und kein
Gedächtnis-Write allein zur Vervollständigung eines unklaren Befehls.
