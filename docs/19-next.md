# 19 — Alltag, Kontext, Gedächtnis (`1.14`–`1.20`)

PO 2026-08-16: Einkauf als Liste, Losgehen mit Nachfrage + Route, Erinnerung „wenn ich zuhause bin“, Personen an Orte, Kontext, Gedächtnis das stimmt, Auge, menschlicher Ton, schärferer Router.

Kein Alles-in-einem-Wurf. Jede Stufe ist sideloadbar. **Nichts davon ist im Code, bis die Version `CODE` heißt.**

Reihe davor (fertig): [`18-next.md`](./18-next.md) · App jetzt: **`1.13.2`**.

## Stand im Code (`1.13.2`) — nicht schönreden

| Thema | Was der Code tut | Was er nicht tut |
|-------|------------------|------------------|
| Chat-Route | help → TV → Memory → Kalender → Wecker → Timer → Erinnerung → Tools → Wetter → Research → LLM | Zwei Befehle in einem Satz; „lösch das“ ohne Namen |
| Wetter-Kontext | „und morgen?“ nur nach einem Wetter-Turn | Gleiches für Termin/Timer/Liste |
| Memory | Name, Getränk, Essen, freie Notiz; lokal + in den Prompt | Personen, Orte, ein Name in Gemini **und** lokal immer gleich |
| Todos | „Milch kaufen“ → Confirm Ja/Nein | Einkaufsliste ohne Theater |
| Ort | Einmal GPS für Wetter (`JarvisGeo`, `last_lat`/`last_lon`) | Geofence, Zuhause, Route |
| Kalender | Chat + Monat-GUI, `21.08.` seit `1.13.1` | Adresse am Termin, Fahrzeit |
| Suche | Opt-in + Gemini; sonst feste Absage | Immer Quellen; kein Raten wenn Netz fehlt |
| Titel | Erste User-Zeile bleibt oft stehen | Titel nach dem echten Thema |
| Ton | Persona + Guards: **Siezen**, kurz, trocken (`persona.ts`) | Master/Sir in jeder Bubble (steht in alten Docs, **nicht** im Live-Prompt) |
| Modell | Lokal 0,5B **oder** Gemini (aus, bis Sie es anmachen) | ChatGPT-Qualität lokal |

Lokal 0,5B wird durch diese Reihe **nicht** schlauer im Denken. Schärfe kommt aus Router, Speicher und ehrlichen Tools.

## Reihenfolge

| Version | Inhalt | Warum getrennt | Status |
|---------|--------|----------------|--------|
| **`1.14.0`** | **Gedächtnis das stimmt** + Personen/Orte | Sonst zwei Identitäten (Max-Chip / Timon) | **PLANNED** |
| **`1.15.0`** | **Kontext** überall + Titel + zwei Dinge + Suche ehrlich | Wetter-Follow-up allein reicht nicht | **PLANNED** |
| **`1.16.0`** | **Einkauf als Liste** | Confirm-Todo ist kein Einkauf | **PLANNED** |
| **`1.17.0`** | **Losgehen** (fragen + Route) | Braucht Ort am Termin/an der Person | **PLANNED** |
| **`1.18.0`** | **Wenn ich zuhause bin** | Braucht gespeichertes Zuhause | **PLANNED** |
| **`1.19.0`** | **Menschlicher** + eine Tageslage | Ton und eine Antwort, keine fünf Blöcke | **PLANNED** |
| **`1.20.0`** | **Auge** (Foto, nur Gemini) | Eigenes Recht, eigenes Netz | **PLANNED** |

Sprints: [`sprint-66`](./sprints/sprint-66.md) … [`sprint-72`](./sprints/sprint-72.md).

## `1.14` — Gedächtnis das stimmt + Personen/Orte

Ein Name, eine Anrede. Widerspruch ersetzt den alten Wert.

**Personen an Orte:** „Freundin wohnt in Heilbronn“, „Jane — Praxis Bahnhofstraße“. Felder lokal: Name, Beziehung, Ort (Text und optional Koordinate). Löschbar in den Einstellungen.

Lokal und Gemini bekommen **denselben** Memory-Block. Hallo/Identität nennt den gespeicherten Namen, nicht einen geratenen.

