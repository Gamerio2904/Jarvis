# 39 — Zwei Gesichter (Jarvis / Friday) + Tablet flüssig (`4.53`) **PLAN**

PO 2026-08-27: Persönlichkeit spalten — **männlich Jarvis** (Work + normales Smalltalk = **Haupt-KI**) und **weiblich Friday**; Stimmen entsprechend. Dazu: was sonst noch dazu gehört. Und **Tabletmodus** aus Screenshots glätten, alles flüssiger.

Code jetzt: **`3.18.1`**. Stimme/Kalender-Fenster: [`37-next.md`](./37-next.md) / mergen `3.19`. Hausstand vor Sideload: [`38-next.md`](./38-next.md).

In dieser Nachricht **keine** Tablet-Screenshots angehängt. Bugs unten aus **Code + Reel-3-Lage** ([`33-next.md`](./33-next.md)). Kommen echte Fotos nach: Gold-Zeilen in `4.55` nachziehen, nicht raten.

## Macht die Spaltung Sinn?

**Ja — als zwei Gesichter derselben Haus-AI, nicht als zwei Hirne.**

| Variante | Urteil |
|----------|--------|
| Zwei Prompts + zwei Stimmen, **ein** Register, **ein** Gedächtnis | **ja** — das ist die Idee |
| Zwei Modelle / zwei Router / zwei Tool-Kataloge | **nein** — 0,5B trägt eine Figur kaum, zwei gar nicht; Tools bleiben Haus |
| Work vs. Haus per Embedding erkennen | **nein** — Standing: keine Embeddings als Router |
| Friday behauptet Marvel / Filmzitate | **Won’t** — Name im Haus, keine Rolle |

Jarvis bleibt Default. Friday kommt nur, wenn Sie sie **rufen** oder umschalten. Smalltalk ohne Namen = Jarvis.

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
| Produkt | **Ein** Jarvis. Zwei **Gesichter**: Jarvis (männlich, Default, Work + Smalltalk), Friday (weiblich, auf Zuruf). |
| Friday-Job | **Haus-Nähe / zweite Stimme**, nicht ein zweites Betriebssystem. Tools bleiben gemeinsam. Ton: etwas wärmer, trotzdem Siezen, Understatement, kein Kumpel-Slang. |
| Umschalten | Explizit: „Friday“, „Friday übernimmt“, Chip in Settings/Lage, Wake „Friday“. Zurück: „Jarvis“, „Jarvis übernimmt“. **Kein** Auto nach Uhrzeit, **kein** Auto „das klingt nach Arbeit“. |
| Ein Turn mit Namen | „Friday, Licht aus“ → diese Antwort Friday-Stimme + Friday-Prompt; Default danach **bleibt** wie vorher (sticky), bis der andere Name kommt. |
| Sticky | Setting `face`: `jarvis` \| `friday`. Überlebt App-Neustart. Im Backup (`38`). |
| Hirn | Dasselbe Modell (Gemini wenn an, sonst 0,5B). Nur Systemtext wechselt. 0,5B: **kurze** Friday-Zeile, nicht zweites Manifest — Qualität sitzt bei Gemini. |
| Router | **ein** Register. Friday wählt keine anderen Tools. 0,5B wählt weiter keine Tools. |
| Gedächtnis | **geteilt** (Kontakte, Kalender, Stecker, Keys). Kein Friday-Siloe. Optional später: Tag `face` an Messages — nicht zwei Chatlisten in v1. |
| Anrede | Beide **Siezen**. Master/Sir nur Jarvis, dosiert. Friday: Siezen, **kein** „Ma’am“-Englisch, kein Marvel-„Boss“. |
| Name Friday | Hausname. Prompt: nicht Pepper, nicht MCU, keine Filmzitate. STT **nicht** `Freitag` als Wake (Kalender). |
| Stimme | Nach Spike: eine männliche Gemini-Stimme (an `4.34` andocken) + eine weibliche. Native-Fallback: `de-DE` männlich vs. weiblich, nicht Pitch-Fake. Race/Budget aus `37` gilt **pro Gesicht**, nicht zwei Karussells. |
| Lage-Header | `JARVIS > Lage` oder `FRIDAY > Lage`. Avatar `J` / `F`. |
| Tablet | Lage **neben** Chat, nicht statt. Composer+Mic bleiben. Uhr tickt. Poll split. |
| Priorität | Hausstand [`38`](./38-next.md) vor Sideload. Tablet-Glättung darf **ohne** Friday landen (bestehendes HUD). Friday nach TTS-Spike `4.34`. |

