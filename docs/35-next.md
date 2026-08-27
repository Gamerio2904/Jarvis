# 35 — Weltlage / Vorhersage (`4.0`) **PLAN**

PO 2026-08-27: Jarvis soll **die Zukunft vorhersagen** können — aktuelle Weltlage (Krieg, Politik, Märkte, Alltag) sofort kennen, aus **Vergangenheit + Gegenwart** rechnen, und sagen was folgen kann (Öl, Benzin, Kurse). Inspiration, nicht Kopie:

https://www.instagram.com/reel/DblW9QliG5l/

Zweites Reel (Sprachnachricht, Bar, Taxi): [`36-next.md`](./36-next.md) — Schiene `4.19+`, parallel, nicht in `4.0`–`4.18` mischen.

Reihe davor: [`33-next.md`](./33-next.md) **CODE**. App-Code jetzt: **`3.19.0`**. Sideload: **`3.18.1`**.

**Warum `4.0`, nicht `3.19`/`3.20`:** In [`09-versioning.md`](./09-versioning.md) sind `3.19.0`–`3.45.0` schon **logische Stufen innerhalb von `3.18.0`**. Ein neues MINOR `3.20` würde kollidieren. Das ist ein eigener Produktsprung (Weltlage, nicht noch ein Haus-Tool) → **MAJOR `4.0`**.

Parallel (nicht Blocker): Stimme/Kalender/Debug liegt als eigener Stand außerhalb von `main`. Diese Reihe startet von Sideload `3.18.1`.

Eine logische Stufe pro Version. Sideload darf später bündeln. **Kein Code in diesem Sprint** — zuerst Research, dann bauen.

## Reel — was dort wirklich steht

Account: moritz.maaker. Caption (sinngemäß): Jarvis **unterbricht bei der Arbeit** und erklärt, **warum der Ölpreis steigt, bevor ich es in den Nachrichten lese**. Hormus, Kiew, Asien. Alles verknüpft. Alles relevant. Kommentare fragen nach Aktien.

Das Video **verspricht** drei Dinge, die Produkt und Marketing oft vermischen:

| Versprechen im Clip | Was das technisch ist | Bei uns |
|---------------------|------------------------|---------|
| Weiß es *vor* den Nachrichten | Schneller **Ingest** öffentlicher Meldungen als der User die App öffnet. Kein Insider, kein Agentur-Feed vor Journalisten. | **ja, so** — Watch + Cache. Nicht „vor der Tagesschau existiert die Meldung nicht“. |
| Hormus + Kiew + Asien → Öl | **Kausalkette** aus bekannten Engpässen (Straße von Hormus = Tanker, Krieg = Risikoaufschlag, Asien = Nachfrage) plus **Zahl** (Brent/WTI, E10). | **ja** — Regeln + zitierte Serie, kein Hellsehen. |
| Unterbricht bei der Arbeit | Push, wenn sich die Lage **gegenüber dem letzten Snapshot** geändert hat. | **ja, opt-in**. Default aus (Akku, Stören). |
| Aktien fallen/steigen als Fakt | Trading-Orakel. | **Won’t** als Gewissheit. Später höchstens **Szenario + Quelle + „kein Kauf-Rat“**. |

Nutzen: **Weltlage verknüpfen**, nicht Bloomberg und nicht Horoskop.

## Ist (heute, `3.18.1`)

| Thema | Was Jarvis kann | Lücke zum Reel |
|-------|-----------------|----------------|
| Nachrichten | Tagesschau `api2u`, 3 Zeilen, **auf Nachfrage**. Ort → Suche, sonst Netz. Nichts erfinden. | Kein Dauer-Watch. Kein Tagging (Hormus, OPEC, Krieg). Kein „warum Öl“. |
| Research | Opt-in. Wikipedia/Destatis zuerst, dann Netz. Zahlen nur aus Treffern. | Kein Zeitreihen-Rechnen. |
| FX | EZB über Frankfurter.app, **ein** aktueller Kurs. | Keine Historie, kein „wird der Dollar …“. |
| Tanke | Tankerkönig E10, nächste + günstigste, GPS. | Kein Bundesschnitt über Wochen, kein „wird teurer weil Brent“. |
| Wetter | Open-Meteo + DWD-Warnung. | Unabhängig von Märkten. |
| Lage-HUD | Module aus vorhandenen Tools. Keine erfundenen Kurven. | Keine Weltlage-Kachel. |
| Unterbrechen | Timer, Erinnerung, Kalender, `Ruf mich in …`. | Kein News-Watch. |
| 0,5B | Wählt **keine** Tools. | Bleibt. |
| Hirn | Handy. PC = Werkzeug (`JarvisPC`). | Kein 24/7-News-Server. |

