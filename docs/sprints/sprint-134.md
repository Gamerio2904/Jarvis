# Sprint 134 — Welt-Tour: Glow, Seite, Zoom (`6.82`) **PLAN**

| Feld | Wert |
|------|------|
| Status | **PLAN** |
| Priorität | nach Fly-to `6.80` |
| Ziel-Version | `6.82.0` |
| Quelle | [`48-next.md`](../48-next.md) · Reel [DZSsz-9t7aE](https://www.instagram.com/reel/DZSsz-9t7aE/) |
| Baut auf | `outlook.ts` world, `GlobeView` Fly-to, Lage-Textkachel, Sprint 133 Zoom |

## Ziel

`Was ist heute so auf der Welt passiert` öffnet die Kugel. Überblick im Chat. Weltpolitische Länder **leuchten**. Seite: Meldung + Kurz-Erklärung (zitiert). Nacheinander Zoom auf das Land. Max 5. Quellen Tagesschau/DW. Stopp bricht ab.

## Must

| ID | Inhalt |
|----|--------|
| T1 | Parser-Phrasen inkl. `heute so auf der Welt passiert` → `outlook` world + Tour |
| T2 | Filter Allowlist-Land / outlook-Tag; Sport/Wetter/Regional raus |
| T3 | Glow + Label am Centroid, alle Stops sichtbar, aktiver Stop stärker |
| T4 | Seite und TTS pro Stop: Land, Titel, Quelle, 1–2 Sätze |
| T5 | Zoom-Kette mit Pause; Reduced-Motion = Liste ohne Flug |
| T6 | Leer = ehrlich keine weltpolitische Lage |
| T7 | `Zeig mir die Nachrichten` bleibt `news` |
| T8 | Gold 9–11 aus [`48-next.md`](../48-next.md) |

## Won’t

Geheim-Feed. 190 Staaten. Polygon-Pflicht (nur wenn 132 GO). Sideload. Stadt-Anomalien (135).
