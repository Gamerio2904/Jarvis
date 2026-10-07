# Sprint 479 — Sprach- und Chat-Antwort trennen

**Version:** `18.35.0` — **PLAN** Must  
**Plan:** [`../101-next.md`](../101-next.md)  
**Voraussetzung:** `18.34.0` Gate bestanden.

## Ziel

Ultron kann für Sprache knapper antworten, ohne die ausführliche Chat-Antwort
oder den Zugriff auf vollständige Listen und Details zu verlieren.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S479-1 | Antwortflächen inventarisieren | Chat-/TTS-Pfade | Ermitteln, wo Text gezeigt, gesprochen und gekürzt wird |
| S479-2 | Kürzungsregeln | Antwort-Goldfälle | Kurze Sprache für Listen, Termine, Todos und einfache Bestätigungen definieren |
| S479-3 | Vollständige Information erhalten | UI/Antwortverträge | Details und lange Listen über die Chatansicht zugänglich halten |
| S479-4 | Unsichere Antworten nicht verkürzen | Antwortregeln | Bei Unsicherheit, Warnung oder nötiger Erklärung nicht irreführend kürzen |

## Abbruchkriterium

Wenn Nutzer für Verständnis notwendige Details nicht mehr erhalten können,
wird die Kurzantwort nicht verwendet.
