# 32 — Kaufmodus (`2.20`–`2.28`) **CODE** (in `2.29.0`)

PO 2026-08-24: Intelligenter Shopping Mode / Kaufmodus. Overlay, Preisvergleich, Angebote, Prospekte, lokale Händler, Empfehlung. **Nie** die Einkaufsliste öffnen oder verändern.

Mitgeliefert in Sideload **`2.29.0`**. [`00-now.md`](./00-now.md). Engine: `kauf.ts` / `KaufOverlay.tsx`. Store **`shopping` bleibt die Lebensmittel-Liste.** Merkliste `kauf_saved`.

Reihe davor: [`31-next.md`](./31-next.md) `2.3`–`2.19` **CODE**. Polish: [`33-next.md`](./33-next.md).

## Reihenfolge

| Version | Inhalt | Quelle / Adapter | Status |
|---------|--------|------------------|--------|
| **`2.20.0`** | Intent-Trennung + Overlay-Gerüst | Parser vor der Einkaufsliste; Overlay leer ehrlich | **CODE** (in `2.29.0`) |
| **`2.21.0`** | Produktsuche | bestehende Research (Snippets), kein HTML-Crawl | **CODE** (in `2.29.0`) |
| **`2.22.0`** | Preisvergleich + Händlerkarten | Gesamtpreis nur mit belegtem Versand; Sortierung Preis | **CODE** (in `2.29.0`) |
| **`2.23.0`** | Filter, Chips, Nur-Angebote | NL-Filter; Rabatt nur aus Treffern | **CODE** (in `2.29.0`) |
| **`2.24.0`** | Produktvergleich + Empfehlung | Specs nur aus Treffern; sonst ehrlich | **CODE** (in `2.29.0`) |
| **`2.25.0`** | Merkliste (`kauf_saved`) | eigener Store, nicht `shopping` | **CODE** (in `2.29.0`) |
| **`2.26.0`** | Lokal kaufen | Filter + Research „vor Ort“; OSM-Route über bestehenden Fahr-Befehl | **CODE** (in `2.29.0`) |
| **`2.27.0`** | Prospekte / lokale Angebote | ohne Lizenz Research + ehrliche Lücke | **CODE** (in `2.29.0`) |
| **`2.28.0`** | Stimme im Overlay + Polish | Mic, Nummer, Sort, Merken, bestes Angebot öffnen | **CODE** (in `2.29.0`) |

Sprint-Kickoff historisch: [`sprint-122.md`](./sprints/sprint-122.md). Lieferung: [`sprint-123.md`](./sprints/sprint-123.md) / `2.29.0`.

## Leitentscheidung

| Thema | Entscheidung |
|-------|----------------|
| Name im Code | `kauf` / `KaufOverlay`. Store **`shopping` bleibt die Lebensmittel-Liste.** Merkliste: `kauf_saved`. |
| Router | `parseKaufIntent` **vor** `handleShopping`. Treffer Kaufmodus → Einkaufsliste unangetastet. |
| Einkaufsliste | Nur Packen/Streichen/Auflisten. `Milch auf die Einkaufsliste`, `auch Brot`, `was fehlt?`, `Milch hab ich`. |
| `X kaufen` / `X holen` | **Liste**, solange Kaufmodus zu ist und kein Such-/Angebotswort da ist (bestehendes `1.16`). |
| Kaufmodus | `Kaufmodus`, `ich will einkaufen` (ohne „Liste“), `such mir …`, `vergleiche …`, `im Angebot`, Budget/Specs (`Gaming-Monitor 300 €`). |
| Kaufaktion | `Kauf diese Milch` / `Öffne das beste Angebot` = Händler-URL öffnen, **kein Bestell-Fake**, **kein Listen-Eintrag**. |
| Preise | Jede Zahl hat `source` + `fetchedAt`. Kein Raten, kein erfundener Versand = 0 €. |
| Gesamtpreis | `Produkt + Versand + erkennbare Kosten`, nur wenn die Teile in der Quelle stehen. Sonst „Versand unbekannt“. |
| Rabattcodes | Wie `1.44`: nur bei angeschalteter Rabatt-Suche und nur aus Treffern. Keine erfundenen Codes. |
| Netz | Adapter austauschbar. Default: vorhandene Suche (Idealo/Geizhals-Landing, mydealz wenn Rabatt an). Kein Scraping gegen ToS. Kein Amazon-PA-API ohne PO. |
| Prospekte | Kein kaufDA/Marktguru ohne Lizenz. Bis dahin Research + ehrliche Lücke. |
| Checkout | Kein In-App-Kauf, kein Konto bei Amazon/MediaMarkt. Button **Zum Händler**. |
| UI | Glas/Dark wie Jarvis, kein Shop-Grid. Ein Overlay, nicht Fahrmodus-Karte. |
| Ehrlichkeit | Kein Bild, kein Preis, kein Laden, keine Öffnungszeit → das sagen. Overlay trotzdem öffnen. |

## Abgrenzung (Konflikt)

| Satz | Modus | Store |
|------|-------|-------|
| `Pack Milch auf meine Einkaufsliste.` | Einkaufsliste | `shopping` |
| `Auch Brot.` / `Was fehlt?` / `Milch hab ich.` | Einkaufsliste | `shopping` |
| `Milch kaufen.` / `Milch holen.` (Kaufmodus zu) | Einkaufsliste | `shopping` |
| `Kaufmodus.` / `Ich will einkaufen.` | Kaufmodus | — |
| `Such mir Milch im Angebot.` | Kaufmodus | — |
| `Such mir einen Fernseher.` | Kaufmodus | — |
| `Vergleiche diese drei Fernseher.` | Kaufmodus | — |
| `Nur Angebote für Kaffee unter 5 €.` | Kaufmodus | — |
| `Zeig mir alle aktuellen Angebote für Waschmittel.` | Kaufmodus / Prospekt | — |
| `Kauf diese Milch.` / `Öffne Nummer 2.` | Kaufaktion im Overlay | nicht `shopping` |
| `Merke mir Nummer 2.` | Merkliste | `kauf_saved` |
| `Pack Nummer 2 auf die Einkaufsliste.` | erst dann Liste | `shopping` — nur dieser Satz |

