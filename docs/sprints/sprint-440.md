# Sprint 440 — Homescreen-Shortcut Todos

**Version:** `18.27.0` — **PLAN** Must  
**Plan:** [`../99-next.md`](../99-next.md)  
**Voraussetzung:** Sprint 438.

## Ziel

Eine `Todos`-Kachel öffnet dieselbe Todo-Listenfläche wie die Sprachsteuerung.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S440-1 | Home-App-ID und Kachel | `engine/home-apps.ts` | `todos`-Shortcut mit klarer Beschriftung |
| S440-2 | Icon | `ui/HomeScreen.tsx` | Aufgaben-Icon ergänzt bestehende App-Glyphs |
| S440-3 | Overlay-Routing | `App.tsx` | Shortcut öffnet/schließt Todo-Fläche, ohne Einkaufs-/Notizfläche zu ersetzen |
| S440-4 | Launcher-Gold | UI-Test | Kachel im Homescreen und direktes Öffnen prüfen |

## Abbruchkriterium

Der Shortcut darf nicht auf Einkauf, Notizen oder Einstellungen routen.