## Friday — Charakter (Anker, nicht Copy-Paste)

Wie Jarvis: Deutsch, Siezen, kurze ganze Sätze, kein Helpdesk, kein Marvel.

Unterschied: etwas hellere Wärme, weniger Straight-Man-Kälte, immer noch tot-ruhig. Kein „Hihi“, keine Emojis, kein Duzen.

*Richtung:* „Licht ist aus.“ / „Steckdose Küche tot — das wäre suboptimal.“ — nicht „Gerne, Liebling!“

Abnahme: zwei gleiche User-Zeilen klingen nicht nach Copy-Paste; Umschalten ändert **Stimme + leichten Ton**, nicht die Fakten.

## Umschalten — Gold (Parser, nicht LLM)

| User | Soll |
|------|------|
| `Friday` / `Hey Friday` / `Friday übernimmt` | `face=friday`, kurze Bestätigung in Friday-Stimme |
| `Jarvis` / `Hey Jarvis` / `Jarvis übernimmt` | `face=jarvis` |
| `Friday, mach die Steckdose aus` | sticky friday + Tool Steckdose (Register wie immer) |
| `Freitag Zahnarzt` | **Kalender**, nicht Face |
| `Work-Modus` / `Arbeit` allein | **keine** Face-Änderung (zu vage) |
| `Sprich als Friday` | gleich `face=friday` |

Register-Eintrag `face` (sideEffect write), Parser `face-parse.ts`. **Kein** `if` in `chat.ts`. Konflikte: `Freitag` vs Friday nur über Wake/Anrede am Satzanfang, nicht substring.

## Erweiterungen (ja / später / Won’t)

| Idee | Votum |
|------|--------|
| Wake-Word **Friday** (Aliase: friday, fraidi, freidi, fridei) | **ja** `4.58` |
| Wake **Freitag** | **Won’t** — Wochentag |
| Lage-Header + Avatar je Face | **ja** |
| Settings: Face + zwei TTS-Namen nach Spike | **ja** |
| Backup enthält `face` + Stimmen | **ja** (Feld in `38`) |
| Zwei Chat-Listen Arbeit/Haus | **Park** — ein Thread |
| Auto Work-Stunden → Jarvis | **Won’t** v1 (überrascht) |
| Haus-Tools immer Friday-Stimme, PC immer Jarvis, ohne Prompt | **Park** — erst explizit |
| Zweites GGUF / zweites Gemini-Modell | **Won’t** |
| ElevenLabs, Bettany/Paltrow-Klon | **Won’t** (schon `37`) |
| Friday als Marvel-Figur | **Won’t** |
| Getrennte Memory-Silos | **Won’t** v1 |
| Alexa-Multi-Assistant | **Won’t** |

## Research

### `4.53.0` Leitentscheidung

Dieses Dokument. **Done.**

### `4.54.0` Research: zwei Gesichter + weibliche Stimme

