# Sprint 493 — Geräteziele und Wiederverbindung härten

**Version:** `18.38.0` — **CODE\*** Must  
**Plan:** [`../102-next.md`](../102-next.md)  
**Voraussetzung:** 492.

**Ist im Arbeitsbaum:** Konflikt- und Versionsabweichungen werden in
`fenster-net.ts` und `tablet-sync.ts` als klare Fehlermeldung nach außen
gemeldet; Erfolg wird nicht mehr behauptet, wenn Version oder Konfliktstatus
dagegen sprechen. Die vollständige Geräteziel-Härtung und reale
Wiederverbindungs-Goldtests bleiben offen.

## Ziel

Befehle öffnen nur angeforderte, erlaubte Flächen auf dem bestätigten Gerät;
Verbindungsabbrüche bleiben sichtbar und sicher.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S493-1 | Zielauflösung | `fenster-parse.ts` `chat.ts` | `Handy`/`Tablet` eindeutig auswerten; unklare oder nicht gekoppelte Ziele nicht raten. |
| S493-2 | Transportfehler | `fenster-net.ts` | WLAN-Verlust, veraltete Request-ID, fehlende App und Permission-Fehler mit ehrlicher Fehlermeldung; kein falsches „geöffnet“. |
| S493-3 | Flächenausbau | Bestehende Oberflächen-Allowlist | Bereits unterstützte Start-, Lage-, Chat-, Kalender- und Medienflächen auf bestehendem Protokoll testen; keine neuen Fernrechte außerhalb Allowlist. |

## Abbruchkriterium

Ein nicht bestätigtes Zielgerät wird gesteuert, oder Fehler werden als
erfolgreiches Öffnen dargestellt.
