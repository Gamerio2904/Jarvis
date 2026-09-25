# 84 — Koch aus dem Vorrat (Bild, Gewürze, Rezept) **PLAN** (`18.11`)

PO: Ein Foto von den Zutaten, die da sind. Gewürze einmal fotografieren
und „merke dir meine Gewürze“ — das liegt im **Hauptgehirn**. Der Koch
wählt daraus, was zum Gericht passt (manchmal nur Salz und Pfeffer).
Antwort: Zubereitungszeit, Gesamtzeit (Backofen …), Zutatenliste,
ausführliche Schritte. Quellen unter **jeder** Nachricht zugeklappt,
aufklappbar.

Nicht parallel zu offenen 18.10-Nachziehern. Kein zweites Gedächtnis,
kein Lieferdienst, keine erfundenen Rezepte.

## 0. Ist vor dieser Etappe

| Stelle | Code | Lücke |
|--------|------|-------|
| `food` | Open Food Facts, „Zutaten von / Barcode“ | kein Rezept, kein Foto-Vorrat |
| Research | „Ich rate keine Rezepte“ | Carbonara-Suche geht ins Netz, nicht vom Bild |
| Auge | Gemini Vision, `jarvis_last_eye_image` | liest das Bild, kocht nicht daraus |
| Memory | `MERK`, Pins, ein Core | „merke dir …“ wird `notiz`, kein Gewürzregal |
| `SourcesBlock` | `<details open>` | Quellen stehen unter jeder Treffer-Nachricht offen |
| Katalog | 63 Executoren | kein Koch-Agent |

`haushalt` trifft `\bkochen\b` als **Waschschüssel**, nicht als Rezept.
`outlook-parse` hat ein Rezept-Wort — das ist Weltlage, nicht Küche.

## 1. Warum nicht die naheliegenden APIs

| Idee | Warum nicht |
|------|-------------|
| Spoonacular / Edamam | Extra-Key, Quote, Firma. Nicht der Key-Stil der App |
| Chefkoch scrapen | Copyright, kein Allowlist-Host, Won’t freies Web |
| TheMealDB Key `1` in der APK | Frei nur zum Entwickeln; öffentlich shippen verlangt deren Supporter-Key |
| LLM „denkt sich Carbonara aus“ | Honesty: „Ich rate keine Rezepte“ bleibt |
| Zweites IndexedDB / Koch-Hirn | Ein Core. Agenten lesen dieselben Pins ([`82-next.md`](./82-next.md)) |
| `food` aufblähen | OFF-Lookup und Rezept sind zwei Parser. Nutella-EAN bleibt `food` |
| 5. Organizer für „Koch steuert Research“ | Director ein Zug, Koch ruft Recherche als **Schritt**, nicht als Agent |

**Rezept-Quelle:** zuerst die **schon gebaute Recherche** (zitierte URL).
TheMealDB nur, wenn der Nutzer einen eigenen Key setzt — Allowlist-Schritt 2
wie Recover, mit Credit und `strSource`. Ohne Key: Recherche oder ehrliche
Absage. Kein Raten aus dem Modell.

Vision bleibt Gemini (Bild geht zu Google, wie Auge/OCR). Ohne Gemini:
Foto-Knopf ehrlich aus.

## 2. Leitentscheidung

| Thema | Entscheidung |
|-------|----------------|
| Koch-Agent | **64. Domänen-Agent `cook`**. Der alte Won’t „kein 64.“ galt dem **Organizer**, nicht der Küche. `food` bleibt Lebensmittel. |
| Gewürze | Ein Pin `gewuerze` im **Hauptgehirn**. Kategorie `fact`, kein 14-Tage-TTL. Origin `user` (Liste gesagt) oder `tool` (Bild + merke). |
| Vorrat-Foto | Pro Gericht neu. Liegt nicht dauerhaft als Speisekammer, nur das letzte Auge-Bild. |
| Zeiten | Nur wenn die **Quelle** Zubereitung / Gesamt / Ofen nennt. Sonst „Quelle nennt keine Zeit.“ |
| Gewürz-Wahl | Schnitt Menge Rezept ∩ Pin. Passt nur Salz/Pfeffer: genau die, und das sagen. Fehlt Kreuzkümmel: nennen, nicht erfinden. |
| Quellen-UI | `SourcesBlock` **ohne** `open` — alle Nachrichten, nicht nur Koch. |
| Antwort | Strukturierter Text (skipMicroMerge hält ≥3 Zeilen). Kein neues `ChatBlock`-Kind (70 fail-closed). |

## 3. Nutzerfluss

