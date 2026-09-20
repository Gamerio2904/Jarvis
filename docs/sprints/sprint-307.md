# Sprint 307 — Kugel: Layer-Registry

**Version:** `18.6.0` — **PLAN** Must
**Plan:** [`77-next.md`](../77-next.md)
**Voraussetzung:** Sideload `18.4.4`. Kein `globe.gl`.

## Ziel

Eine Schicht-API, in die 308–310 Feeds hängen — ohne drei neue `if` in
`hud.ts`. Bestehende `quakes` / `fires` / `overhead` laufen darüber und
bleiben verdrahtet.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S307-1 | Typ | `globe-layers.ts` `store.ts` `settings-schema.ts` | `GlobeLayer` erweiterbar. Leer = aus. Alte drei Ids unverändert |
| S307-2 | Registry | `globe-layers.ts` | `fetchLayer(id)`, `replyFor`, Kappe `layerCap()`, TTL 10 min, eine Cache-Map |
| S307-3 | Parser-Gerüst | `hud-parse.ts` | Skip-Liste: neue Schicht-Wörter nicht `unknown_place`. `Schicht aus` |
| S307-4 | Chip | `Lage.tsx` | Label aus Registry (`titleDe`), nicht nur drei Hardcodes |
| S307-5 | Test | `test-globe-18.mjs` o. ä. | Alte drei Sätze grün. Unbekannte Id → kein Fetch, Kugel bleibt |

## Won’t

- Neue Feeds in diesem Sprint (das ist 308+).
- OSIRIS-Client, MapLibre, zweite Poll-Schleife.

## Abbruchkriterium

Lage-Start fetcht eine Overlay-Schicht ohne Satz. Oder `Zeig Erdbeben`
bricht.

## Manuell

Lage auf: nur ISS/GIBS. `Zeig Erdbeben` wie `18.4.4`. Chip schaltet aus.
