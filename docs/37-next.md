# 37 — Gespräch, Film-Stimme, Reel am Steuer **PLAN**

PO 2026-08-27: Realistisches Gespräch und Stimme. Reel lukebuildsai: findet ein Problem, behebt es, stört nur bei Zustimmung — auch beim Fahren per Anruf. Wenn Anruf nicht geht: **nicht übernehmen**, anpassen. Kalender-Screenshots. Hollywood-Stimme, **free** wenn möglich, sonst bestes Freies.

https://www.instagram.com/reel/Dcgcg5rRdKT/

Reihen daneben: Weltlage [`35-next.md`](./35-next.md), Alltagskette [`36-next.md`](./36-next.md). Diese Schiene **`4.33+`**. App-Code auf `main`: **`3.18.1`**.

**Kalender + ein Sprach-Thread** liegen bereits als **CODE** auf Branch `cursor/voice-cal-debug-6d6f` (App `3.19.0`, noch nicht `main`). Das **nicht neu bauen** — mergen, dann nur Rest härten.

Kein Execute in diesem Sprint außer Docs. Research `4.34`–`4.36` vor Stimmenwechsel und „Anruf am Steuer“.

## Was schon da ist — mergen oder ignorieren

| Wunsch | Stand | Tun |
|--------|-------|-----|
| Jahr-Übersicht, Punkte | **CODE** `3.19.0` (`Calendar.tsx` `yearView`) | **mergen**, nicht nochmal |
| `was steht heute so an` / diese Woche / nächste N Tage = **Tage-Fenster** | **CODE** `3.19.0` (`LIST_DAY`/`LIST_WEEK`/`LIST_DAYS` + `until`) | **mergen**. Auf `main` (`3.18.1`) fehlt das — deshalb wirkte „nächste 3 Tage“ wie drei Termine (31.8. falsch). |
| `erstell einen Termin für den 5.9. 2026, 15:00 Uhr Zahnarzt` | **CODE** `3.19.0` (`CREATE_NL`) | **mergen** |
| Siezen | Policy + Guards | **behalten**. Antworten nicht auf Duzen drehen, auch wenn ein Screenshot Duzen zeigte. |
| Ein Sprachmodus = ein Gespräch | **CODE** `3.19.0` (`activeIdRef`) | **mergen** |
| Debug in Settings | **CODE** `3.19.0` | **mergen** (nicht Thema dieses Reels, schon gebaut) |
| Selbst machen ohne Frage | Timer, Erinnerung, Steckdose, Kalender-Anlegen | **behalten** |
| Zustimmung: Anruf/SMS/Löschen | `1.46` | **behalten** |
| `Ruf mich in …` | Erinnerung „Rückruf“ + Stimme, `3.35` | **behalten**, ist **kein** eingehender Anruf während der Fahrt |
| Charon (Gemini-TTS), sonst Android Neural | `1.31` / `1.32.1` | **verbessern** (siehe Stimme). Kein ElevenLabs. |
| Film-Ton im Text | Persona Understatement, Siezen | **härten**, kein Marvel-Zitat |
| 0,5B Plaudern | bewusst schwach | **ignorieren** als Hollywood-Gespräch — Qualität sitzt bei Gemini |
| Retell / fremde Nummer / 24/7-Hotline | Won’t seit `33` | **Won’t** |

## Reel — was möglich ist

Caption: *Imagine getting a call from your agent while you’re driving because something actually needs your approval. It finds the problem, fixes it, and only bothers you when it needs you.*

| Im Video | Auf einem Android-Handy | Entscheidung |
|----------|-------------------------|--------------|
| Agent findet selbst ein Problem | Kein Cloud-„Employee“. Nur **Haus-Signale**, die wir schon messen können (Steckdose tot, Timer, Kalender-Kollision, Watch-Δ aus `4.9` später). | **ja, whitelist**. Kein allwissendes Finden. |
| Behebt ohne zu stören | Read/write ohne Consent: Stecker, Timer aus, Kalender anlegen, Erinnerung. | **ja, schon** — ausweiten um Watchdog, nicht um fremde Konten. |
| Stört nur bei Ja | Pending bleibt **ein** Confirm. | **ja** |
| Anruf während der Fahrt | Dasselbe Gerät kann sich **nicht** zuverlässig selbst anrufen. Retell/Twilio = Won’t. `ACTION_CALL` auf die eigene Nummer klingelt selten sinnvoll. | **nicht übernehmen.** Stattdessen: **lautes Notify + kurzer Satz im Fahrmodus-HUD** + Ja/Nein auf dem Schirm. Optional: Anruf auf eine **zweite** gespeicherte Nummer (anderes Handy), nur Opt-in. |
| Business-Agent, Guide-Kommentar | Abo-Stack | **Won’t** |

„Anruf geht nicht“ = HUD/Notify/Stimme. Kein Fake-Telefon-UI, das vorgibt, die Telekom-Leitung zu sein.

