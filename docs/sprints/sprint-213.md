# Sprint 213 — PC-Viewer (`12.40.0`) **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** Must |
| Ziel-Version | **`12.40.0`** |
| Quelle | [`59-next.md`](../59-next.md) · [`desktop/README.md`](../../desktop/README.md) |
| Vorher | 212 Presence |

## Ziel

Am Rechner ein **Fenster** (Browser oder BAT-Tab): Verlauf lesen, Zeile senden. Werkzeug :18790 bleibt getrennt.

## Must

| ID | Inhalt |
|----|--------|
| V1 | BAT: Knopf „Jarvis-Fenster“ öffnet `http://HANDY:18791/` oder lokale HTML die Presence nutzt |
| V2 | Ohne Hirn: „Handy nicht im WLAN / Presence aus“ — kein Fake-Smalltalk |
| V3 | Werkzeug-Status (Screenshot/Klick) unverändert |
| V4 | Kein zweites Gedächtnis auf Disk |

## Won’t

Electron. Python. WebRTC-Must. Film-TTS.

## DoD

- [x] README: zwei Schichten (Werkzeug vs Fenster) in einer Tabelle
- [x] F5: ohne BAT/Hirn ehrlich tot
