# Sprint 491 — Fernflächen versioniert erweitern

**Version:** `18.38.0` — **PLAN** Must  
**Plan:** [`../102-next.md`](../102-next.md)  
**Voraussetzung:** 18.37.0 sicher freigegeben.

## Ziel

Das bestehende Zwei-Fenster-Protokoll kann Planungs- und Sprintansichten anhand
einer expliziten Geräte- und Projektangabe sicher routen.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S491-1 | Oberflächen | `fenster-parse.ts` `fenster.ts` | Vorhandene Allowlist um Planung/Sprints erweitern; kein freier Pfad und keine beliebige Aktion. |
| S491-2 | Projektbezug | `idea.ts` `Workbench.tsx` | Validierte Projekt-ID und Planrevision gezielt übergeben; keine Chat-Historie oder fremde Projektdaten mitsenden. |
| S491-3 | Bestätigung | `fenster-net.ts` `FensterSheet.tsx` | Ziel bestätigt authentisierte Request-ID, Version und Revision; Rückmeldung erst nach sichtbarem Öffnen. |

## Abbruchkriterium

Unbekannte Oberfläche, Projekt-ID, Version oder abgelaufener Befehl wird
ausgeführt oder als Erfolg gemeldet.
