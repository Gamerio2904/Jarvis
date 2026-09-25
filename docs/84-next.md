# 84 — Koch aus dem Vorrat (Bild, Gewürze, Rezept) **CODE** (`18.11.4`)

PO: Ein Foto von den Zutaten, die da sind. Gewürze einmal fotografieren
und „merke dir meine Gewürze“ — das liegt im **Hauptgehirn**. Der Koch
wählt daraus, was zum Gericht passt (manchmal nur Salz und Pfeffer).
Antwort: Zubereitungszeit, Gesamtzeit (Backofen …), Zutatenliste,
ausführliche Schritte. Quellen unter **jeder** Nachricht zugeklappt,
aufklappbar.

Nicht parallel zu offenen 18.10-Nachziehern. Kein zweites Gedächtnis,
kein Lieferdienst, keine erfundenen Rezepte.

Nach Deep Research (Open Source + APIs, 2026): die meisten
Fridge-zu-Rezept-Repos (FridgeMate, PantryLens, FridgeChef) **lassen
ein LLM das Gericht erfinden**. Das kopieren wir nicht. Was wir
übernehmen: bestätigte Erkennung, JSON-LD-Zeiten, freies Kochbuch.

## 0. Ist vor dieser Etappe

| Stelle | Code | Lücke |
|--------|------|-------|
| `food` | Open Food Facts, „Zutaten von / Barcode“ | kein Rezept, kein Foto-Vorrat |
| Research | „Ich rate keine Rezepte“ | Carbonara-Suche geht ins Netz, nicht vom Bild |
| Auge | Gemini Vision, `jarvis_last_eye_image` | liest das Bild, kocht nicht daraus |
| Memory | `MERK`, Pins, ein Core | „merke dir …“ wird `notiz`, kein Gewürzregal |
| `SourcesBlock` | `<details open>` | Quellen stehen unter jeder Treffer-Nachricht offen |
| Katalog | 63 Executoren | kein Koch-Agent |
| Proxy | `de.wikipedia.org`, OFF | kein `de.wikibooks.org` |

`haushalt` trifft `\bkochen\b` als **Waschschüssel**, nicht als Rezept.
`outlook-parse` hat ein Rezept-Wort — das ist Weltlage, nicht Küche.

## 0b. Quellen (Deep Research)

