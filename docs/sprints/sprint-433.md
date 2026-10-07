# Sprint 433 — Homescreen-Shortcut Notizen

**Version:** `18.26.0` — **PLAN** Must  
**Plan:** [`../98-next.md`](../98-next.md)  
**Voraussetzung:** Sprint 432.

## Ziel

Die Notizen sind als klar beschriftete App-Kachel vom bestehenden Homescreen
aus direkt erreichbar.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S433-1 | Home-App-ID und Kachel | `engine/home-apps.ts` | Neues `notes`-Ziel und verständliche Beschriftung |
| S433-2 | Icon | `ui/HomeScreen.tsx` | Eigenes Notizsymbol; bestehende Kacheln unverändert |
| S433-3 | App-Routing | `App.tsx` | Shortcut öffnet Notes-Overlay; schließen kehrt sauber zurück |
| S433-4 | Launcher-Gold | `scripts/test-app-ui.mjs` | Notes-Kachel und Öffnungsziel prüfen |

## Abbruchkriterium

Der Shortcut darf weder auf Einkauf noch Einstellungen routen oder den
Homescreen hinter einem nicht schließbaren Overlay lassen.
