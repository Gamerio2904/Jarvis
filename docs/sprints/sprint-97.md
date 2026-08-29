# Sprint 97 — Filme IMDb/RT + Rabatt-Suche (`1.44.0`)

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Priorität | **MUST** |
| Ziel-Version | **`1.44.0`** |
| Quelle | PO: Rotten Tomatoes + IMDb, wo Filme gratis laufen, Rabatt-Suche beim Shopping aktivierbar |
| Voraussetzung | `1.43.0` |
| Plan | [`28-next.md`](../28-next.md) |

## Ziel

Bestehende Film- und Produktsuche erweitern. Noten nur aus OMDb. Kostenlose Streams nur aus JustWatch DE. Rabatt-Suche extra, Default aus, keine erfundenen Codes.

## Must

| ID | Inhalt | Done wenn |
|----|--------|-----------|
| F1 | IMDb/RT-Noten über OMDb (`tomatoes=true`) | Ohne Key keine erfundenen % |
| F2 | `Wo läuft … kostenlos` listet JustWatch-Free/Ads in DE | Joyn/ARD nennen, nicht starten |
| F3 | `Spiel … Film` bleibt TV-Start | Parser-Konflikt vermieden |
| F4 | Rabatt-Suche Toggle + Stimme `Rabatt-Suche an` | Default aus; Research nötig |
| F5 | Version `1.44.0` Sideload | versionCode 14400 |

## Probe

`Wo läuft Dune kostenlos`. `Wie gut ist Dune`. `IMDb Dune`. Ohne OMDb-Key: nach Key fragen, wo-gratis trotzdem. `Spiel Dune Film` weiter TV. `Rabatt-Suche an` plus Produktsuche mit Research.

## Won’t

Rotten-Tomatoes scrapen, Joyn/ARD als TV-Apps, erfundene Gutscheincodes, neue Produktfamilie.