| Quelle | Was sie hergibt | Was nicht / warum nicht so |
|--------|-----------------|----------------------------|
| [FridgeChef](https://github.com/jnastaskin/fridgechef) MIT | **Liste prüfen** vor dem Rezept; unsichere Detections streichen | Rezept kommt von GPT — bei uns Won’t |
| [SnapShelf](https://github.com/wang-joshua/SnapShelf) | „Can Make Now“ vs. fehlt; Einkauf nach Bestätigen | Exakter String-Match bricht (Paprika ≠ paprika). Gemini generiert Rezepte |
| [FridgeMate](https://github.com/archangel2006/FridgeMate) / [PantryLens](https://github.com/klee1611/PantryLens) | Foto → Liste → Schritte (UX) | YOLO+LLM bzw. Gemma **erfinden** das Gericht |
| [schema.org/Recipe](https://schema.org/Recipe) · [Google Recipe](https://developers.google.com/search/docs/appearance/structured-data/recipe) | `prepTime` / `cookTime` / `totalTime` als **ISO 8601** (`PT15M`, `PT1H`); `recipeIngredient`; `recipeInstructions` als `HowToStep`; `recipeYield` | Nur wenn die **zitierte** Seite Markup hat |
| [hhursev/recipe-scrapers](https://github.com/hhursev/recipe-scrapers) MIT | Wie man JSON-LD/Microdata liest | Python; 400 Host-Scraper = Crawl. Wir parsen **nur JSON-LD der schon zitierten URL** |
| [de.wikibooks Kochbuch](https://de.wikibooks.org/wiki/Kochbuch) · [Alle Rezepte](https://de.wikibooks.org/wiki/Kategorie:Kochbuch/_Alle_Rezepte) (~640) | Deutsch, **kein Key**, API wie Wikipedia. [CC-BY-SA 3.0](https://de.wikibooks.org/wiki/Wikibooks:Lizenzbestimmungen) + Autorenlink | Wikitext, oft **keine** Zeiten (Carbonara nennt keine Minute) |
| [TheMealDB](https://www.themealdb.com/documentation) | `filter.php?i=` + `lookup.php` strukturiert | Key `1` nur Entwickeln; APK braucht Supporter-Key. Englisch, eine Zutat frei |
| [DummyJSON recipes](https://dummyjson.com/docs/recipes) | 50 Dummy-Gerichte | Placeholder. Nie als Essen ausgeben |
| [OFF ingredients taxonomy](https://github.com/openfoodfacts/openfoodfacts-server/blob/main/taxonomies/food/ingredients.txt) ODbL | Synonyme (Pfeffer / pepper) | Keine Rezepte. `food` bleibt Produkt |
| [FlavorDB](https://cosylab.iiitd.edu.in/flavordb/how_to_use) | Molekül-Paarung | Würde Gewürze **erfinden**, die der Pin nicht hat |
| [YOLO-World](https://github.com/ultralytics/ultralytics/blob/main/docs/en/models/yolo-world.md) | Zero-shot Lebensmittel | LocateAnything-Gewichte **Freeze**. Nicht in die APK |
| [Gemini Grounding](https://ai.google.dev/gemini-api/docs/google-search) | `groundingChunks` = URLs | Structured Output **plus** Search leert oft die Citations (Forum 2025). Zwei Schritte, nicht ein JSON-Rezept aus der Suche |

**Rezept-Kette (ehrlich):**

```text
1. Recherche liefert URL
2. Parser liest schema.org Recipe von genau dieser Seite
   — oder Wikibooks-API (Allowlist-Schritt 2)
   — TheMealDB nur mit Nutzer-Key (Schritt 3)
3. formatCookReply nur aus diesen Feldern
Kein Gemini-„hier ein leckeres Gericht aus Eiern“.
```

## 1. Warum nicht die naheliegenden APIs

| Idee | Warum nicht |
|------|-------------|
| Spoonacular / Edamam | Extra-Key, Quote, Firma |
| Chefkoch / 400-Host-Scraper | Copyright, kein freies Web |
| TheMealDB Key `1` in der APK | Deren Regel: öffentlich = Supporter |
| DummyJSON | Testdaten, keine Küche |
| LLM-Rezept wie FridgeMate | Honesty: „Ich rate keine Rezepte“ |
| Zweites IndexedDB / Koch-Hirn | Ein Core ([`82-next.md`](./82-next.md)) |
| `food` aufblähen | OFF-Lookup ≠ Rezept |
| YOLO / LocateAnything | Freeze, APK-Gewicht |
| FlavorDB-Paarung | Erfundene Gewürze |
| Structured Output + Search in einem Call | Citations oft leer |
| Öl/Salz/Wasser still annehmen | Viele Apps tun das. Wir nicht, außer Pin oder Bild |

Vision bleibt Gemini (Bild → Google, wie Auge). Ohne Gemini: Foto ehrlich aus.

## 2. Leitentscheidung

| Thema | Entscheidung |
|-------|----------------|
| Koch-Agent | **64. Domänen-Agent `cook`**. Alter Won’t „kein 64.“ = Organizer. `food` bleibt Lebensmittel |
| Gewürze | Pin `gewuerze` im Hauptgehirn, `fact`, kein TTL. Origin user\|tool |
| Synonyme | Kleine lokale Tabelle (Pfeffer = black pepper). Optional OFF-Suggest. Kein FlavorDB |
| Vorrat-Foto | Pro Gericht neu. Nicht der ganze Kühlschrank als Dauer-Pin (außer der PO später „merke Vorrat“ will) |
| Bestätigen | Nach Vision: „Ich sehe: … Stimmt das?“ **Ja** erst dann Recherche. „ohne X“ / „dazu Y“ ändert die Liste (FridgeChef) |
| Zeiten | Nur `prepTime` / `totalTime` / `cookTime` aus JSON-LD **oder** explizite Minuten in Wikibooks. ISO 8601 → „15 Min“. Sonst „Quelle nennt keine Zeit.“ Ofen-°C nur wenn der Quelltext sie hat |
| Garzeit | `cookTime` extra, wenn vorhanden. `totalTime` fehlt, aber prep+cook da: „45 Min (prep+Garzeit der Quelle)“, nicht raten |
| Portionen | `recipeYield` / „Zutaten pro Person“, wenn die Quelle das sagt |
| Gewürz-Wahl | Schnitt Menge nach Synonym. Nur Salz/Pfeffer: genau die. Extra der Quelle ehrlich |
| Staples | Öl, Salz, Wasser nicht unterstellen |
| Quellen-UI | `SourcesBlock` ohne `open`. Badge **„N Quellen“** |
| Antwort | Parser-Text, skipMicroMerge. Kein neues ChatBlock-Kind |
| Einkauf | Fehlendes **nach Ja** auf die Liste (SnapShelf). Nie still |

## 3. Nutzerfluss

```text
1. Foto-Knopf: Gewürzregal
   → „merke dir meine Gewürze“
   → Vision nur Sichtbares
   → Pin ersetzen (STORE). „dazu noch“ = MERGE
   → „Liegt: Salz, Pfeffer, Paprika, Oregano.“

2. Foto-Knopf: Theke / Kühlschrank
   → „was kann ich damit kochen“
   → Vision: sichere Namen + Unsichere extra
   → „Ich sehe: Eier, Nudeln. Unsicher: Glas rot — weggelassen. Stimmt das?“
   → Ja  |  „ohne Nudeln“  |  „dazu Sahne“
   → Pin gewuerze
   → Recherche-URL → JSON-LD  oder  Wikibooks  oder  Absage
   → Titel, Zeiten, Portion, Liste, Schritte, CC-BY-SA wenn Wiki
   → „Parmesan fehlt. Auf die Einkaufsliste?“ nur nach Ja

3. „welche Gewürze habe ich?“ / „vergiss meine Gewürze“
```

Foto nur Kamera-Knopf (`wont` `photo`). Carbonara **suchen** = research.
Beispiel ehrlich: [Wikibooks Carbonara](https://de.wikibooks.org/wiki/Kochbuch/_Spaghetti_alla_carbonara)
hat Zutaten und Schritte, **keine Minute** — dann keine erfundene 15/45.

## 4. Architektur

```text
cook-parse.ts
  parseSpiceMerke / parseCookIntent / parseCookConfirm
       ↓
handleCook
  last_eye_image
  vision → { name, sure }[]     unsicher raus
  pending cook_confirm          Ja / ohne / dazu
  readSpicePin + spiceAlias()
  research URL
       ↓
  recipe-ld.ts                  JSON-LD @type Recipe der zitierten Seite
       oder wikibooks.ts        de.wikibooks.org/w/api.php  (Proxy-Host dazu)
       oder themealdb           nur Nutzer-Key
       ↓
  formatCookReply               ISO-Zeiten, HowToStep, Yield
  SourcesBlock zu               Badge „N Quellen“
```

JSON-LD: nur Host der zitierten URL, ein GET, kein zweiten Shop crawlen.
`de.wikibooks.org` in `WEB_PROXY_HOSTS` (wie Wikipedia). Credit:
Seite + CC-BY-SA + Link zur Autorenliste (`?action=history`).

Konflikte: Küchenwort droppt `haushalt` und nacktes `eye`. `food` nur
EAN/„Zutaten von Marke“.

## 5. Antwortform (Parser)

```text
<Titel laut Quelle>

Zubereitung: 15 Min (prepTime)
Garzeit: 30 Min (cookTime)          — nur wenn Feld da
Gesamtzeit: 45 Min inkl. Backofen 180 °C
Portion: 2 (recipeYield)

Zutaten
• 2 Eier — Bild
• 200 g Nudeln — Bild
• Salz, Pfeffer — Gewürzregal

Nicht im Vorrat, Quelle nennt: Parmesan

Zubereitung
1. …   (HowToStep.text oder Wikibooks-Liste)
2. …
```

Unsicher: „Glas mit rotem Deckel — nicht verwendet.“
Keine Quelle / kein Markup und kein Wiki-Treffer → keine Schritte.

## 6. Won’t

Erfundene Rezepte oder Zeiten. Lieferdienst. Chefkoch-Farm.
TheMealDB-Testkey in der APK. DummyJSON als Essen. FlavorDB.
YOLO in der APK. Structured-Output+Search in einem Call.
Stilles Öl/Salz. Zweites Gedächtnis. 5. Hirn. Allergie-Diagnose.
Bildgenerator. Einkauf ohne Ja. `food` umbiegen. Organizer als 65.

## 7. Gerät-PO (nach Execute)

1. News/Research: Badge „N Quellen“, Liste erst nach Aufklappen.
2. Gewürz-Foto + merke → Recall dieselbe Liste (Synonym nicht verdoppeln).
3. Zutaten-Foto → erst Bestätigung, dann Rezept.
4. Carbonara über Wiki: Schritte ja, Zeiten „Quelle nennt keine Zeit.“
5. Seite mit `PT15M`/`PT45M`: genau diese Minuten.
6. Pin nur Salz/Pfeffer → genau die.
7. „Parmesan fehlt. Auf die Liste?“ ohne Ja: Liste unverändert.
8. Nutella-EAN = food. Carbonara **suchen** = research. Wäsche-kochen = haushalt.

## 8. Sprints

| Sprint | Version | Thema |
|--------|---------|-------|
| [342](./sprints/sprint-342.md) | `18.11.0` | Quellen zu; Badge zählt — **CODE** |
| [343](./sprints/sprint-343.md) | `18.11.1` | Gewürz-Pin + Synonyme — **CODE** |
| [344](./sprints/sprint-344.md) | `18.11.2` | Koch-Agent, Vision, Bestätigung — **CODE** |
| [345](./sprints/sprint-345.md) | `18.11.3` | JSON-LD / Wikibooks, Zeiten, Schritte, Einkauf-Ja — **CODE** |
| [346](./sprints/sprint-346.md) | `18.11.4` | Tests, Copy, Sweep, Härten — **CODE** |

Harte Kette: 342 frei. 343 → 344 → 345. 346 zuletzt.
Testblatt: [`TEST-18.11.md`](./TEST-18.11.md). App-Code **`18.11.4`**. Sideload bleibt `18.10.0` bis Execute-APK.