1. DE-Sätze hören: weiblich Kore, Aoede, Sulafat, Vindemiatrix, Gacrux (Gemini-TTS, gleicher Key). Eine wählen. Männlich aus `4.34`, nicht zweites Karussell.  
2. Android `Voice.getName` / Gender: gibt es `de-DE-*-female` auf dem Gerät? Sonst ehrlich Native = eine Stimme.  
3. 0,5B: wie kurz darf `FRIDAY_PERSONA` sein, ohne Eval-Minuten?  
4. Prompt-Pack: `face` in Context, nicht zweites Memory.  
**Done wenn:** eine Female-`voiceName` + Native-Plan + Prompt-Länge in der Tabelle.

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
| **`4.53.0`** | Leitentscheidung | **PLAN** |
| **`4.54.0`** | Research Face + Female-TTS | geplant |
| **`4.55.0`** | Research Tablet | geplant |
| **`4.56.0`** | `face-parse` + Setting + Prompts Jarvis/Friday | geplant |
| **`4.57.0`** | TTS binden (Gemini + Native Gender) | nach `4.34`/`4.54` |
| **`4.58.0`** | Wake Friday, nicht Freitag | geplant |
| **`4.59.0`** | Lage Split-Pane: Chat bleibt | geplant |
| **`4.60.0`** | Uhr / Poll split / keine toten Kacheln | geplant |
| **`4.61.0`** | Raster 3-col, Portrait, Ambient aus in Lage | geplant |
| **`4.62.0`** | Chat-Kachel = Verlauf + Mic | geplant |
| **`4.63.0`** | Gold Face + Lage; Härten | geplant |
| **`4.64.0`** | Header/Avatar je Face | geplant |
| **`4.65.0`** | Sideload **nach** Hausstand `4.52` | geplant |

Tablet `4.59`–`4.62` **darf** vor Friday, wenn HUD weh tut. Friday ohne `4.54`/`4.57` nicht sideloaden (sonst zwei Namen, eine Stimme).

## Settings-UI

Thema **Gesicht** (oder unter Stimme): Jarvis | Friday. Zwei TTS-Felder nach Spike, Default leer = Spike-Wahl. Hinweis: 0,5B unterscheidet die beiden nur schwach.

Tablet-Lage: Text ändern von „Chat weg“ auf „Kacheln neben dem Chat“.

## Dateien (Ziel)

| Datei | Rolle |
|-------|--------|
| `frontend/src/engine/face-parse.ts` | Umschalt-Utterances |
| `frontend/src/engine/face.ts` | `loadFace` / `setFace` |
| `frontend/src/engine/persona.ts` | `FRIDAY_PERSONA` / `GEMINI_FRIDAY` kurz |
| `frontend/src/engine/tts.ts` | `voiceName` aus Face |
| `frontend/src/engine/registry.ts` | Tool `face` |
| `frontend/native/voice/JarvisWakeService.java` | Friday-Aliase, nicht Freitag |
| `frontend/native/voice/JarvisVoicePlugin.java` | `setVoice` male/female de-DE |
| `frontend/src/App.tsx` | Lage **und** Chat; Avatar |
| `frontend/src/Lage.tsx` | Header, Uhr-Tick, Chat-Dock |
| `frontend/src/engine/hud.ts` | Poll-Budget |
| `frontend/src/index.css` | 3-col, `.is-lage` Ambient aus |
| `frontend/src/engine/store.ts` | `face`, `tts_voice_jarvis`, `tts_voice_friday` |
| Tests | `face-parse` + HUD-Layout; **nicht** `registry.ts` importieren |

## Probe

1. Default: Smalltalk klingt und spricht Jarvis.  
2. `Friday übernimmt` → nächste Antwort weibliche Stimme (Gemini oder ehrlich Native). `Freitag 15 Uhr` bleibt Termin.  
3. Steckdose und PC-Tool funktionieren unter beiden Gesichtern.  
4. Tablet quer: Kacheln **und** Verlauf+Composer sichtbar. Mic da. Uhr springt jede Minute.  
5. `Lage aus` → voller Chat. Reduced-motion ohne Stagger.  
6. `/hilfe` nennt Friday nur wenn Face-CODE da ist — bis dahin App **`3.18.1`**.

## Won’t

Zwei Modelle. Zwei Register. Embeddings-Routing Work/Haus. Marvel-Rolle. Stimme klonen. Wake auf „Freitag“. Lage als Sales-CRM. Fake-Gauges. Chat auf dem Tablet **weglassen**. Jarvis-Cloud für Face-Sync.

Sprint: [`sprint-114.md`](./sprints/sprint-114.md). Männliche TTS-Spike: [`37-next.md`](./37-next.md). Backup: [`38-next.md`](./38-next.md).