**Sofort die ganze Welt wissen** kann das Handy nicht. Es kann **holen, cachen, verknüpfen, Unsicherheit sagen**.

## Leitentscheidung

| Thema | Entscheidung |
|-------|----------------|
| Produktname intern | Tool **`outlook`** (Weltlage / Ausblick). Chat: „Lage Welt“, „Warum steigt Öl?“, „Wird Benzin teurer?“. |
| Wahrheit | Jede Zahl und jede Meldung hat **Quelle + Stand**. Fehlt sie: das sagen. Kein Preis, kein Krieg, kein „fällt“ erfinden. |
| Vorhersage | **Szenario**, nicht Orakel. Form: *Wenn Hormus eng bleibt, tendenziell höherer Rohölpreis; E10 folgt verzögert; Unsicher.* Nie: *Diese Aktie wird fallen.* |
| Recht | Kein Anlage- oder Versicherungsrat. Ein Satz: Stand, Quelle, kein Kauf-/Verkaufsauftrag. |
| Research zuerst | `4.1`–`4.4` sind **Spikes**. Erst Tabelle Quelle/Lizenz/Akku/Recht, dann Code. |
| Router | Nur Register. Parser in `outlook-parse.ts`. Konflikte in `conflicts.ts`. Tests importieren `route-pick.ts`. Kein `if` in `chat.ts`. |
| 0,5B | Wählt nicht. Gemini (opt-in) darf **zitierte** Fakten in Sätze fassen, keine neuen Zahlen. |
| Netz | Freie APIs oder schon erlaubte Suche. Kein Scraping hinter Login, kein Captcha-Bypass, kein inoffizielles Yahoo-Chart. |
| Akku | Watch **opt-in**, grobes Intervall (Ziel 15–30 min, Android erlaubt oft nicht genauer). App-offen = frisch holen. |
| PC | Optional später mehr holen. **Nicht** nötig für v1. Handy bleibt Hirn. |
| Sideload | Erst wenn Kern da (`4.8`+) **und** Hausstand-Export [`38-next.md`](./38-next.md). Bis dahin kein APK-Claim. |

## Soll — ein Durchlauf

```text
Frage oder Watch-Treffer
  → Schicht 0: Gates unverändert
  → outlook-Parser (nicht news/fuel/fx, wenn „warum/wird/teurer/Öl/Weltlage“)
  → Execute:
       1. Cache: letzte Meldungen + Serien (IndexedDB)
       2. Frisch holen wenn älter als TTL
       3. Tags an Meldungen (Hormus, Ukraine, OPEC, EZB, …)
       4. Serie dazu (Brent/WTI wenn Quelle da, sonst ehrlich leer; E10 lokal; FX-History)
       5. Analog: letzter ähnlicher Schock in der Serie (±%)
       6. Antwort: Lage → Kette → Szenario → Unsicherheit → Links
  → ResearchMeta wie Tagesschau (Quellenleiste)
```

Beispielton (Siezen, kurz):

> Brent liegt bei … \$ (Quelle, Stand). Tagesschau: Spannung an der Straße von Hormus. Beim letzten vergleichbaren Ausschlag in der Serie bewegte sich der Preis um etwa … %. Benzin an deutschen Tankstellen folgt dem Rohöl oft verzögert — E10 bei Ihnen gerade … €. Das ist kein Kauf-Rat und keine Gewissheit.

## Researchphasen (zuerst, Pflicht)

Ohne abgeschlossene Research-Stufe kein Execute-Code für diese Domäne. Jede Stufe schreibt die Entscheidung **in dieses Dokument** (Status-Spalte).

### `4.0.0` — Leitentscheidung (dieser Sprint)

| Feld | Wert |
|------|------|
| Art | PLAN, Docs |
| Done wenn | Dieses Dokument + Sprint 110 + Versioning-Zeile |
| Status | **PLAN** (jetzt) |

### `4.1.0` — Research: Nachrichten-Ingest

**Frage:** Wie kommt „alles was in der Welt passiert“ aufs Handy, ohne Lüge und ohne Akku-Tod?

