# Sprint 486 — Sicherheits-Gate 18.36

**Version:** `18.36.0` — **PLAN** Must  
**Plan:** [`../102-next.md`](../102-next.md)  
**Voraussetzung:** 483–485.

## Ziel

Serverstart, Pairing, TLS und Versionssperre bestehen den Geräte- und
Angriffspfad-Test, bevor das erste 18.36-Release freigegeben wird.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S486-1 | LAN-Angriffsproben | Native Protokolltests | Fremder Peer, Replay, abgelaufenes Pairing, falsches Zertifikat, falsches Token und WAN-Adresse werden abgewiesen. |
| S486-2 | Geräteabnahme | Android Handy + Tablet | Eine Pairing-Bestätigung, getrennte Scope-Rechte, Serverbenachrichtigung, Stop, WLAN-Wechsel und Versionsmismatch real testen. |
| S486-3 | Freigabe | Release/Testanleitung | Build-Version erst nach bestandenen Tests setzen; keine Geheimnisse in Diagnose oder Export. |

## Abbruchkriterium

Jeder nicht authentisierte Zugriff, Klartext-Secret oder falsche
Erfolgsmeldung. Version `18.36.0` bleibt gesperrt.
