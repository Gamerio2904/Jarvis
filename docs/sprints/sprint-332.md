# Sprint 332 — Read-Quellen umschalten

**Version:** `18.9.1` — **CODE** Must
**Plan:** [`80-next.md`](../80-next.md)
**Voraussetzung:** 331.

## Ziel

News, Research, Lage-Schicht und OMDb haben **eingetragene** zweite
Schritte. Keine neue Firma erfinden.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S332-1 | News | `news.ts` `recover.ts` | Tagesschau tot → Cache-Bust → DW nur wenn Endpoint schon CODE / fest eingetragen |
| S332-2 | Research | `brain-orchestrator.ts` | Provider-Fail → nächster Slot (Groq→Gemini). Ansage vor dem Slot |
| S332-3 | Lage | `globe-layers.ts` | `cachedLayer` verwerfen, `fetchLayer` neu. USGS/EONET/OpenSky wie Tabelle §2 |
| S332-4 | OMDb | `omdb.ts` | Retry; Publikum aus Ratings; fehlt weiter: `Publikum —`. Kein RT-Scrape |
| S332-5 | Test | `test-recover.mjs` | Mocks: 503 dann 200 → Ansage + Treffer. 503+503 → Absage, kein Fake |

## Won’t

- Zweite Wetter-API. ADS-B-Welt. Beliebige News-Domain.

## Abbruchkriterium

Antwort ohne Quelle nach zwei Fails. Oder RT-URL im Code.

## Manuell

`Zeig Erdbeben` bei tot-USGS: Ansage, Retry, dann ehrliche Absage oder Pins.