| Kandidat | Lizenz / Zugang | Latenz | Aufwand Handy | Votum (erste Sichtung) |
|----------|-----------------|--------|---------------|-------------------------|
| Tagesschau `api2u` | öffentlich, schon im Code | Minuten–Stunden | niedrig | **behalten**, Kern DE |
| DW / andere ARD-RSS | öffentlich RSS | ähnlich | mittel | **prüfen** in 4.1, 1–2 Extra-Feeds |
| Reuters/AFP API | meist Vertrag/Key | schnell | hoch | **Won’t** ohne Vertrag |
| GDELT | frei, riesig | hoch | zu schwer fürs Phone | **Won’t** on-device |
| Wikipedia Current events | frei | langsam | niedrig | Could, nicht Kern |
| Gemini „was passiert“ ohne Quelle | Cloud | — | — | **Won’t** (erfindet) |
| Eigenes 24/7-Backend | Server | — | — | **Won’t** (Hirn = Handy, NAS tot) |

**Sofort:** Nein. Android Hintergrund ~15 min. „Sofort“ = *sobald Jarvis holt*, nicht Tick-by-Tick.

**Zu klären in 4.1 (CODE-Spike, kein Produkt-UI):**

1. Tagesschau-Felder: `date`, `topline`, `tags`, regionale vs. Bund. Reicht das für Hormus/Öl-Keywords?
2. Search-Endpoint vs. Home: schon da (`news.ts`). Watch = periodisch Home + Keyword-Search (`Hormus`, `Rohöl`, `OPEC`, `Ukraine`).
3. TTL: Vorschlag 20 min vorn, 6 h Hintergrund. Messen: mAh, Doze.
4. Duplikate: gleiche `shareURL` nicht zweimal pushen.
5. Sprachen: DE zuerst. EN-Feeds nur wenn Lizenz klar.

**Done wenn:** Tabelle oben auf **ja/nein pro Quelle** festgezogen; TTL-Zahl; Keyword-Liste v1 (Öl/Krieg/EZB) in Docs.

### `4.2.0` — Research: Zeitreihen (Öl, Benzin, FX, später Aktien)

**Frage:** Welche Serie ist frei, zitierbar, auf dem Phone holbar?

| Serie | Kandidat | Key? | TOS | Votum (erste Sichtung) |
|-------|----------|------|-----|-------------------------|
| FX Historie | Frankfurter.app / frankfurter.dev (EZB u. a.), wir nutzen schon `latest` | nein | offen | **ja** — erste Serie, Risiko niedrig |
| Rohöl Brent/WTI | EIA API | **ja**, frei registrieren | offiziell | **opt-in Key** in Settings, wie Tankerkönig |
| Rohöl | FRED `DCOILBRENTEU` | ja, frei | offiziell | Alternative zu EIA, **eine** Quelle wählen in 4.2 |
| Rohöl | Stooq `oil` CSV | Captcha-Key 2026, Quota | fragil | **Won’t** (Captcha, Quota, Bypass = Won’t) |
| Rohöl | Yahoo Chart inoffiziell | — | ToS | **Won’t** |
| E10 DE | Tankerkönig list | schon Settings-Key | CC | **ja, Spot**. Lange Historie **nicht** in der Gratis-API — Bundesschnitt über Tage müssen wir **selbst cachen** wenn Watch an |
| Verbraucherpreise Energie | Destatis/GENESIS | oft Key | offiziell | Could, langsam (Monat) |
| Einzelaktien / DAX | Stooq, Yahoo, bezahlte Terminals | meist Key/ToS | — | **nicht in v1**. `4.10` nur wenn eine **saubere** Quelle steht |

**Öl ohne Key:** EIA Bulk-ZIP ist zu groß fürs Phone. Also: **Key opt-in** oder ehrlich „Rohöl-Zahl fehlt, nur Meldung“.

**Benzin teurer:** Spot E10 (haben wir) ≠ Prognose. Kette: Brent-Δ → grobe Verzögerung 1–3 Wochen (Literatur/empirisch in 4.2 **nachmessen**, nicht als Naturgesetz behaupten) → E10-Spot. Wenn keine Brent-Zahl: nur Meldung + E10-jetzt, kein „wird teurer“.

**Done wenn:** Eine Öl-Quelle + eine FX-History-URL + Entscheidung E10-Cache ja/nein; Probe-JSON im Spike gespeichert (nicht in der APK erfinden).

