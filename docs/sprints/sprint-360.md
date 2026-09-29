# Sprint 360 — Poll, OAuth optional, Härten

**Version:** `18.14.0` — **CODE** Must (OAuth Should)
**Plan:** [`86-next.md`](../86-next.md)
**Voraussetzung:** 356–359.

## Ziel

Solange Flugzeuge an sind und die Lage offen ist, kommt alle
≥ 10 s ein neuer OpenSky-Stand. Tests und ehrliche Limits sitzen.
Optional mehr Credits per eigenem OpenSky-Client.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S360-1 | Poll | Lage / `globe-layers.ts` | Schicht `overhead` + Sicht sichtbar: `dropLayerCache('overhead')` + Fetch, Intervall **≥ 10 s**. Tab/Lage zu → Timer aus. Start der Lage ohne Satz: **kein** Fetch |
| S360-2 | Overhead-TTL | Cache | Nicht 10 min für Flugzeuge, solange Poll läuft. Andere Schichten bleiben 10 min |
| S360-3 | OAuth Should | Settings + Fetch | `opensky_client_id` / `secret` optional. Token 30 min. Leer = anonym. Kein Secret in der APK |
| S360-4 | Credits | Intel / 429 | Header `X-Rate-Limit-Remaining` darf in der Leiste stehen. 429 stoppt den Poll bis Retry-After |
| S360-5 | Gold | `TEST-18.14.md` + Auto-Debug | Sätze „Zeig Flugzeuge“, „Was fliegt da“, „Schicht aus“, „Zeig Satelliten“. Kein Diebstahl von `flights` vs Schicht-Phrase wie heute |
| S360-6 | tsc / Tests | `npx tsc --noEmit -p frontend` | ageLine, BBox, Heading, Pin-frisch/alt, kein „Live“-String in Globe-Antworten |

## Won’t

Poll ohne Nutzersatz beim Lage-Start. Poll < 10 s. Welt-Query wenn
Credits knapp. Interpolation. „Live“. Neuer Agent.

## Abbruchkriterium

Lage-Start hämmert OpenSky. Oder Poll läuft im Hintergrund-Tab weiter.
Oder OAuth-Secret liegt im Repo.

## PO-Prüfung

1. „Zeig Flugzeuge“: Silhouetten, Quelle OpenSky, Alter in Sekunden, kein „Live“.
2. Standort: Stecknadel; nach 15 min „letzter Stand“, nicht weg.
3. „Zeig Satelliten“: Körper+Paneele, ISS erkennbar, keine Starlink-Wolke.
4. OpenSky tot / 429: Satz, leere Kugel, keine erfundenen Flieger.
5. APK ohne Cesium / `globe.gl` / weltweites ADS-B.
