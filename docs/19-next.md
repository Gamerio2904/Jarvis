# 19 — Alltag, Kontext, Gedächtnis (`1.14`–`1.20`)

PO 2026-08-16: Einkauf als Liste, Losgehen mit Nachfrage + Route, Erinnerung „wenn ich zuhause bin“, Personen an Orte, Kontext, Gedächtnis das stimmt, Auge, menschlicher Ton, schärferer Router.

Mitgeliefert in **`1.24.0`**. Jede Stufe bleibt sideloadbar dokumentiert.

Reihe davor (fertig): [`18-next.md`](./18-next.md) · App jetzt: **`1.24.0`** (1.16–1.24 in einem Wurf).

## Stand im Code (`1.24.0`) — Snapshot der Reihe, nicht Live-Router

Live-Router `2.2.2`: [`00-now.md`](./00-now.md) / [`10-intelligence-capabilities.md`](./10-intelligence-capabilities.md). Unten: was **diese** Reihe geliefert hat.

| Thema | Was der Code tut | Was er nicht tut |
|-------|------------------|------------------|
| Chat-Route | help → ordinal → TV → Maps → Memory → Einkauf → Geburtstag → Zuhause → Los → Tageslage → Kalender → Wecker → Timer → Erinnerung → Tools → Auge → Wetter → Chatsuche → LLM | Memory-Sätze mit „und“ werden nicht gesplittet |
| Letzter Schritt | „lösch das“, „und um 16?“, „und morgen?“, „das zweite“ nach einer Liste | Ohne Liste davor: Nachfrage |
| Memory | Gleicher Block lokal und Gemini; Name; Orte, Nummern, Geburtstage | Kein Play-Geofence |
| Einkauf | Eigene Liste, kein Confirm. „Milch kaufen“ ist Einkauf | Geteilte Familienliste |
| Ort | GPS, Personenorte, Maps (Auto/Fuß/Bahn), Losgehen-Fahrzeit, JS-Zaun Zuhause | Gerät aus löst nicht aus |
| Kalender | Chat + Monat-GUI, Ort im selben Satz | Google-Kalender-Sync |
| Suche | Opt-in + Gemini; lokal in Chats; ohne Quellen ehrlich | Raten von Rezepten/Fakten |
| Auge | Foto nur mit Gemini, Bild zu Google | On-Device-Sehen mit 0,5B |
| Titel | Folgt jeder neuen User-Sache, nicht Follow-ups | — |
| Ton | Persona + Guards: **Siezen**, kurz, trocken (`persona.ts`) | Master/Sir in jeder Bubble |
| Modell | Lokal 0,5B **oder** Gemini (aus, bis Sie es anmachen) | ChatGPT-Qualität lokal |

Lokal 0,5B wird durch diese Reihe **nicht** schlauer im Denken. Schärfe kommt aus Router, Speicher und ehrlichen Tools.

## Reihenfolge

| Version | Inhalt | Warum getrennt | Status |
|---------|--------|----------------|--------|
| **`1.14.0`** | **Kontext** + Gedächtnis gleich + Titel + ehrliche Suche | PO: letzter Schritt, zwei Dinge, ein Name, kein Raten | **CODE** |
| **`1.15.0`** | **Personen/Orte** + Maps-Route | Eigenes Modell, Settings, Tipp in Maps | **CODE** |
| **`1.16.0`** | **Einkauf als Liste** | Confirm-Todo ist kein Einkauf | **CODE** (in `1.24.0`) |
| **`1.17.0`** | **Losgehen** (fragen + Route) | Braucht Ort am Termin/an der Person | **CODE** (in `1.24.0`) |
| **`1.18.0`** | **Wenn ich zuhause bin** | Braucht gespeichertes Zuhause | **CODE** (in `1.24.0`) |
| **`1.19.0`** | **Menschlicher** + eine Tageslage | Ton und eine Antwort, keine fünf Blöcke | **CODE** (in `1.24.0`) |
| **`1.20.0`** | **Auge** (Foto, nur Gemini) | Eigenes Recht, eigenes Netz | **CODE** (in `1.24.0`) |

Sprints: [`sprint-66`](./sprints/sprint-66.md) … [`sprint-72`](./sprints/sprint-72.md).

## `1.14` — Kontext + ein Gedächtnis — **CODE**

Gleicher Memory-Block in lokalem Prompt und Gemini. Steht ein Name, nur der. Sonst keinen erfinden.

Letztes Tool, nicht nur Wetter: „lösch das“, „und um 16?“, „und morgen?“.

Zwei Tool-Sätze an „und“: „Wecker 7 und Timer 8 Minuten Nudeln“. Memory-Sätze („Ich heiße Max und trinke Kaffee“) bleiben ganz.

Suche: Quellen oder eine ehrliche Zeile. Chat-Titel folgt dem neuen Thema.

**Probe:** Name setzen → „Wer bin ich?“ lokal und mit Gemini gleich. Termin → „lösch das“. „Wecker 7 und Timer 1 Minute Test“ legt beides an. Suche ohne Netz: Absage, kein Rezept.