### `4.3.0` — Research: Prognose-Methode + Recht

**Frage:** Was darf Jarvis sagen, ohne Magie und ohne Anlageberatung?

| Methode | Nutzen | Risiko | Votum |
|---------|--------|--------|--------|
| LLM halluziniert „fällt morgen 8 %“ | Filmreif | Lüge, Haftung | **Won’t** |
| Naive Fortschreibung (letzter Δ) | ehrlich schwach | User hält es für Magie | nur mit Label „Trend der Serie, kein Modell“ |
| Event-Dummy: ähnlicher Tag in der Historie | Reel-Kern (Hormus 2019/2024 analog) | falsche Analogie | **ja**, mit „damals / n = … / nicht gleich“ |
| Volle Ökonometrie / ML on-device | übertrieben | 0,5B kann das nicht | **Won’t** |
| Gemini formuliert über **übergebenen** Zahlen | Ton | darf keine Zahl erfinden — Prompt + Parser prüfen | **ja, opt-in** |
| „Diese Aktie wird fallen“ | Wunsch aus Kommentaren | WpHG-Nähe, unwahr als Fakt | **Won’t** |

Antwort-Vertrag (fest):

1. Ist-Stand (Zahl oder „keine Zahl“).  
2. Was die Meldungen **belegen** (Zitat/Teaser + Link).  
3. Historischer Vergleich **wenn** die Serie den Schock enthält.  
4. Szenario A/B (eng / entspannt), keine Punktprognose.  
5. Schluss: Unsicher, kein Rat.

**Recht DE (Haus-Assistent, ein User):** Jarvis ist kein Wertpapierdienst. Kein „Sie sollten kaufen“. Kein Portfolio. Gold-Set-Tests: verbotene Sätze.

**Done wenn:** Antwort-Vertrag in Tests als Fixtures (Gold-Strings); Liste verbotener Claims.

### `4.4.0` — Research: Architektur, Akku, Konflikte

**Frage:** Wohin im Register, ohne `news`/`fuel`/`fx` zu zerlegen?

| Thema | Entscheidung (Ziel, in 4.4 hart machen) |
|-------|------------------------------------------|
| Dateien | `outlook-parse.ts`, `outlook.ts`, `outlook-series.ts`, `outlook-tags.ts`. Execute nur `registry.ts`. |
| Parser-Tests | `route-pick.ts`, nicht `registry.ts`. `.ts`-Imports in Node-Tests. |
| Konflikte | siehe Tabelle unten. |
| Speicher | Settings: `outlook_watch`, `outlook_eia_key?`, `last_outlook_json`, `last_outlook_line`. IndexedDB Snapshot. |
| Hintergrund | vorhandenes `scheduleNotify` / Foreground wenn App auf. Kein zweites Betriebssystem. |
| Gates | Help, Confirm, Ordinal, Follow-up, Pending **unscored** — Watch-Push ist kein Chat-Turn-Router. |
| Follow-up | `warum?` / `und Benzin?` nach outlook → gleiches Tool (`last_step` / last-tool, Muster 3.18). |

**Konflikte (Ziel):**

| Äußerung | Gewinner | Verlierer |
|----------|----------|-----------|
| `Nachrichten` / `Tagesschau` | `news` | `outlook` |
| `Was ist in Kiew passiert` | `news` (Ort) | `outlook`, außer „… und Öl“ |
| `Fahr mich zur Tanke` / `E10 hier` | `fuel` | `outlook` |
| `Wird Benzin teurer` / `Warum ist Öl so teuer` | `outlook` | `fuel`, `news` |
| `Was ist der Dollar` | `fx` | `outlook` |
| `Fällt der Dollar` / `Euro Ausblick` | `outlook` | `fx` |
| `BIP Deutschland` | `research` | `outlook` |
| `Guten Morgen` | `brief` | `outlook` (nicht die Welt vor dem Kalender) |
| `Wetterstatistik` | `hud` | `outlook` |

**Done wenn:** Konflikt-Gold in Docs; Akku-Messung notiert (ein Gerät reicht); kein neuer Gate-Typ.

## Bau-Reihenfolge (nach Research)

Erst wenn `4.1`–`4.4` Status **entschieden**.

