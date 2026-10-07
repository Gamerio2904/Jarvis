# Sprint 481 — Natürlichkeit und Rückfall testen

**Version:** `18.35.0` — **PLAN** Must  
**Plan:** [`../101-next.md`](../101-next.md)  
**Voraussetzung:** Sprint 480.

## Ziel

Sprachantworten klingen in realistischen Beispielen verständlich und knapp,
ohne dass ein möglicher Modellvorschlag das Fakten- oder Aktionsverhalten
verändert.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S481-1 | Hörbare Goldfälle | Sprach-Eval | Bestätigungen, Listen, Termine, Fehler und Unsicherheit in kurzen und langen Fällen prüfen |
| S481-2 | Natürlichkeitsvergleich | Eval-Bericht | Bisherige Antwort mit möglicher Soup-Umformulierung anhand fester Kriterien vergleichen |
| S481-3 | Latenz messen | Android-Messung | Zusatzlatenz und Speicherbedarf auf Zielgeräten messen, keine Hardwarewerte annehmen |
| S481-4 | Rückfallpfad | Voice-/Chat-Tests | Bei Modellfehler, Zeitüberschreitung oder Faktenabweichung sicher zur bisherigen Antwort wechseln |

## Abbruchkriterium

Kein Modell wird zugeschaltet, wenn es die Antwort unnötig verzögert oder
Fakten-/Verständlichkeitstests verschlechtert.
