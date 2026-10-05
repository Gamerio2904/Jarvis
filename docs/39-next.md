# 39 — Zwei Gesichter (Jarvis / Friday) + Tablet flüssig (`4.53`) **CODE**

PO 2026-08-27: Zwei Gesichter. **Jarvis** = Smalltalk, alle Hauptfunktionen, **CarPlay/Fahrmodus**. **Friday** = Kalender und alles, was eine **Sekretärin** täte (Termine, Erinnerungen, Anrufe nach Ja, Listen, Tageslage). Stimmen entsprechend. Tabletmodus glätten.

Nachzug PO: Friday nicht nur „zweite Stimme“, sondern **Sekretärin**; Jarvis bleibt die Haupt-KI inkl. Steuer.

> **Jetzt mitgeliefert in `6.60.0`.** Schiene gelandet als **`4.53.0`**. Stimme/Kalender: [`34-next.md`](./34-next.md). Film-TTS: [`37-next.md`](./37-next.md). Hausstand: [`38-next.md`](./38-next.md). Ein Hirn (Gemini zuerst), zwei Faces.

In dieser Nachricht **keine** Tablet-Screenshots angehängt. Bugs unten aus **Code + Reel-3-Lage** ([`33-next.md`](./33-next.md)). Kommen echte Fotos nach: Gold-Zeilen in `4.55` nachziehen, nicht raten.

## Macht die Spaltung Sinn?

**Ja — als zwei Gesichter derselben Haus-AI, nicht als zwei Hirne.**

| Variante | Urteil |
|----------|--------|
| Zwei Prompts + zwei Stimmen, **ein** Register, **ein** Gedächtnis | **ja** — das ist die Idee |
| Zwei Modelle / zwei Router / zwei Tool-Kataloge | **nein** — 0,5B trägt eine Figur kaum, zwei gar nicht; Tools bleiben Haus |
| Work vs. Haus per Embedding erkennen | **nein** — Standing: keine Embeddings als Router |
| Friday behauptet Marvel / Filmzitate | **Won’t** — Name im Haus, keine Rolle |

Jarvis bleibt Default für Smalltalk und Haus/Steuer. Friday spricht, wenn der **gewählte Tool** zur Sekretärin gehört — oder wenn Sie sie rufen. Kein Embedding, keine Marvel-Rolle.

## Ist

| Thema | Stand |
|-------|--------|
| Persona | eine: `persona.ts` `PERSONA` / `GEMINI_PERSONA`, Siezen, Understatement, kein Marvel |
| TTS Gemini | nur **Charon**, Race 500 ms → oft Android Neural (`tts.ts`) |
| Android-TTS | `TextToSpeech.speak`, **keine** Stimme/Geschlecht gewählt (`JarvisVoicePlugin`) |
| Wake | nur Jarvis-Aliase (`isWakeName`: jarvis/jarwis/…/`service`) — **kein** Friday |
| Lage | `hud_force` **oder** `(min-width: 900px) and landscape`. **Ersetzt** Chat+Composer (`App.tsx` Ternary). Chat-Kachel = ein Input, **kein** Verlauf |
| Lage-Snap | alles **20 s**, inkl. Open-Meteo; Header-Uhr nur beim Render |
| News/FX/Warn/Sport-Kacheln | `last_*` oder „im Chat fragen“, nicht live |
| Grid | `auto-fit minmax(220px)` — nicht das 3-Spalten-Reel |
| Ambient | Orbs/Grain laufen weiter über der Lage |

## Leitentscheidung

