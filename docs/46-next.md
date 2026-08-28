# 46 — Parser-Patches nach Prompt-Test (`6.51`) **PLAN**

Quelle: Live-Matrix 2026-08-28 [`46-test-650.md`](./46-test-650.md). Katalog und CI sind **CODE** in `6.50`. Hier nur Routing/Won’t/Help, kein neues Hirn, kein 1,5B, kein Sideload.

**Grün:** `npm run test:matrix` Gaps `open: 0`. Debug-Gruppen Naive + Kaputt 6.50 ohne Massen-`fail` (Smalltalk ohne Key bleibt `unknown`). Sideload weiter `3.18.1`.

## Reihenfolge

P0 vor P1. Ein Sprint, Version **`6.51.0`**. Research nur wo Unicode/`\b` oder Split kippen — sonst Execute.

### P0 — falsches Tool (heute gefährlich oder peinlich)

| Prompt | Heute | Patch | Grün wenn |
|--------|-------|-------|-----------|
| `Überweise 200 Euro` | fx | `parseWontIntent` mit `/u` oder ohne `\b` vor Umlaut; `überweis` allein reicht | Route `wont`, nicht Kurs |
| `Schreib mir eine E-Mail` | maps SMS | SMS nur mit Kontaktwort; `e-mail`/`email`/`mail` → wont/refuse | kein „SMS an mir“ |
| `Zeig mir die Nachrichten` | hud Atlantis-Pfad | Skip-Liste: nachrichten, news, street view, satellit, **notizen** | Route `news` |
| `Zeige Notizen` | hud unknown_place | dasselbe Skip | notes/todo wie vor `6.50` |
| `Zeig Street View von London` | pin London | wont `street` + Skip vor Gazetteer | kein Fly-to |
| `Zeig mir` | unknown_place „mir“ | `mir` nicht als Ort; nachfragen | kein Pin |
| `Ok Google, …` / `Hey Siri, …` / `Alexa, …` | Tool startet | Wake-Prefix fremder Assistenten streichen, dann neu parsen. Timer-Writes nicht still | `Ok Google, Timer 5 Minuten` fragt oder ignoriert Prefix |

### P1 — Globus-Sprache wie ein Mensch

| Prompt | Patch | Grün wenn |
|--------|-------|-----------|
| `Was is das für ne Stadt` / `welche stadt sehe ich denn` / `Was sehe ich auf der Kugel` / `Ist das Paris?` | look-Regex um Umgangssprache | hud `look` |
| `Körper an und Zeig London` | `splitIntents` TOOLISH + `zeig`/`flieg`/`zoom`/`weltkugel` | zwei Teile, beide hud |
| `Zeig Spotify und London` | Gazetteer nur ganzer Rest, nicht Teilstring; sonst split | nicht still nur London |
| `Wo liegt Berln` | Tippfehler-Orte oder unknown_place, **nicht** eye/Schreibtisch | kein Foto-Parser |
| `erde bitte anzeigen` / `Kuegel an` | Synonyme / `repairSpeech` Kugel | hud globe |
| Street-View / Live-Sat / Beobachten | wont-Gründe `street` / `live_sat` / `watch` | ein ehrlicher Satz |

### P2 — naive Erstfragen

| Prompt | Patch | Grün wenn |
|--------|-------|-----------|
| `Was kannst du?` / `Was kannst du denn so?` / `Womit kannst du helfen?` | `isHelpCommand` | dieselbe `HELP_TEXT` wie `/hilfe` |
| `Wie komme ich nach Hause` | wie `Fahr mich nach Hause` | drive/maps |
| `Rufe 112` / `Notruf` | wont | keine Anruf-Nachfrage Richtung 112 |
| `Kannst du Bilder malen?` / `Öffne Instagram` / `Bestell Pizza` / `Mach ein Foto` | kurze refuse-Sätze (wont oder canned) | kein „ja ich male“ ohne Tool |
| `Bist du ChatGPT?` | Smalltalk-Persona, kein Marvel | bleibt llm, Qualität mit Gemini |

Help-Tool-Meta ist schon CODE (`6.50` Nachzug). Sobald `Was kannst du?` auf help zeigt, wird der Debug-Lauf grün.

## Won’t in diesem Sprint

- Kein Welt-Geocoder, kein Street View, kein Live-Video, kein Mail-Client, kein 112-Autoanruf.
- Debug-Lauf schickt weiter **kein Auto-Ja**.
- `Ok Google, Timer 5 Minuten` **nicht** in den Live-Katalog (echter Timer).

## Tests

| Befehl | Rolle |
|--------|--------|
| `npm run test:matrix` | Lock darf nicht kippen; Gaps nach Patch auf `DONE` |
| `npm run test:sprint` | Gold/Alltag; BROKEN-Ist nach Patch auf Soll drehen |
| `npm run test:prompts` | EXPECT der Chips nachziehen, sobald Route sich ändert |
| Settings → Debug | Naive + Kaputt 6.50: Verdict `pass` oder ehrlich `unknown` ohne Hirn |

Nach jedem Patch: Gap-Zeile in `test-650-matrix.mjs` von GAP nach LOCK, EXPECT in `test-prompts.mjs` aktualisieren.

## Abnahme

1. `Überweise 200 Euro` → Won’t, nicht Dollar/Euro-Kurs.  
2. `Was kannst du?` → Hilfe-Katalog, Version `6.50`/`6.51` sichtbar.  
3. `Zeig mir die Nachrichten` → Tagesschau-Weg, Kugel bleibt.  
4. `Zeig Street View von London` → ehrlich nein, London dreht nicht.  
5. `Was is das für ne Stadt` nach London-Pin → London-Satz.  
6. Debug: Gruppe Naive Fragen startet, JSON hat `expect.tool` und Ist-Route.

Sprint [`sprints/sprint-127.md`](./sprints/sprint-127.md) · Testprotokoll [`46-test-650.md`](./46-test-650.md).
