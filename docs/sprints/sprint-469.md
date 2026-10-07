# Sprint 469 — Routing-Formulierungen sicher erweitern

**Version:** `18.32.0` — **PLAN** Must  
**Plan:** [`../101-next.md`](../101-next.md)  
**Voraussetzung:** Sprint 468.

## Ziel

Zusätzliche natürliche Formulierungen und getrennte Prüfdaten entstehen
wiederholbar, ohne dass automatisch erfundene Labels als Wahrheit gelten.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S469-1 | Varianten erzeugen | Dataset-Tool | Varianten nur aus gelabelten Beispielen erstellen und ursprüngliches Label nachvollziehbar referenzieren |
| S469-2 | Varianten prüfen | Dataset-Validator | Widersprüche, Duplikate, zu ähnliche Eingaben und leere Texte kennzeichnen |
| S469-3 | Daten aufteilen | Dataset-Tool | Ähnliche Varianten gemeinsam einer Train- oder Prüfmengenfamilie zuordnen, nie auf beide Seiten verteilen |
| S469-4 | Trainingsformat ausgeben | Soup-Dataset-Export | Versioniertes Format exportieren, ohne Soup als App-Laufzeitabhängigkeit einzuführen |

## Abbruchkriterium

Wenn Datenlecks zwischen Train und Prüfung oder nicht prüfbare Labels erkannt
werden, wird kein Trainingsdatensatz freigegeben.
