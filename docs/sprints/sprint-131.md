# Sprint 131 — Globus-Briefing Leitentscheidung (`6.70`) **CODE** (Docs)

| Feld | Wert |
|------|------|
| Status | **CODE** (Docs; App bleibt `6.60.0`) |
| Priorität | nach Sideload `6.60`; vor LocateAnything-Gewichten |
| Ziel-Version | `6.70.0` |
| Quelle | PO: [DY7VsZItwtR](https://www.instagram.com/reel/DY7VsZItwtR/) Stadt→Satellit; [DZSsz-9t7aE](https://www.instagram.com/reel/DZSsz-9t7aE/) Nachrichten-Tour |
| Plan | [`48-next.md`](../48-next.md) |
| Baut auf | Kugel `5.0`/`6.20` CODE, GIBS, Gazetteer, `news`/`outlook`/`warn` |

## Ziel

Festschreiben: (1) `Zeig *Stadt*` zoomt **in NASA-GIBS** und brieft aus bestehenden Tools. (2) `Was ist heute so auf der Welt passiert` = Kugel, leuchtende Länder, Seite, Zoom-Kette aus Tagesschau/DW — **kein** Geheim-Feed. Kein App-Execute in diesem Sprint.

## Must

| ID | Inhalt |
|----|--------|
| L1 | Fly-to-Ziel über `GIBS_ZOOM_IN` |
| L2 | Briefing mergen, nicht neu erfinden |
| L3 | Märkte nur Hormus/OPEC/EZB-Kette |
| L4 | „Er sieht, ich plane“ = lokale Kalender/Memory |
| L5 | Welt-Tour: Glow, Seite, max 5 Stops, weltpolitisch-Filter |
| L6 | Won’t: Live, Street-View, Überwachung, Geheimquellen, Aktien-Orakel |

## Won’t (dieser Sprint)

App-Code. Sideload. Neue APIs ohne Research.