## Stimme — Hollywood, free

Kein Paul-Bettany-Klon (Urheber, Won’t Fake-Stimmen). Kein ElevenLabs-Abo.

| Kandidat | Kosten | Qualität | Votum |
|----------|--------|----------|--------|
| Gemini-TTS, Key den Sie schon haben | Free-Tier / gleicher Key | Beste **freie** Film-Nähe auf dem Phone | **Kern** |
| Stimme **Charon** jetzt | wie oben | „informative“, oft **gar nicht** gehört: Race **500 ms** → Android Neural | **prüfen** in 4.34; Wechsel erlaubt |
| Andere Gemini-Stimmen (männlich, DE): Algieba smooth, Orus firm, Sadaltager knowledgeable, Iapetus clear, Algenib gravelly, Schedar even | gleicher Key | Spike **hören**, eine wählen, nicht Karussell live | **4.34** |
| `gemini-2.5-pro-preview-tts` / 3.1 Flash TTS | gleicher Key | Pro langsamer, parkend ok | Parken: Qualität. Fahrt: Flash oder Native |
| Android Neural (System) | frei, offline | klar, nicht Film | Fallback, Navi-Ansagen **bleiben** Native |
| Piper/Kokoro on-device | frei, Extra-Download | nicht Hollywood | **Won’t** als Default |
| ElevenLabs, PlayHT, Klone | Geld / ToS | — | **Won’t** |

Ist-Lücke: Settings sagen schon ehrlich „Charon nur wenn er unter einer halben Sekunde da ist“. Deshalb klingt Jarvis im Alltag oft nach **Android**, nicht nach Film. Verbesserung: **am Steuer Tempo**, **stehend warten** auf Gemini-TTS (Budget hoch, Native-Race aus).

Style-Prompt schon: *Calm, low German, precise, slightly dry.* Nach Stimmenwahl nachschärfen, nicht theatralisch.

## Gespräch — realistisch

| Hebel | Ist | Soll |
|-------|-----|------|
| Inhalt | Gemini Opt-in: Persona, Stream, Siezen. Lokal 0,5B: knapp. | Gemini an = Gespräch. 0,5B nicht als Film verkaufen. |
| Ein Thread | Bug auf `main`: jede Voice-Äußerung neues Gespräch. Fix **CODE** `3.19`. | mergen |
| Barge-in | VoiceMode bricht Speak ab | behalten |
| Live-Audio (Gemini Live, dauerhaft Cloud-Mitschnitt) | nicht da | **Research 4.34**. Default eher **nein** (anders Produkt, Akku, Privacy). Turn-basiert + gute TTS ist der Haus-Weg. |
| Canned / Helpdesk | Guards | härten, Variation bleibt Pflicht (`07-persona.md`) |
| Follow-up | `3.18` last-tool | „und der Zahnarzt?“ nach Kalender |

## Leitentscheidung

| Thema | Entscheidung |
|-------|----------------|
| Kalender-Screenshots | Voraussetzung: **`3.19.0` mergen**. Danach nur Parser-Gold für Restphrasen. |
| Anruf am Steuer | Nicht simulieren. Kanal: Notify + HUD + Satz. Zweite Nummer optional. |
| Finden | Nur Whitelist Haus. Kein „irgendwas in der Firma“. |
| Stimme | Eine Gemini-Stimme nach Spike. Zwei Profile: **Fahrt** (schnell/Native) / **Stehen** (Gemini-TTS durchlaufen lassen). |
| Router | Watchdog + Interrupt = Register, kein `if` in `chat.ts`. |
| 0,5B | Wählt keine Tools, klont keine Stimme. |
| Ton | Siezen. |

## Researchphasen

### `4.33.0` — Leitentscheidung (jetzt)

Docs. Done: dieses Dokument.

### `4.34.0` — Research: Stimme + Gespräch

1. Dieselben DE-Sätze mit Charon, Algieba, Orus, Sadaltager, Iapetus, Algenib — eine männliche Default-Stimme.  
2. Flash vs Pro TTS: Latenz vs. Film.  
3. Stehend: welches Budget, bis Native nicht mehr gewinnt?  
4. Gemini Live: ja/nein als Opt-in, Default aus.  
**Done wenn:** eine `voiceName` + zwei Budgets in der Tabelle.

### `4.35.0` — Research: Stören am Steuer

1. Full-screen / high-priority Notify + `say` (haben wir am Notify-Plugin).  
2. HUD-Zeile + Tasten Ja/Nein, ohne Navi zu erschlagen.  
3. `ACTION_CALL` auf Kontakt „mein anderes Handy“ — nur wenn Nummer ≠ dieses Gerät.  
4. Android `ConnectionService` als Fake-Incoming-Call: **Won’t** (übernehmen).  
**Done wenn:** ein Kanal als Default, Anruf nur Opt-in.

