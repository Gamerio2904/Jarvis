# Sprint 94 — Tanke E10 (`1.41.0`)

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Priorität | **MUST** |
| Ziel-Version | **`1.41.0`** |
| Quelle | PO: Chat/CarPlay „fahr mich zu einer Tanke“ |
| Voraussetzung | `1.40.3` |
| Plan | [`28-next.md`](../28-next.md) |

## Ziel

Im Chat und Fahrmodus die **nächste** und die **günstigste** Tankstelle nennen, immer **E10**, mit echten Preisen. Bestehende Navigation, kein neues Produkt.

## Must

| ID | Inhalt | Done wenn |
|----|--------|-----------|
| T1 | Phrasen `fahr mich zu einer Tanke` / `nächste Tanke` / `billigste Tanke` / `wo tanken` | Parser, nicht Geocode „Tanke“ |
| T2 | Immer E10; nächste **und** günstigste inkl. Preis | Tankerkönig `type=e10` |
| T3 | Route im Fahrmodus (Default nächste; „günstigste“ / `das zweite`) | `beginDriveTo` |
| T4 | Keine erfundenen Preise; ohne Key/GPS ehrlich | Settings Cloud |
| T5 | Version `1.41.0` Sideload | versionCode 14100 |

## Probe

`Fahr mich zu einer Tanke` — zwei Stationen, E10 €/l, Route. Standort an. Key unter Cloud.

## Won’t

Clever-Tanken-Scraping, andere Kraftstoffe als Default, Apple CarPlay, erfundenen €.
