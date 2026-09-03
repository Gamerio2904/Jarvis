# Sprint 185 — Alltag-Tore auf dem Gerät **PLAN** / PO

| Feld | Wert |
|------|------|
| Status | **PLAN** |
| Ziel-Version | Gerät gegen Sideload `9.10.0`; kein eigener Produkt-Bump |
| Quelle | [`55-next.md`](../55-next.md) · [`50-next.md`](../50-next.md) Tore `8.34` / `8.12` / `8.95` |
| Vorher | Parser-Härte **179** CODE. Router `8.0` CODE |

## Ziel

Was der Parser nicht beweisen kann: Mic/Wake hören, OSM-Blitzer mit Route, Preiswache nur mit Research, internes CarPlay.

## Must

Vier Phasen des Debug-Laufs. Ehrliche Leere wenn Overpass/Mic fehlt. Kein Live-Beamter.

## Won’t

Neue APIs. Apple CarPlay. Preise erfinden.

## DoD

- [ ] Gerät-Protokoll
- [ ] Parser-Regression bleibt grün