## `1.15` — Personen/Orte + Maps — **CODE**

„Freundin wohnt in Heilbronn“, „Jane — Praxis Bahnhofstraße“, „Ich wohne in …“. Kategorie `place`, löschbar unter Memory → Orte.

„Fahr mich zur Freundin“ / „fahr mich nach Heilbronn“: Antwort plus Knopf **Route in Google Maps** (`maps/dir`, Autofahrt). Öffnet die Maps-App, wenn sie da ist.

Ohne Ort: nachfragen („Wo ist …?“), die nächste Ortszeile merken, dann den Link. Kein Raten.

„Fahr mich zu Personen“ listet alle gespeicherten Orte mit je einem Knopf.

**Probe:** Ort setzen → „Wo wohnt die Freundin?“. Dann „Fahr mich zur Freundin“ → Maps. Unbekannte Person: Frage, kein Link.

## `1.16` — Einkauf als Liste — **CODE**

Eigene Liste, nicht Todo-Confirm.

„Milch“, „auch Brot“, „was fehlt?“, „Milch hab ich“. Kein Ja/Nein für jedes Lebensmittel. Persistenz lokal.

**Probe:** drei Dinge nennen, Liste zeigen, eines abhaken.

## `1.17` — Losgehen (fragen + Route) — **CODE**

„Wann muss ich zum Zahnarzt los?“

1. Termin finden.
2. **Ort am Termin im selben Satz:** `Termin morgen 15 Uhr Zahnarzt Bahnhofstraße` speichert Titel + Ort. Fehlt der Ort und keine Person/Praxis im Gedächtnis → **nachfragen**, merken, nicht raten.
3. Standort jetzt (GPS, Recht). Fehlt das Recht oder der Fix → nachfragen, keine erfundene Fahrzeit.
4. Route/Dauer über Netz (kein Google-Login). Ankunft = Termin minus Fahrzeit plus Puffer. Netz tot → ehrlich sagen. Maps-Knopf wie in `1.15`.

**Probe:** `Termin morgen 15 Uhr Zahnarzt Bahnhofstraße` → Ort liegt. Termin ohne Adresse → Frage. Ort nennen → Uhrzeit zum Losgehen.

## `1.18` — Wenn ich zuhause bin — **CODE**

„Wenn ich zuhause bin, Müll raus.“

Braucht gespeichertes **Zuhause** (aus `1.15` oder Nachfrage). Handy **an**, Standort erlaubt. Gerät komplett aus: **kein** Auslösen. OEM kann den Ort im Standby killen — gleiche Ehrlichkeit wie Wake-Word.

**Probe:** Zuhause setzen, Erinnerung anlegen, zuhause ankommen → Hinweis. Ohne Zuhause-Ort: nachfragen.

## `1.19` — Menschlicher + Tageslage — **CODE**

Eine Antwort auf „Guten Morgen“ / „Was steht an?“: Wetter (wenn Ort da) + nächster Termin + offene Wecker/Timer + Einkauf/Todos. Kurz.

Ton: Siezen halten. Kein Confirm für risikolose Liste. Nicht jedes Mal „klingelt bei Bildschirm aus“. Nach Timer optional ein sachlicher Folgesatz („Nudeln — abgießen?“). Witze selten, nur wenn Delight an.

**Probe:** morgens ein Prompt, eine Bubble. Kein Aufsatz.

## `1.20` — Auge — **CODE**

Foto/Zettel/Packung, **nur wenn Gemini an**. Sonst: „Dafür Gemini an.“ Kein On-Device-Sehen mit 0,5B. Bild geht zu Google — Settings sagen das.

**Probe:** Zettel fotografieren → Text. Gemini aus → klare Absage.

## Intelligenter (verbindlich, verteilt)

| Punkt | Version |
|-------|---------|
| Letzter Schritt für alle Tools | `1.14` **CODE** |
| Zwei Dinge in einem Satz | `1.14` **CODE** |
| Memory in Gemini und lokal gleich | `1.14` **CODE** |
| Suche: Quellen oder ehrlich | `1.14` **CODE** |
| Chat-Titel nicht festgefressen | `1.14` **CODE** |
| Personen/Orte | `1.15` **CODE** |
| Route in Google Maps | `1.15` **CODE** |
| Nicht raten, nachfragen (Ort, Person, Zuhause) | `1.15`, `1.17`, `1.18` |
| Ort am Termin im selben Satz | `1.17` **CODE** |
| Extra-Alltag (Nummer, Maps-Modus, Geburtstag, Serie, Widget, das zweite, Chatsuche) | `1.21`–`1.24` **CODE** — [`20-next.md`](./20-next.md) |

## Won’t in dieser Reihe

Play Store, iOS, Google-Kalender-OAuth, ChatGPT lokal, Alexa-Wake-Word, Tracking im Hintergrund außer dem, was die jeweilige Stufe **sichtbar** braucht (Ort für Route/Geofence, Kamera für Auge). Gerät komplett aus: kein Losgehen-Alarm, kein „zuhause“.