**Probe:** Name setzen → „Wer bin ich?“ lokal und mit Gemini gleich. „Freundin wohnt in …“ → später „Wo wohnt die Freundin?“

## `1.15` — Kontext + intelligenter Router

Gilt für das **letzte** Tool, nicht nur Wetter:

- „und um 16?“, „und morgen?“, „lösch das“, „das zweite“
- Zwei Dinge in einem Satz: „Wecker 7 und Timer 8 Minuten Nudeln“
- Chat-Titel folgt dem Thema, bleibt nicht auf „Kuchenrezepte“
- Suche: Quellen **oder** eine ehrliche Zeile „Netz hat nicht geantwortet“ — kein Apfelkuchen-Raten

**Probe:** Termin anlegen → „lösch das“. „Wecker 7 und Timer 1 Minute Test“ legt beides an.

## `1.16` — Einkauf als Liste

Eigene Liste, nicht Todo-Confirm.

„Milch“, „auch Brot“, „was fehlt?“, „Milch hab ich“. Kein Ja/Nein für jedes Lebensmittel. Persistenz lokal.

**Probe:** drei Dinge nennen, Liste zeigen, eines abhaken.

## `1.17` — Losgehen (fragen + Route)

„Wann muss ich zum Zahnarzt los?“

1. Termin finden.
2. **Kein Ort** am Termin und keine Person/Praxis im Gedächtnis → **nachfragen** („Wo ist der Zahnarzt?“), merken, nicht raten.
3. Standort jetzt (GPS, Recht). Fehlt das Recht oder der Fix → nachfragen, keine erfundene Fahrzeit.
4. Route/Dauer über Netz (kein Google-Login). Ankunft = Termin minus Fahrzeit plus Puffer. Netz tot → ehrlich sagen.

**Probe:** Termin ohne Adresse → Frage nach Ort. Ort nennen → Uhrzeit zum Losgehen.

## `1.18` — Wenn ich zuhause bin

„Wenn ich zuhause bin, Müll raus.“

Braucht gespeichertes **Zuhause** (aus `1.14` oder Nachfrage). Handy **an**, Standort erlaubt. Gerät komplett aus: **kein** Auslösen. OEM kann den Ort im Standby killen — gleiche Ehrlichkeit wie Wake-Word.

**Probe:** Zuhause setzen, Erinnerung anlegen, zuhause ankommen → Hinweis. Ohne Zuhause-Ort: nachfragen.

## `1.19` — Menschlicher + Tageslage

Eine Antwort auf „Guten Morgen“ / „Was steht an?“: Wetter (wenn Ort da) + nächster Termin + offene Wecker/Timer + Einkauf/Todos. Kurz.

Ton: Siezen halten. Kein Confirm für risikolose Liste. Nicht jedes Mal „klingelt bei Bildschirm aus“. Nach Timer optional ein sachlicher Folgesatz („Nudeln — abgießen?“). Witze selten, nur wenn Delight an.

**Probe:** morgens ein Prompt, eine Bubble. Kein Aufsatz.

## `1.20` — Auge

Foto/Zettel/Packung, **nur wenn Gemini an**. Sonst: „Dafür Gemini an.“ Kein On-Device-Sehen mit 0,5B. Bild geht zu Google — Settings sagen das.

**Probe:** Zettel fotografieren → Text. Gemini aus → klare Absage.

## Intelligenter (verbindlich, verteilt)

| Punkt | Version |
|-------|---------|
| Letzter Schritt für alle Tools | `1.15` |
| Zwei Dinge in einem Satz | `1.15` |
| Memory in Gemini und lokal gleich | `1.14` |
| Suche: Quellen oder ehrlich | `1.15` |
| Chat-Titel nicht festgefressen | `1.15` |
| Nicht raten, nachfragen (Ort, Person, Zuhause) | `1.14`, `1.17`, `1.18` |

## Won’t in dieser Reihe

Play Store, iOS, Google-Kalender-OAuth, ChatGPT lokal, Alexa-Wake-Word, Tracking im Hintergrund außer dem, was die jeweilige Stufe **sichtbar** braucht (Ort für Route/Geofence, Kamera für Auge). Gerät komplett aus: kein Losgehen-Alarm, kein „zuhause“.
