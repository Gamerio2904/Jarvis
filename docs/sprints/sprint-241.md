# Sprint 241 — Lage Phase-2 Härtung

**Version:** `15.3.0`  
**Plan:** [`64-next.md`](../64-next.md) §3

## Ziel

Kacheln/Lage Phase-2 flüssig: lazy Load, Body idle rAF, Kugel auto-lite.

## Lieferumfang

| ID | Task | Status |
|----|------|--------|
| S241-1 | `fetchHudModule()` + `LazyHudCell` IntersectionObserver | CODE |
| S241-2 | `BodySchema` kick/idle rAF | CODE |
| S241-3 | `GlobeView` p95>16ms → lite; `globe_webgl` force lite | CODE |
| S241-4 | Kürzere Lage-Hints | CODE |

## Settings

- `globe_webgl: false` — erzwingt Lite-Pfad (Ring step 12, weniger Labels)

## Nicht in 241

- Echtes WebGL — Sprint 242 optional
