# Sprint 345 — JSON-LD / Wikibooks, Zeiten, Schritte

**Version:** `18.11.3` — **CODE** Must
**Plan:** [`84-next.md`](../84-next.md)
**Voraussetzung:** 344 (bestätigte Zutaten) + 343 (Gewürz-Pin).

## Ziel

Aus der bestätigten Liste plus Pin kommt **ein** belegtetes Rezept.
Zeiten und Schritte stehen in der **Seite**, nicht im Modell.
Allowlist: zitierte URL → JSON-LD, sonst de.wikibooks Kochbuch,
sonst TheMealDB nur mit Nutzer-Key.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S345-1 | Recherche | `cook.ts` + research | Query aus bestätigter Liste; URL Pflicht. Kein Structured-Output+Search in einem Call |
| S345-2 | JSON-LD | `recipe-ld.ts` | Nur die zitierte URL. `@type Recipe`: prep/cook/total ISO 8601, ingredient, HowToStep, yield |
| S345-3 | Wiki | `wikibooks.ts` + Proxy | `de.wikibooks.org` in `WEB_PROXY_HOSTS`. Suche nach Zutat, Seite parsen. Credit CC-BY-SA + history |
| S345-4 | TheMealDB | optional Schritt 3 | Nur Settings-Key. Ohne Key skip. Nie Key `1` in der APK |
| S345-5 | Zeiten | `formatCookReply` | PT15M → 15 Min. Fehlt Feld: „Quelle nennt keine Zeit.“ Ofen-°C nur aus Quelltext |
| S345-6 | Liste | dieselbe Form | Bild / Regal / fehlt extra. Staples nicht unterstellen |
| S345-7 | Gewürz | `pickSpices` + Alias | Schnittmenge; nur Salz/Pfeffer ansagen |
| S345-8 | Einkauf | pending | „X fehlt. Auf die Liste?“ nur nach Ja → shopping |
| S345-9 | Merge | `skipMicroMerge` | `cook` nicht quetschen |
| S345-10 | Quellen | research-Meta | Badge zu (342) |

## Won’t

Zeiten erfinden. DummyJSON. Chefkoch-Farm. FlavorDB. Einkauf ohne Ja.
TheMealDB-Key `1`. LLM-Roman statt HowToStep.

## Abbruchkriterium

Schritte ohne URL/Wiki. Ofenzeit ohne Quellwort. Wikibooks-Carbonara
bekommt erfundene Minuten. Citations leer weil Search+JSON-Schema
in einem Call.

## Manuell

Bestätigte Eier+Nudeln → Wiki-Carbonara: Schritte ja, keine Minute.
Eine JSON-LD-Seite mit `PT15M`/`PT1H`: genau die Zahlen.
Parmesan fehlt → Nachfrage, ohne Ja bleibt die Einkaufsliste.
