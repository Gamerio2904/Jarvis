# Sprint 475 — Pflichtangaben pro Aktion festlegen

**Version:** `18.34.0` — **PLAN** Must  
**Plan:** [`../101-next.md`](../101-next.md)  
**Voraussetzung:** `18.33.0` Gate bestanden.

## Ziel

Ultron kann unterscheiden, welche Angaben eine Aktion zwingend braucht und
welche Angaben optional sind, bevor er sie ausführt.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S475-1 | Aktionsfelder inventarisieren | Tool-/Intent-Verträge | Pflicht- und optionale Angaben für Erinnerungen und ausgewählte Alltagsaktionen dokumentieren |
| S475-2 | Erinnerungssätze abdecken | Reminder-Goldfälle | „Erinnere mich daran“ ohne Inhalt sowie fehlende Zeit/Bezug als getrennte Fälle testen |
| S475-3 | Fehlfeld explizit machen | Parser-/Pending-Vertrag | Fehlende Pflichtangabe benennen; keine stillen Standardwerte oder erfundenen Inhalte einsetzen |
| S475-4 | Risiko priorisieren | Aktions-Gates | Bei Aktionen mit realen Folgen alle nötigen Angaben vor Ausführung verlangen |

## Abbruchkriterium

Eine Aktion ohne eindeutige Pflichtfeld-Regel darf nicht durch ein Modell
automatisch ausgeführt werden.