`Licht an` bleibt Steckdose/Ort. `Ventilator an` bleibt Fan. `in 20 Minuten Milch holen` bleibt Erinnerung/Timer.

## Architektur

Eigene Komponente, nicht in `shopping.ts`. Adapter hinter einem Interface, damit später Händler/Prospekte nachrüstbar sind.

```text
chat.ts
  parseKaufIntent          →  vor handleShopping
  handleKauf
       │
       ├─ KaufOverlay.tsx
       ├─ intent.ts                 ShoppingIntentDetector
       ├─ search.ts                 ProductSearchEngine
       ├─ price.ts                  PriceComparisonEngine
       ├─ offer.ts                  OfferEngine
       ├─ prospectus.ts             ProspectEngine
       ├─ local.ts                  LocalShoppingEngine
       ├─ compare.ts                ProductComparator
       ├─ memory.ts                 ShoppingMemory
       ├─ recommend.ts              ShoppingRecommendationEngine
       └─ adapters/
            types.ts                Quote { price, shipping?, total?, fetchedAt, source, url }
            research.ts             bestehende Websuche (Default)
            idealo.ts               Such-URL + Snippet, kein HTML-Crawl
            geizhals.ts
            deal.ts                 mydealz/Sparwelt nur wenn Rabatt-Suche an
            osm.ts                  lokale Läden, Stunden, Distanz
            prospectus.ts           später lizenzierte Quelle; bis dahin Stub
```

Jede Karte im Overlay liest nur `Quote`-Objekte. Abgelaufene Quotes (`fetchedAt` älter als Session-TTL, Default 30 min) werden nicht als „jetzt“ gesprochen.

### Overlay (ab `2.20`, Inhalt füllt sich über die Reihe)

Oben: Sprach-/Chat-Suche plus Chips `Alle` `Angebote` `Lokal` `Prospekte` `Unter … €` `Beste Bewertung`.

Links: großes Produktbild (nur mit URL aus der Quelle), weitere Bilder, `Merken`, `Vergleichen`, `Auf die Einkaufsliste` (explizit, sonst nie).

Rechts: Händler vertikal, Default-Sort **Gesamtpreis aufsteigend**. Günstigster Gesamtpreis hervorgehoben. Je Zeile: Name, Preis, Versand, Gesamt, Lieferzeit, Verfügbarkeit, Bewertung/Vertrauen, **Zum Händler**, Kurzbewertung — Feld fehlt → Strich, kein Fake.

Unten/Neben: Badges nur wenn die Engine sie belegen kann: Bestes Angebot, Günstigster Gesamtpreis, Schnellste Lieferung, Preis-Leistung.

## Chat (Zielbild)

| Version | Beispiel |
|---------|----------|
| `2.20.0` | `Kaufmodus` → Overlay, leer ehrlich. `Pack Milch auf die Liste` bleibt Liste. |
| `2.21.0` | `Such mir einen Fernseher` / `Ich brauche neue Kopfhörer` → Treffer oder ehrlich. |
| `2.22.0` | Händlerliste, `Sortiere nach Preis`, günstigster Gesamtpreis markiert. |
| `2.23.0` | `Nur Angebote.` / `Nur Angebote für Kaffee unter 5 €.` / Chip `Unter 50 €`. |
| `2.24.0` | `Vergleiche Nummer 1 und 3.` / `Was würdest du nehmen?` |
| `2.25.0` | `Merke mir Nummer 2.` — nicht auf der Lebensmittelliste. |
| `2.26.0` | `Wo bekomme ich diesen Fernseher heute in der Nähe?` |
| `2.27.0` | `Zeig mir alle aktuellen Angebote für Waschmittel.` |
| `2.28.0` | `Such günstigere Alternativen.` `Maximal 200 €.` `Öffne das beste Angebot.` |

Nachfragen nur wenn Budget/Produktklasse fehlen und ohne sie nichts Sinnvolles suchbar ist. Sonst suchen.

## Probe (wenn die jeweilige Version CODE ist)

1. `Pack Milch auf die Einkaufsliste` — Liste wächst, Overlay bleibt zu.
2. `Such mir Milch im Angebot` — Overlay, Liste unverändert.
3. `Kaufmodus` dann `Milch kaufen` — Kaufmodus-Follow-up, nicht neuer Listen-Eintrag.
4. Kaufmodus zu: `Milch kaufen` — weiter Liste (`1.16`).
5. Ohne Treffer: Overlay + klarer Satz, keine erfundenen 89,99 €.
6. Regression: `Steckdose an`, `Wetter heute`, `Ventilator an`, Einkauf `was fehlt?`, Fahrmodus.

## Won’t

In-App-Bestellung, Amazon-Konto, Affiliate heimlich, Idealo/Geizhals scrapen, kaufDA ohne Lizenz, Tapo-Shop, Tuya-Cloud, Play Store, iOS, Apple CarPlay, Einkaufsliste ersetzen, Preise erfinden, Versand 0 € raten, Gutscheincodes erfinden.