```text
1. Foto-Knopf: Gewürzregal
   → „merke dir meine Gewürze“
   → Vision nennt nur Sichtbares (unsicher = unsicher)
   → Pin gewuerze ersetzen (STORE). „dazu noch …“ = MERGE
   → „Liegt: Salz, Pfeffer, Paprika, Oregano.“

2. Foto-Knopf: was im Kühlschrank / auf der Theke liegt
   → „was kann ich damit kochen“ / „Rezept“
   → Vision: Zutatenliste, unsichere Gläser nicht verwenden
   → Pin gewuerze lesen
   → Recherche (zitierte URL) nach Gericht aus diesen Zutaten
   → Antwort:

      Titel (laut Quelle)
      Zubereitung: … Min   Gesamt: … Min inkl. Ofen … °C
      Zutaten
        — vom Bild
        — vom Gewürzregal (gewählt)
        — Quelle will extra: ehrlich auflisten
      Schritte 1…n ausführlich, nur aus der Quelle

3. „welche Gewürze habe ich?“ → Pin vorlesen, nichts ergänzen
   „vergiss meine Gewürze“ → Pin weg
```

Foto macht der Kamera-Knopf, kein Sprachbefehl (`wont` `photo` bleibt).
Ohne Bild: „Foto-Knopf unten.“ Ohne Netz/Gemini: ehrlich aus.
„Suche im Internet nach Carbonara“ bleibt **research**, kein Koch.

## 4. Architektur

```text
cook.ts / cook-parse.ts
  parseSpiceMerke / parseCookIntent
       ↓
parse-catalog cook   (Score > food / eye / haushalt bei Küchenwort)
       ↓
handleCook
  last_eye_image | Upload
  completeGeminiVision  (nur Sichtbares)
  readSpicePin()        memory-core, key gewuerze
  research zitiert      optional TheMealDB wenn Key
  formatCookReply()     Zeiten, Liste, Schritte
       ↓
SourcesBlock zugeklappt (App.tsx, alle research-Metas)
```

Schreiben Gewürze: Gate STORE/MERGE wie jeder Pin. Kein stilles Harvest
vom Foto ohne „merke“. Lesen: derselbe Retrieve; Koch hat einen kurzen
Helfer `readSpicePin`, kein Schatten-Store.

Konflikte (`conflicts.ts`): bei Rezept/Gewürz-Satz `haushalt` und nacktes
`eye` droppen, `food` nur wenn EAN/„Zutaten von Marke“. Prior `cook` nach
einem Koch-Zug.

## 5. Antwortform (Parser, nicht Modell-Prosa)

```text
<Titel laut Quelle>

Zubereitung: 15 Min (Quelle)
Gesamtzeit: 45 Min inkl. Backofen 180 °C (Quelle)

Zutaten
• 2 Eier — Bild
• 200 g Nudeln — Bild
• Salz, Pfeffer — Gewürzregal

Nicht im Vorrat, Quelle nennt: Parmesan

Zubereitung
1. …
2. …
```

Unsicheres auf dem Bild: „Unsicher: Glas mit rotem Deckel — nicht verwendet.“
Keine Quelle → keine Schritte, Absage wie Research.

## 6. Won’t

Erfundene Rezepte oder Zeiten. Lieferdienst (`food_order`). Chefkoch-Crawl.
TheMealDB-Testkey in der Sideload-APK. Zweites Gedächtnis. 5. Hirn.
Allergie-Diagnose. Bildgenerator „so sieht das Gericht aus“.
Automatisch Einkauf ohne Ja. `food` umbiegen. Organizer als 65.

## 7. Gerät-PO (nach Execute)

1. Quellen unter News/Research sind zu; Antippen klappt die Links auf.
2. Gewürz-Foto + merke → Recall nennt genau die sichtbaren Namen.
3. Zweites merke ersetzt die Liste; „dazu noch Thymian“ hängt an.
4. Zutaten-Foto + Rezept → Zeiten nur mit Quellenwort, Schritte ausführlich.
5. Nur Salz/Pfeffer im Pin → Gericht darf genau die nehmen und sagt das.
6. Carbonara **suchen** bleibt Research. Nutella-EAN bleibt food.
7. Ohne Foto: Foto-Knopf, kein Raten.

## 8. Sprints

| Sprint | Version | Thema |
|--------|---------|-------|
| [342](./sprints/sprint-342.md) | `18.11.0` | Quellen unter jeder Nachricht zu, aufklappbar |
| [343](./sprints/sprint-343.md) | `18.11.1` | Gewürz-Pin im Hauptgehirn |
| [344](./sprints/sprint-344.md) | `18.11.2` | Koch-Agent + Bild → Zutaten |
| [345](./sprints/sprint-345.md) | `18.11.3` | Rezept: Zeiten, Liste, Schritte, Gewürz-Wahl |
| [346](./sprints/sprint-346.md) | `18.11.4` | Tests, Copy, Sweep, Härten |

Harte Kette: 342 frei. 343 → 344 → 345. 346 zuletzt.
Testblatt: [`TEST-18.11.md`](./TEST-18.11.md).