| Thema | Entscheidung |
|-------|----------------|
| Produkt | **Ein** Hirn. Zwei **Gesichter**. Jarvis = Haupt-KI. Friday = Sekretärin. |
| Jarvis | Smalltalk; Stecker, TV, Spotify, PC, Wetter, News, Suche, Karte-Navi, Tanke, Bahn, POI, Lage, Schach, Haus. **Immer Fahrmodus / CarPlay** — auch wenn der Satz ein Termin ist. Männliche Stimme. |
| Friday | Sekretärin: Kalender, Erinnerung, Wecker, Todos, Einkauf, Geburtstag, Gespräch/Notiz (`digest`), Tageslage (`brief`), Feiertag/Ferien, Losgehen zum Termin, Anruf/SMS nach Ja. Weibliche Stimme. Uhrzeiten zuerst, Siezen, kein Helpdesk. |
| Tools | **ein** Register. Face **nach** der Toolwahl aus `FACE_BY_TOOL` — kein zweiter Router, keine Embeddings. |
| Drive schlägt Friday | `drive_mode` / Overlay / Navi-Ansagen → **Jarvis**. |
| Name schlägt Domain | „Jarvis, was steht an“ → Jarvis. „Friday, Wetter“ → Friday. „Friday übernimmt“ = sticky, bis Jarvis oder bis die Fahrt beginnt. |
| Umschalten | Explizit plus Domain. **Kein** Auto nach Uhrzeit. Wake „Friday“ / „Jarvis“. |
| Sticky | Setting `face`: `auto` (Default) \| `jarvis` \| `friday`. Im Backup (`38`). Fahrt = effektiv Jarvis. |
| Küchen-Timer | **Jarvis** (Haus). Wecker/Erinnerung = Friday. |
| Hirn | Dasselbe Modell. Nur Systemtext + Stimme. 0,5B: kurze Friday-Zeile. Qualität bei Gemini. |
| Gedächtnis | **geteilt**. Kein Friday-Siloe. |
| Anrede | Beide **Siezen**. Master/Sir nur Jarvis, dosiert. Friday: kein „Ma’am“, kein Marvel-Boss. |
| Name Friday | Hausname, nicht MCU. STT **nicht** `Freitag` als Wake. |
| Stimme | Eine männliche Gemini-Stimme (`4.34`) + eine weibliche (`4.54`). Native: `de-DE` male/female, kein Pitch-Fake. |
| Lage-Header | `JARVIS > Lage` oder `FRIDAY > Lage`. Avatar `J` / `F`. |
| Tablet | Lage **neben** Chat. Uhr tickt. Poll split. |
| Priorität | Hausstand [`38`](./38-next.md) vor Sideload. Tablet darf ohne Friday. Friday nach `4.34`. |

## Friday — Charakter (Sekretärin)

Wie Jarvis: Deutsch, Siezen, kurze ganze Sätze, kein Helpdesk, kein Marvel, keine Filmzitate.

Unterschied: Termin-Ton. Uhrzeiten und Namen zuerst. Kein Assistentinnen-Slang, kein Duzen, keine Emojis.

*Richtung:* „Zahnarzt Freitag 15:00. Der Nachmittag danach ist frei.“ — nicht „Gerne, ich habe Ihren Kalender aktualisiert!“

Jarvis-Smalltalk bleibt Straight Man: „Läuft. Brauchbar. Und Sie?“

Abnahme: gleiche Fakten; Face ändert Stimme + Ton. Am Steuer klingt auch ein Termin nach **Jarvis**.

## Domain — welche Tools welche Stimme

Tabelle in `face.ts`, Keys = Register-`id`. Was nicht in Friday-Liste steht = Jarvis.

| Face | Register-IDs |
|------|----------------|
| **Friday** | `calendar`, `reminder`, `alarm`, `todo`, `shopping`, `birthday`, `brief`, `holiday`, `ferien`, `leave`, `digest` |
| **Friday, nur Anruf/SMS** | `maps`, wenn Parser Anruf/SMS/Kontakt ist — nicht wenn Nav/„Fahr mich“ |
| **Jarvis** | `drive`, `timer`, `tv`, `plug`, `fan`, `pc`, `weather`, `news`, `search`, `poi`, `fuel`, `transit`, `device`, `hud`, `memory`, `eye`, Welt-Tools, Smalltalk (kein Tool) |

## Umschalten — Gold (Parser, nicht LLM)

| User | Soll |
|------|------|
| `Hey, wie geht’s?` | Jarvis, Smalltalk |
| `was steht heute so an` / `erstell einen Termin … Zahnarzt` | Friday + Kalender |
| `erinner mich um 18 Uhr Steuer` | Friday + Erinnerung |
| `Timer 8 Minuten` | Jarvis + Timer |
| `lauter` / nächste Straße im Fahrmodus | Jarvis |
| `wann Zahnarzt` am Steuer | Kalender-Daten, **Stimme Jarvis** |
| `Ruf die Freundin an` | Friday, Nachfrage, dann Wähl |
| `Fahr mich zur Freundin` | Jarvis + Fahrt/Karte |
| `Friday` / `Friday übernimmt` | sticky Friday |
| `Jarvis` / `Jarvis übernimmt` | zurück `auto` oder sticky Jarvis |
| `Jarvis, was steht an` | Kalender, Stimme Jarvis |
| `Freitag 15 Uhr Zahnarzt` | Kalender Friday — **kein** Face-Wake |
| `Work-Modus` allein | keine Face-Änderung |

