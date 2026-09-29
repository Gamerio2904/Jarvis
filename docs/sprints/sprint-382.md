# Sprint 382 — Homescreen-Raster

**Version:** `18.18.0` — **CODE** Must
**Plan:** [`90-next.md`](../90-next.md)
**Voraussetzung:** main `18.17.0`.

## Ziel

APK öffnen zeigt App-Icons. Chat ist eine Kachel, nicht die erste Fläche.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S382-1 | Raster | `home.ts` `HomeScreen.tsx` `App.tsx` | Neun Kacheln, Kugel ≠ Lage, Overlay = Fahrmodus, Gehirn = Settings Hirn |
| S382-2 | Dock | `NavIsland.tsx` `ui-action.ts` | `home` zuerst. `Zeig Homescreen` → `dock.go` |
| S382-3 | Version | `store.ts` | App-Code `18.18.0` |

## Won’t

Fremde Apps. Android-Widget-Host.

## PO-Prüfung

Hilfe nennt **18.18.0**. Nach Öffnen: Uhr und Icons, nicht die Chat-Leiste.
