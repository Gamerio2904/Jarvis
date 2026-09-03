# Sprint 179 — Alltag Parser-Härte (`9.10.0`) **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Ziel-Version | in Sideload **`9.10.0`** |
| Quelle | [`55-next.md`](../55-next.md) · [`50-next.md`](../50-next.md) · PR-Härte Alltag |
| Vorher | Alltag-Router `8.0` CODE. Intensiv-Tests zeigten Lücken |

## Ziel

Parser und Tests härten, ohne neue Produkte: Amazon Music ≠ Prime, Ordner-Wortstellung, Settings-Suche, Blitzer-Korridor ohne Overpass.

## Must

| ID | Inhalt | Stand |
|----|--------|-------|
| A1 | `Spiel Amazon Prime` nicht Music | `parseAmazonMusicIntent` false |
| A2 | `Chat nach Privat legen` | `folder` privat |
| A3 | Settings „Blitzer“ → Alltag, „Amazon“ → Geräte | `filterTopics` |
| A4 | Korridor-Filter ohne Netz | `blitzer-geo.ts` + Tests |
| A5 | `test:alltag` in `test:sprint` | `package.json` |

## Won’t

Neue Blitzer-API. Amazon Web-SDK. Live-Beamte. Embeddings-Router.

## DoD

- [x] `test:alltag`, `test:014`, `test:prompts` grün