Register `face`, Parser `face-parse.ts`. Domain nach `route-pick` in `face.ts`. **Kein** `if` in `chat.ts`.

## Erweiterungen (ja / später / Won’t)

| Idee | Votum |
|------|--------|
| Domain-Tabelle Sekretärin vs Haupt | **ja** — diese Erweiterung |
| Wake-Word **Friday** (friday, fraidi, freidi, fridei) | **ja** `4.58` |
| Wake **Freitag** | **Won’t** — Wochentag |
| Lage-Header + Avatar je Face | **ja** |
| Settings: `auto` / Jarvis / Friday + zwei TTS-Namen | **ja** |
| Backup enthält `face` + Stimmen | **ja** (Feld in `38`) |
| Zwei Chat-Listen | **Park** — ein Thread |
| Auto Work-Stunden → Face | **Won’t** |
| Haus-Tools immer Friday | **Won’t** — Haus = Jarvis |
| CarPlay-Friday | **Won’t** — Steuer = Jarvis |
| Zweites GGUF / zweites Gemini-Modell | **Won’t** |
| ElevenLabs, Bettany/Paltrow-Klon | **Won’t** |
| Friday als Marvel-Figur | **Won’t** |
| Getrennte Memory-Silos | **Won’t** |
| Alexa-Multi-Assistant | **Won’t** |

## Research

### `4.53.0` Leitentscheidung

Dieses Dokument. **Done.**

### `4.54.0` Research: zwei Gesichter + weibliche Stimme

1. DE-Sätze hören: weiblich Kore, Aoede, Sulafat, Vindemiatrix, Gacrux (Gemini-TTS, gleicher Key). Eine wählen. Männlich aus `4.34`, nicht zweites Karussell.  
2. Android `Voice.getName` / Gender: gibt es `de-DE-*-female` auf dem Gerät? Sonst ehrlich Native = eine Stimme.  
3. 0,5B: wie kurz darf `FRIDAY_PERSONA` sein, ohne Eval-Minuten?  
4. Prompt-Pack: `face` in Context, nicht zweites Memory.  
5. `FACE_BY_TOOL` gegen Register-IDs: Anruf vs Nav in `maps` ohne `if` in `chat.ts`.  
**Done wenn:** eine Female-`voiceName` + Native-Plan + Domain-Tabelle fest.

### `4.55.0` Research: Tablet aus Code + Screenshots

Ohne Fotos schon evident:

| Bug | Datei | Soll |
|-----|--------|------|
| Lage **unmountet** Verlauf+Composer+Mic+Foto | `App.tsx` ~1394 | Split: Kacheln + Chat-Dock |
| Chat-Kachel ohne Antworten/Streaming | `Lage.tsx` | letzte Bubbles + busy |
| Uhr steht bis zu 20 s | `Lage.tsx` `new Date()` nur Render | 1 s lokal, unabhängig vom Snap |
| Alles 20 s inkl. Wetter-HTTP | `hud.ts` | Wetter 10 min; Akku 60 s; Uhr lokal; Spotify 5 s wenn Kachel an |
| News/FX/Warn/Sport tot | `fetchHudSnap` `last_*` | dieselben Tools wie Chat, oder Kachel aus Default |
| `900px` **und** landscape | `App.tsx` mq | Tablet-hoch: Breite **oder** Setting; Phone-hoch nicht erzwingen |
| `Lage immer` auf dem Handy verschluckt Chat | `hud_force` | nach Split egal; bis dahin Warnung in Settings |
| Grid ungleich | `minmax(220px)` | ab 900 px 3 Spalten wie Reel; schmal 1–2 |
| Ambient+tileIn-Stagger auf schwachem SoC | `index.css` | Ambient pausieren wenn `.is-lage`; `content-visibility` |
| Wetter ohne Regen | `WeatherTile` nur max-Temp | Regenpunkt aus Open-Meteo `rain`, keine Fake-Kurve |

Kommt ein Screenshot: Zeile in diese Tabelle, nicht raten. **Done wenn:** Layout-Skizze + Poll-Budget fest.

## Bau

