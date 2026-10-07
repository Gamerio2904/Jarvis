# Sprint 480 — Fakten beim Kürzen schützen

**Version:** `18.35.0` — **PLAN** Must  
**Plan:** [`../101-next.md`](../101-next.md)  
**Voraussetzung:** Sprint 479.

## Ziel

Eine gesprochene Kurzfassung verwendet nur bereits abgerufene Fakten und
verändert keine entscheidenden Angaben.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S480-1 | Unveränderliche Faktenfelder | Antwort-/Tool-Verträge | Namen, Zahlen, Datum/Uhrzeit, Status, Quelle und Unsicherheit vor Formulierung festhalten |
| S480-2 | Faktengebundene Kurzfassung | Voice-Antwortpfad | Nur vorhandene Fakten komprimieren; keine fehlenden Werte ergänzen |
| S480-3 | Faktenvergleich | Antworttests | Vor und nach Kürzung geschützte Inhalte maschinell vergleichen |
| S480-4 | Sichere Rückfallantwort | Fehlerpfade | Bei Abweichung Originalantwort sprechen oder gezielt nachfragen |

## Abbruchkriterium

Jede geänderte Zahl, Zeit, Person, Fälligkeit oder Quellenlage blockiert die
Kurzfassung für diesen Fall.
