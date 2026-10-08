# Sprint 485 — Versionshandshake erzwingen

**Version:** `18.36.0` — **CODE\*** Must  
**Plan:** [`../102-next.md`](../102-next.md)  
**Voraussetzung:** 484.

**Ist im Arbeitsbaum:** Hausstand-Übertragungen prüfen App-Version und
Protokoll 3. Die Fenster-Steuerung trägt jetzt ebenfalls `proto` und
`appVersion`; eingehende Nachrichten mit Versionsabweichung werden vor
`anfrage`/`zeig` abgewiesen und als Status gemeldet. Ein nativer TLS-
Handshake für Fenster sowie Geräte-Goldtests und das Release-Gate bleiben offen.

## Ziel

Nur Geräte derselben App-Version und eines unterstützten Protokolls dürfen
Hausstand synchronisieren oder Oberflächen steuern.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S485-1 | Handshake | Native Haus-/Fenster-Protokolle | Vor Nutzdaten App-Version, Protokollversion, stabile Geräte-ID und Revision austauschen. |
| S485-2 | Sperre | `tablet-sync.ts` `fenster.ts` | Mismatch blockiert Transfer und `zeig`; Status nennt beide Versionen und verlangt manuelles Update. |
| S485-3 | Tests | `test-tablet-sync.mjs` `test-fenster.mjs` | Gleiche Version funktioniert; ältere/neue App, inkompatibles Schema und manipulierte Version werden vor Datenzugriff abgelehnt. |

## Abbruchkriterium

Ein mismatched Gerät kann Hausstanddaten lesen/schreiben oder eine Fläche
öffnen.
