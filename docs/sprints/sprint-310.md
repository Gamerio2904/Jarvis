# Sprint 310 — Kugel: Geo und Cyber

**Version:** `18.6.3` — **CODE** Must
**Plan:** [`77-next.md`](../77-next.md)
**Voraussetzung:** 307.

## Ziel

Konflikte und Welt-Ereignisse als **wenige** Pins. Cyber nur geolocated
Blocklist-Hosts, keine Angriffs-Story.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S310-1 | `conflicts` | `globe-layers.ts` | Öffentlicher Konflikt-Feed. Max 40. Kein Feed → ehrlich, Sprint nicht rot wenn 310-3 grün |
| S310-2 | Frontlinien | `globe-fronts.ts` + `GlobeView` | Wenige Polylinien. Lite: aus, nur Pins. Nicht Millionenpunkte |
| S310-3 | `events` | GDELT public | Stark filtern (Relevanz/Zahl), max 40, Land-Anker ok |
| S310-4 | `cyber` | abuse.ch URLhaus/Feodo public | Geolocated, max 40. Copy: Blocklist, **kein** „wir sehen den Angriff“ |
| S310-5 | Parser | | `Zeig Konflikte`, `Frontlinien`, `Welt-Ereignisse`, `Cyber auf der Karte` |

## Won’t

- ACLED-Key in der APK. Dark-Web. Orakel „eskaliiert morgen“.
- Scanner, Sweep, C2 anfassen.

## Abbruchkriterium

Copy behauptet Live-Kampfgeschehen ohne Quelle. Oder Front-GeoJSON sprengt Framezeit.

## Manuell

`Zeig Konflikte` → Pins + Quelle. Lite ohne Linien.
`Cyber auf der Karte` → Hosts, Satz „Blocklist, Stand …“.