| Version | Inhalt | Abhängigkeit | Status |
|---------|--------|--------------|--------|
| **`4.0.0`** | Leitentscheidung, dieses Dokument | — | **PLAN** |
| **`4.1.0`** | Research Nachrichten | 4.0 | **PLAN** |
| **`4.2.0`** | Research Serien | 4.0 | **PLAN** |
| **`4.3.0`** | Research Prognose + Recht | 4.0 | **PLAN** |
| **`4.4.0`** | Research Architektur | 4.0 | **PLAN** |
| **`4.5.0`** | `outlook` v1: Watch-Ingest + Tags, **auf Nachfrage** „Was ist die Weltlage?“ | 4.1, 4.4 | geplant |
| **`4.6.0`** | Serien: FX-History + Öl wenn Key + E10-Spot in dieselbe Antwort | 4.2, 4.5 | geplant |
| **`4.7.0`** | **Reel-Kern:** Meldungstag → Kette Hormus/Kiew/Asien/OPEC → Öl/E10 | 4.3, 4.6 | geplant |
| **`4.8.0`** | Szenarien A/B + Analog ±% + Unsicher-Satz fest | 4.7 | geplant |
| **`4.9.0`** | Unterbrechen opt-in (nur Δ zum Snapshot, Dedupe) | 4.5, Notify | geplant |
| **`4.10.0`** | Märkte breiter **nur** mit sauberer Quelle; sonst ehrlich nein. Kein „Aktie fällt“. | 4.2 Rest, 4.8 | geplant |
| **`4.11.0`** | Lage-Kachel „Welt“ — echte `last_outlook_line`, sonst leer | 4.7, HUD-Katalog | geplant |
| **`4.12.0`** | Härten Parser/Konflikte/Follow-up (`und Benzin?`) | 4.8 | geplant |
| **`4.13.0`** | Zweite News-Quelle falls 4.1 ja gesagt hat | 4.5 | geplant |
| **`4.14.0`** | Analog-Bibliothek (feste Schock-Fenster in der Serie, keine Wikipedia-Erfindung) | 4.8 | geplant |
| **`4.15.0`** | Akku: Intervall, Doze, Watch aus = null Netz | 4.9 | geplant |
| **`4.16.0`** | Gold-Set: Routing + verbotene Claims + Quellenpflicht | 4.12 | geplant |
| **`4.17.0`** | Stimme: Ausblick in ganzen Sätzen, Siezen, kein Ticker-Staccato | 4.8 | geplant |
| **`4.18.0`** | Sideload wenn Kern (`4.8`+) nutzbar — versionName/code aus `package.json` | 4.8+ | geplant |

Eine App-Version darf mehrere logische Stufen bündeln (wie `3.18.0`). Research-Stufen bleiben sichtbar.

## Chat / Stimme (Zielbild)

| Version | Beispiel | Soll |
|---------|----------|------|
| 4.5 | `Was ist die Weltlage?` / `Was passiert in der Welt?` | 3–5 zitierte Meldungen, Tags, Stand. |
| 4.6 | `Wie steht Öl?` | Zahl + Quelle oder „keine Öl-Serie, Key fehlt“. |
| 4.7 | `Warum steigt der Ölpreis?` | Kette + Meldung + Zahl. |
| 4.8 | `Wird Benzin teurer?` | E10 jetzt + Szenario, kein Datum-Orakel. |
| 4.9 | (kein Chat) | Notification: eine Ursache, eine Zahl, „Öffnen für Quellen“. |
| 4.10 | `Fällt SAP morgen?` | Ablehnen als Gewissheit; höchstens Kurs **falls Quelle**, plus „kein Rat“. |
| — | `Nachrichten` | bleibt Tagesschau-Tool. |
| — | `Tanke` | bleibt Tankerkönig. |

## Settings (Ziel)

| Key | Default | Zweck |
|-----|---------|--------|
| `outlook_watch` | **aus** | Hintergrund-Ingest + Push |
| Öl-Key (EIA oder FRED, eine) | leer | wie Tankerkönig: ohne Key keine erfundene Zahl |
| `outlook_interrupt` | aus | darf bei der Arbeit stören (Reel). Watch an ≠ automatisch stören |

Thema in Settings: **Weltlage**, nicht unter Sales.

## Tests (wenn Code kommt)