### `4.36.0` — Research: welche Probleme findbar sind

Whitelist-Kandidaten (nur was Sensor/API hergibt):

| Signal | Selbst tun | Stören |
|--------|------------|--------|
| Timer/Wecker fällig | klingeln (schon) | — |
| Steckdose nicht erreichbar | ehrlich, nicht „an“ lügen (schon) | nur wenn User Watch an |
| Zwei Kalender-Termine überlappen | nicht löschen | eine Frage |
| Outlook-Watch Δ (`4.9`) | — | wie Weltlage-Plan |
| PC/FIFA | nicht | — |

Kein Scraping fremder Mails. **Done wenn:** 3–5 Signale, Rest Won’t.

## Bau-Reihenfolge

| Version | Inhalt | Status |
|---------|--------|--------|
| **`3.19.0`** | Kalender Jahr/Fenster/`erstell`, Voice-Thread, Debug | **CODE** (anderer Branch) — mergen |
| **`4.33.0`** | Leitentscheidung | **PLAN** |
| **`4.34.0`** | Research Stimme/Gespräch | **PLAN** |
| **`4.35.0`** | Research Steuer-Kanal | **PLAN** |
| **`4.36.0`** | Research Watchdog-Signale | **PLAN** |
| **`4.37.0`** | TTS: gewählte Stimme + stehend längeres Budget, Fahrt Race/Native | geplant |
| **`4.38.0`** | Gespräch: Siezen-Gold, weniger Canned, Follow-up Kalender | geplant |
| **`4.39.0`** | Watchdog v1: finden + selbst tun aus Whitelist | geplant |
| **`4.40.0`** | Interrupt: Notify + HUD-Satz + Ja/Nein; kein Fake-Anruf | geplant |
| **`4.41.0`** | Optional: Anruf auf **zweite** Nummer, Opt-in | geplant |
| **`4.42.0`** | Kalender-Restphrasen / Regression nach Merge `3.19` | geplant |
| **`4.43.0`** | Fahrmodus: Confirm stiehlt nicht die Karte | geplant |
| **`4.44.0`** | Härten, Gold-Set Reel (finden / still / eine Frage) | geplant |
| **`4.45.0`** | Sideload wenn `4.37`+`4.40` hör- und fahrbar | geplant |

## Chat / Stimme (Ziel)

| Version | Beispiel | Soll |
|---------|----------|------|
| 3.19 | `was steht die nächsten 3 Tage an` | Fenster ab heute, nicht 3 Events. |
| 3.19 | `erstell einen Termin für den 5.9. 2026, 15:00 Uhr Zahnarzt` | Eintrag, Siezen. |
| 4.37 | Sprachmodus, stehend, Gemini an | Film-nähere Stimme, nicht sofort Android. |
| 4.37 | Fahrmodus-Navi | weiter Native, schnell. |
| 4.39–4.40 | Steckdose weg / Termin-Kollision | selbst oder **eine** Frage über HUD, nicht Anruf-Schauspiel. |
| 4.38 | `Hey, wie geht’s?` | präsent, Siezen, kein Helpdesk. |

## Settings (Ziel)

| Key | Default | Zweck |
|-----|---------|--------|
| Gemini-Stimme | Ergebnis 4.34 | eine, kein Picker mit 30 Stimmen |
| `voice_tts` | auto | bleibt; stehend ≠ Fahrt intern |
| `drive_interrupt` | HUD+Notify | Anruf nur wenn zweite Nummer |
| Watchdog | aus | Akku |

## Tests (wenn Code)

| Art | Inhalt |
|-----|--------|
| Kalender | nächste 3 Tage = 3 Kalendertage; 5.9.2026 15:00 Zahnarzt |
| Siezen | keine Du-Form in Tool-Replies |
| TTS | stehend: Gemini-Blob oder ehrlich Native; Fahrt: keine 3 s Stille |
| Interrupt | ohne zweite Nummer kein `ACTION_CALL` auf sich selbst |
| Reel | stilles Fix ohne Bubble; Consent-Fall genau eine Frage |
| Regression | Bro anrufen, Tanke, Steckdose, Guten Morgen |

## Won’t

Retell, Twilio, Fake-Incoming-Call, Stimmklone, ElevenLabs, Play Store, iOS, Duzen, 0,5B als Film-Stimme, Allwissen-Finden.

## Verbesserungen danach

| Version | Was |
|---------|-----|
| `4.42` | Weitere Kalender-Sätze (`was liegt an`, `Wochenende`). |
| `4.43` | Confirm-Lautstärke vs. Spotify am Steuer. |
| `4.44` | Watchdog-False-Positives. |
| später | Zweite Gemini-Stimme nur als Setting, wenn Spike zwei gleich gute hat. |

Sprint: [`sprint-112.md`](./sprints/sprint-112.md).
