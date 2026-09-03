# Sprint 190 — Retrieve 2 (`10.30.0`) **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** (geliefert in `10.60.0`) |
| Ziel-Version | **`10.30.0`** |
| Quelle | [`56-next.md`](../56-next.md) §8 |
| Vorher | Sprint 189 |

## Ziel

`retrieve.ts` expandiert Aliase, filtert nach kind/entity/tense wenn erkennbar, boostet RRF fest. Weiter Top 6, Dump raus.

## Must

| ID | Inhalt |
|----|--------|
| R1 | Alias-Lexikon (WLAN/FritzBox, Japan/Tokyo, Zahnarzt/Termin, …) |
| R2 | Structured Prefetch wenn die Äußerung Goal/Entity/Zeit hergibt |
| R3 | Boosts: Entity +0.4, kind +0.3, tense +0.3 — keine gelernten Gewichte |
| R4 | e5-Aufruf bleibt Identität; `pickRoute` unangetastet |

## Won’t

BM25-Lib. Query-Embedding. ColBERT. Zweites Retrieve-Modul.

## DoD

- [x] `WLAN-Passwort` trifft FritzBox-Pin in Unit/Gold (auch ohne e5) — G2 grün
- [x] `test:014` / bestehende Recall-Fälle nicht regressiv