| Version | Inhalt | Status |
|---------|--------|--------|
| **`4.53.0`** | Leitentscheidung + Face + Tablet-Split | **CODE** |
| **`4.54.0`** | Research Face + Female-TTS — Kore | **CODE** |
| **`4.55.0`** | Research Tablet | **CODE** |
| **`4.56.0`** | `face-parse` + Setting + Prompts Jarvis/Friday | **CODE** |
| **`4.57.0`** | TTS binden (Gemini + Native Gender) | **CODE** |
| **`4.58.0`** | Wake Friday, nicht Freitag | **CODE** |
| **`4.59.0`** | Lage Split-Pane: Chat bleibt | **CODE** |
| **`4.60.0`** | Uhr / Poll split / keine toten Kacheln | **CODE** |
| **`4.61.0`** | Raster 3-col, Portrait, Ambient aus in Lage | **CODE** |
| **`4.62.0`** | Chat-Kachel = Verlauf + Mic | **CODE** |
| **`4.63.0`** | Gold Face + Lage; Härten | **CODE** |
| **`4.64.0`** | Header/Avatar je Face | **CODE** |
| **`4.65.0`** | Sideload **nach** Hausstand `4.52` | geplant |

Tablet `4.59`–`4.62` **darf** vor Friday, wenn HUD weh tut. Friday ohne `4.54`/`4.57` nicht sideloaden (sonst zwei Namen, eine Stimme).

## Settings-UI

Thema **Gesicht**: Auto (Sekretärin-Tools = Friday, sonst Jarvis) \| immer Jarvis \| immer Friday. Zwei TTS-Felder nach Spike. Hinweis: 0,5B unterscheidet die beiden nur schwach. Am Steuer immer Jarvis.

Tablet-Lage: Text ändern von „Chat weg“ auf „Kacheln neben dem Chat“.

## Dateien (Ziel)

| Datei | Rolle |
|-------|--------|
| `frontend/src/engine/face-parse.ts` | Umschalt-Utterances |
| `frontend/src/engine/face.ts` | `loadFace` / `setFace` / `FACE_BY_TOOL` / Drive-Override |
| `frontend/src/engine/persona.ts` | `FRIDAY_PERSONA` / `GEMINI_FRIDAY` kurz |
| `frontend/src/engine/tts.ts` | `voiceName` aus Face |
| `frontend/src/engine/registry.ts` | Tool `face` |
| `frontend/native/voice/JarvisWakeService.java` | Friday-Aliase, nicht Freitag |
| `frontend/native/voice/JarvisVoicePlugin.java` | `setVoice` male/female de-DE |
| `frontend/src/App.tsx` | Lage **und** Chat; Avatar |
| `frontend/src/Lage.tsx` | Header, Uhr-Tick, Chat-Dock |
| `frontend/src/engine/hud.ts` | Poll-Budget |
| `frontend/src/index.css` | 3-col, `.is-lage` Ambient aus |
| `frontend/src/engine/store.ts` | `face` (`auto`\|`jarvis`\|`friday`), `tts_voice_jarvis`, `tts_voice_friday` |
| Tests | `face-parse` + HUD-Layout; **nicht** `registry.ts` importieren |

## Probe

1. Default Smalltalk: Jarvis. `was steht heute so an`: Friday.  
2. `Timer 8 Minuten`: Jarvis. `erinner mich 18 Uhr`: Friday.  
3. Im Fahrmodus `wann Zahnarzt`: Inhalt Kalender, Stimme Jarvis.  
4. `Ruf die Freundin an`: Friday, Nachfrage. `Fahr mich zur Freundin`: Jarvis.  
5. `Freitag 15 Uhr` bleibt Termin, kein Face-Wechsel.  
6. Tablet quer: Kacheln **und** Verlauf+Composer. Uhr springt.  
7. `/hilfe` nennt Friday nur mit Face-CODE — Sideload bis dahin `3.18.1`.

## Won’t

Zwei Modelle. Zwei Register. Embeddings. Marvel-Rolle. Stimme klonen. Wake auf „Freitag“. Friday am Steuer. Lage als Sales-CRM. Fake-Gauges. Chat auf dem Tablet **weglassen**. Jarvis-Cloud für Face-Sync.

Sprint: [`sprint-114.md`](./sprints/sprint-114.md). Männliche TTS-Spike: [`37-next.md`](./37-next.md). Backup: [`38-next.md`](./38-next.md).
