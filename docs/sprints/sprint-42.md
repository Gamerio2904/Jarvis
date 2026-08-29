# Sprint 42 — Samsung TV Settings-UI

| Feld | Wert |
|------|------|
| Status | **PLANNED** |
| Priorität | **SHOULD** — koppelt ohne settings.json-Handarbeit |
| Ziel-Version | **`0.11.2`** |
| Quelle | PO: volle UI — suchen, koppeln, testen, umbenennen |

## Ziel

Settings-Sektion **Fernseher**: Scan im LAN, koppeln (Popup am TV), Test, Name, Host/MAC, Toggle. Schließt `0.11.x`.

## Must

| ID | Story | Done wenn |
|----|-------|-----------|
| U1 | **Suchen** — API + UI listet Tizen-Geräte (Port 8001/8002 / SSDP wo möglich) | PO wählt den Wohnzimmer-TV |
| U2 | **Koppeln** — Button startet Pairing; Hinweis „am TV erlauben“ | Token landet in `data/` |
| U3 | **Testen** — Status oder harmloser Key; Ergebnis in UI | PO sieht erreichbar ja/nein |
| U4 | **Umbenennen** — Display-Name (Default Wohnzimmer) | Chat bleibt ein Gerät |
| U5 | Toggle `tv_enabled` in derselben Sektion | Aus = keine Keys |
| U6 | Version `0.11.2` + API-Checks; Changelog-Abschluss `0.11` | Tag **`v0.11.2`** |

## Should

| ID | Inhalt |
|----|--------|
| U7 | MAC für WOL in UI sichtbar/editierbar |
| U8 | APK: dieselbe Settings-Sektion (Web-UI ist gewrappt) |

## Won’t

- Mehrere TVs
- Fire TV / Alexa
- App-Start auf dem Fernseher

## Exit / Abnahme

PO: suchen → koppeln → Test → „Fernseher an“ aus der APK oder dem Browser. Reihe `0.11` geschlossen.

## Danach

- `1.0.0` / TTS — **PO-Kommando** (nicht mehr = NAS)