| Art | Inhalt |
|-----|--------|
| Parser | Weltlage / warum Öl / wird Benzin / fällt Aktie vs. Nachrichten / Tanke / Dollar / Guten Morgen |
| Konflikte | Tabelle oben, `test:014` / `test:prompts` |
| Ehrlichkeit | Fixture ohne Öl-API → kein \$ im Satz |
| Claims | Reply darf nicht `/wird (sicher\|garantiert) fallen/` o. ä. |
| Quellen | `research.sources.length >= 1` bei Meldungen |
| Version | `/hilfe` zur gebündelten App-Version |

## Dateien (Ziel, nicht in diesem Sprint anlegen)

| Datei | Rolle |
|-------|--------|
| `outlook-parse.ts` | Intent: `world`, `oil_why`, `fuel_outlook`, `fx_outlook`, `stock_ask` |
| `outlook.ts` | Execute, Satzbau, Vertrag |
| `outlook-tags.ts` | Keyword → Tag (Hormus, Ukraine, OPEC, EZB, Asien-Nachfrage) |
| `outlook-series.ts` | Frankfurter History, Öl-API, E10-Spot/Cache |
| `route-pick.ts` / `registry.ts` / `conflicts.ts` / `policy.ts` | Eintrag `outlook` |
| `store.ts` | Keys + Snapshot |
| HUD-Katalog | Kachel `world` erst in `4.11` |

## Probe (nach `4.8`, nicht jetzt)

1. `Nachrichten` = Tagesschau, nicht Ausblick.  
2. `Wird Benzin teurer?` = outlook, nicht nächste Tankstelle.  
3. Ohne Öl-Key: Meldung ja, Brent-Zahl nein.  
4. `Fällt die Aktie morgen?` = kein Orakel.  
5. Watch aus: kein stilles Netz im Hintergrund.  
6. Kein `if (handleOutlook)` in `chat.ts`.  
7. Regression: Steckdose, Tanke fahren, Dollar-Kurs, Guten Morgen.

## Won’t

- Allwissen, Insider, „vor allen Journalisten“.  
- Punktprognose, Garantie, Kauf-/Verkaufsorder.  
- Bloomberg, bezahlte Terminals, Captcha-Bypass, Yahoo-ToS-Bruch.  
- GDELT/NAS als Pflicht-Backend.  
- Embeddings als Router. 0,5B-Function-Calling.  
- Retell, Play Store, iOS, Alexa.  
- Sales-CRM (altes Reel). Fake-Gauges.  
- 24/7-Hotline. Kundenrechnung.

Alltagskette (Nachricht/Bar/Taxi): [`36-next.md`](./36-next.md). Gespräch/Stimme/Steuer: [`37-next.md`](./37-next.md).

## Verbesserungen (eigene Updates, nach dem Kern)

Bewusst **nach** `4.8`, nicht in v1 mischen.

| Version | Verbesserung |
|---------|----------------|
| `4.12` | False-Positives (`Öl` im Rezept, `Lage` = HUD). |
| `4.13` | Zweite DE-Quelle, wenn Tagesschau Lücken hat. |
| `4.14` | Mehr Analog-Fenster (2019 Tanker, 2022 Invasion) **aus der Serie**, nicht aus dem Modellgedächtnis. |
| `4.15` | Weniger Wecken: nur Tag-Wechsel oder Δ über Schwelle. |
| `4.16` | Eval-Gold gegen Halluzination. |
| `4.17` | Sprachmodus: ein Satz Ursache, dann Zahl — nicht vorlesen der Quellenliste. |
| später | DAX/Einzelwerte **nur** mit klarer Lizenz; sonst dauerhaft nein. |
| später | User-Themen merken („mich interessiert Öl, nicht Promi“) über Memory, nicht neuer Cloud-Profiler. |

## Offene Punkte (Research räumt sie ab)

| ID | Frage | Stufe |
|----|-------|--------|
| O1 | EIA oder FRED als Öl-Quelle? | 4.2 |
| O2 | E10-Historie selbst cachen — Speicher/Datenschutz ok? | 4.2 |
| O3 | Keyword-Liste DE/EN für Hormus (Strait, Hormuz, Straße von Hormus). | 4.1 |
| O4 | Darf Watch mit Gemini-Formulierung laufen wenn Research-Opt-in aus ist? Ziel: **nein**, Template ohne neue Zahlen. | 4.3 |
| O5 | Intervall vs. Android 15+ Background. | 4.4 / 4.15 |

Sprint: [`sprint-110.md`](./sprints/sprint-110.md).
