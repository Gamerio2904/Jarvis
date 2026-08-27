# 36 — Alltagskette Stimme (`4.19`) **PLAN**

PO 2026-08-27: Zweites Reel derselben Reihe. Jarvis soll **nur aus dem Gesprochenen** drei Dinge hintereinander erledigen: Sprachnachricht, Bar suchen, Taxi bestellen.

https://www.instagram.com/reel/Db8bcYijN5y/

Weltlage bleibt [`35-next.md`](./35-next.md) (`4.0`–`4.18`). Diese Schiene ist **unabhängig** — Bar/Taxi blockieren kein Öl-Research. App-Code jetzt: **`3.18.1`**. Sideload: **`3.18.1`**.

Eine logische Stufe pro Version. **Kein Execute in diesem Sprint.** Research `4.20`–`4.22` vor den gefährlichen Teilen (WhatsApp, Bezahl-Taxi). Bar-POI darf nach kurzem Spike.

## Reel — was dort wirklich steht

Account: moritz.maaker. Caption: Diesmal hat er eine **Sprachnachricht** gesendet, eine **Bar** gesucht, ein **Taxi** bestellt. *Ich hab nur geredet.*

Das ist **eine Äußerung → drei Haus-Handlungen**, nicht ein neuer Cloud-Mitarbeiter. Kommentare im Clip sprechen von fremder Einrichtung (~267 € plus Abo). Bei uns: vorhandene Tools ketten, kein Retell, kein Abo-Stack.

| Teil im Video | Technisch | Bei uns |
|---------------|-----------|---------|
| Nur geredet | Ein Voice-Turn, mehrere Intents | **teilweise** — `splitIntents` nur an **„und“**, und nur wenn beide Hälften toolisch klingen. Kommas / „dann“ / drei Aufträge: Lücke. |
| Sprachnachricht gesendet | Audio an Kontakt, oft WhatsApp | **SMS-Text nach Nachfrage** gibt es (`1.46`). WhatsApp still senden: **Won’t** (Sprint 99). Echte Voice-Note: Voice-Modus liefert heute **Text (STT)**, kein Audio-Blob. |
| Bar gesucht | POI in der Nähe | **Café/Apotheke/…** über Overpass. **Bar/Kneipe/Pub fehlt.** |
| Taxi bestellt | Ride-Hailing mit Ziel | **kein** FreeNow/Uber/Bolt. Anruf an gespeicherten Kontakt **ja**, nach Nachfrage. Zahlen/Buchen in fremder App **Won’t** als stiller Erfolg. |

Nutzen: **Kette + ehrliche Intents**, nicht „zugestellt“ und nicht „Taxi ist unterwegs“ erfinden.

## Ist (heute, `3.18.1`)

| Thema | Stand | Lücke zum Reel |
|-------|-------|----------------|
| Stimme | Sprachmodus, ein Turn → Text | Kein letztes Audio zum Teilen. |
| SMS | `Schreib Mama ich bin unterwegs` → Text vorlesen → `Ja` → SMS-App / Senden | Kein „Sprachnachricht“. Testchip *WhatsApp* existiert, Produkt **Won’t**. |
| Anruf | `Bro anrufen` → Nachfrage → `ACTION_CALL` | Kein Taxi-Produkt. |
| POI | Apotheke, Bäcker, Parkplatz, Supermarkt, Drogerie, Laden, Café. Overpass. Ordinal. Fahrmodus. | Kein `amenity=bar` / `pub`. |
| Kette | `splitIntents`: max. 5 Teile an „und“, jedes Teil muss `TOOLISH` matchen | „Such eine Bar, schick …, bestell Taxi“ ohne „und“ = **ein** Blob → oft LLM. |
| Confirm | Ein Pending (SMS oder Anruf). Gates unscored. | Zwei Nachfragen nacheinander (SMS **und** Taxi) nicht als Schlange. |
| Native | `dial`, `sms`, `callNow`, `sendSms` | Kein `shareAudio`, kein `uber://`, kein `wa.me`. |

## Leitentscheidung

| Thema | Entscheidung |
|-------|----------------|
| Produkt | Kein neues Major. Schiene **`4.19+`** unter demselben `4.0`-Thema Alltag/Welt. |
| Reihenfolge vs. Weltlage | Parallel planbar. Code: Bar zuerst (klein), Kette danach, Taxi/WhatsApp erst nach Research. |
| Sprachnachricht v1 | Gesprochenes **als SMS-Text** (STT), Nachfrage, dann senden wie `1.46`. Satz: das ist Text, keine Voice-Note. |
| Sprachnachricht v2 | Letzten Voice-Clip behalten → Android **Share** (User wählt WhatsApp). Jarvis behauptet nicht „zugestellt“. |
| WhatsApp still | **Won’t** (kein Business-API, kein Accessibility-Klick). Composer `wa.me` **nur** wenn 4.20 ja sagt — gleiches Muster wie SMS-App öffnen, User tippt Senden. |
| Bar | POI-Kind `bar` (`amenity=bar` + `pub`). „Kneipe“, „Bar in der Nähe“. Café bleibt Café. |
| Taxi | Nach Nachfrage: Deep-Link in installierte App (Ziel = letzte Bar/GPS) **oder** Anruf an Kontakt `Taxi`. Nie: „ist bestellt“, nie bezahlen. |
| Kette | Read-Tools (Bar) sofort. Side-Effects (SMS, Taxi) **nacheinander nachfragen**. Ein „Ja“ gilt nur für den aktuellen Schritt. |
| Router | Register. Taxi = neues Tool `taxi` oder `ride`. Bar = bestehendes `poi`. SMS bleibt `places`. Kein `if` in `chat.ts`. |
| 0,5B | Wählt nicht. Stimme liefert Text; Parser/Kette wählen Tools. |
| Sideload | Erst wenn Kette + Bar + ehrliches Taxi nutzbar (`4.26`+). |

## Soll — ein Durchlauf

```text
„Schick Tom eine Nachricht ich komme, such eine Bar, bestell ein Taxi.“
  → Split (und/Komma/dann, nicht nur „und“)
  → 1. poi bar  (lesen, GPS, 1–3 Treffer, merken)
  → 2. sms      (Pending: Text + Nummer. Warten auf Ja/Nein)
  → 3. nach Ja: taxi Pending (Ziel = Bar 1, App oder Anruf)
  → 4. nach Ja: Intent öffnen, ehrlich „App ist auf, ich habe nicht bezahlt“
```

Stimme: dieselben Parser. „Ich hab nur geredet“ = ASR-Text muss splitbar sein, nicht ein Roman an Gemini.

## Researchphasen (zuerst)

### `4.19.0` — Leitentscheidung (dieser Nachtrag)

| Feld | Wert |
|------|------|
| Art | PLAN, Docs |
| Done wenn | Dieses Dokument + Versioning `4.19+` |
| Status | **PLAN** (jetzt) |

### `4.20.0` — Research: Sprachnachricht

**Frage:** Was kann das Handy senden, ohne WhatsApp-Lüge?

| Kandidat | Aufwand | Ehrlichkeit | Votum (erste Sichtung) |
|----------|---------|-------------|-------------------------|
| SMS-Text aus STT, Nachfrage wie `1.46` | niedrig | hoch | **v1 ja** |
| WhatsApp Business / Cloud API | Account, Abo | „zugestellt“ verlockend | **Won’t** |
| Accessibility, fremde App klicken | fragil, ToS | — | **Won’t** |
| `https://wa.me/<e164>?text=` nach Ja | mittel | Composer, User sendet | **prüfen** in 4.20 (wie SMS-App) |
| Letzten Voice-Puffer als Audio share | mittel–hoch | echte Note, User wählt App | **v2**, wenn VoiceMode den Clip hält |
| TTS-Datei als „Voice-Note“ | mittel | nicht die Stimme des Users | nur mit klarem Satz, sonst **Won’t** |

Heute: VoiceMode → STT, **kein** `MediaRecorder`-Blob im Repo.

**Done wenn:** v1 fest (SMS). v2 ja/nein (Clip). `wa.me` ja/nein ohne das alte WhatsApp-Won’t zu brechen (still senden bleibt nein).

### `4.21.0` — Research: Taxi DE

**Frage:** Bestellen ohne zu bezahlen und ohne Fake-Erfolg?

| Kandidat | Key? | Was passiert | Votum |
|----------|------|--------------|--------|
| Uber `uber://` / m.uber.com Deep-Link, Pickup = GPS, Dropoff = Bar | oft `client_id` | App/Web mit Ziel, User tippt Bestellen | **prüfen** — öffnen ja, „bestellt“ nein |
| FreeNow / Bolt Intents | herstellerabhängig | DE üblich | **prüfen**, eine DE-App bevorzugen |
| Kontakt `Taxi` anrufen | nein | haben wir | **Fallback immer** |
| Google Maps Ride | nein | nicht Jarvis-Navi | Could |
| Offizielle Ride-API + Payment | ja | Abo wie im Kommentar | **Won’t** |
| Stille Buchung | — | Lüge | **Won’t** |

**Done wenn:** Eine Deep-Link-Formel getestet (oder ehrlich „keine App“) + Fallback Anruf. Settings: welche App (FreeNow/Uber/Bolt/nur Anruf).

### `4.22.0` — Research: Kette + Nachfragen

**Frage:** Drei Aufträge, zwei davon mit Ja — ohne `chat.ts`-If-Orgie.

| Thema | Ziel |
|-------|------|
| Split | Nicht nur `und`. Auch Komma, `dann`, `danach`, Punkte. Max. weiter 5. Memory-Sätze ganz lassen (schon so). |
| TOOLISH | `bar`, `kneipe`, `taxi`, `uber`, `freenow`, `sprachnachricht`, `whatsapp` (wenn 4.20 Composer). |
| Queue | `pending` bleibt **ein** Confirm. Nach Erledigung nächstes Side-Effect aus einer kurzen Liste (`chain_json`). |
| Gates | Help/Confirm/Ordinal/Follow-up/Pending unscored. Ordinal nach Bar: `die zweite` → POI, nicht Taxi. |
| Konflikte | `fahr mich zur Bar` = drive/poi, nicht taxi. `bestell ein Taxi` = taxi. `schreib` = sms, nicht research. |
| Stimme | Ein Thread (wie 3.19-Idee). Kette in **einem** Voice-Turn. |

**Done wenn:** Gold-Äußerungen in Docs; Queue-Vertrag (ein Ja = ein Schritt).

## Bau-Reihenfolge

| Version | Inhalt | Abhängigkeit | Status |
|---------|--------|--------------|--------|
| **`4.19.0`** | Leitentscheidung Alltagskette | — | **PLAN** |
| **`4.20.0`** | Research Sprachnachricht | 4.19 | **PLAN** |
| **`4.21.0`** | Research Taxi | 4.19 | **PLAN** |
| **`4.22.0`** | Research Kette | 4.19 | **PLAN** |
| **`4.23.0`** | POI `bar` / Kneipe / Pub, Overpass, Ordinal | Spike Overlay-Tags | geplant |
| **`4.24.0`** | Parser: `Sprachnachricht an X …` = SMS-Text v1, ehrlicher Satz | 4.20 | geplant |
| **`4.25.0`** | Tool `taxi`: Nachfrage, Deep-Link oder Anruf, nie „bestellt“ | 4.21, letzte POI/GPS | geplant |
| **`4.26.0`** | Kette: Split + Confirm-Schlange | 4.22, 4.23–4.25 | geplant |
| **`4.27.0`** | Stimme: eine Äußerung, drei Tools, Siezen | 4.26 | geplant |
| **`4.28.0`** | `wa.me`-Composer **nur** wenn 4.20 ja; sonst Chip WhatsApp ehrlich ablehnen | 4.20, 4.24 | geplant |
| **`4.29.0`** | Audio-Share Voice-Note v2 oder ehrlich „kein Clip“ | 4.20 | geplant |
| **`4.30.0`** | Follow-up `Taxi dorthin` / `die zweite Bar` | 4.25, last-tool | geplant |
| **`4.31.0`** | Härten: False-Positives (`Schokolade`, `Minibar`), Gold-Set | 4.26 | geplant |
| **`4.32.0`** | Sideload wenn 4.26+ nutzbar | 4.26 | geplant |

## Chat / Stimme (Zielbild)

| Version | Beispiel | Soll |
|---------|----------|------|
| 4.23 | `Bar in der Nähe` / `nächste Kneipe` | 1–3 Treffer, Entfernung, optional fahren. |
| 4.24 | `Sprachnachricht an Mama ich bin in 10 Minuten` | „Das geht als SMS, nicht als WhatsApp-Note. Text: … Senden?“ |
| 4.25 | `Bestell ein Taxi zur Bar` | „Ich öffne FreeNow zur … / rufe Taxi an. Bestellen und Zahlen tun Sie. Soll ich öffnen?“ |
| 4.26 | `Schreib Tom ich komme, such eine Bar und bestell ein Taxi` | Bar-Liste, dann SMS-Frage, nach Ja Taxi-Frage. |
| 4.28 | `Schreib Mama auf WhatsApp ich bin unterwegs` | Composer oder klar: „WhatsApp sende ich nicht still. SMS?“ |
| — | `Bro anrufen` | unverändert Nachfrage. |

## Konflikte (Ziel)

| Äußerung | Gewinner |
|----------|----------|
| `nächste Bar` | `poi` |
| `fahr mich zur Bar` | `drive` (Ziel aus last POI) |
| `Taxi zur Bar` / `bestell ein Taxi` | `taxi` |
| `Schreib … WhatsApp` | sms oder wa-composer, **nicht** research |
| `Nachrichten` | `news` |
| `Minibar` / Hotel-Smalltalk | LLM, nicht poi |

## Settings (Ziel)

| Key | Default | Zweck |
|-----|---------|--------|
| `taxi_app` | `ask` | `freenow` / `uber` / `bolt` / `call` / nachfragen |
| WhatsApp-Composer | aus bis 4.20 ja | sonst nur SMS |

## Tests (wenn Code kommt)

| Art | Inhalt |
|-----|--------|
| Parser | Bar, Kneipe, Taxi, Sprachnachricht vs. Café, SMS, Anruf, Nachrichten |
| Split | drei Teile mit Komma und mit `und` |
| Confirm | ein Ja sendet nicht gleichzeitig SMS **und** Taxi |
| Ehrlichkeit | Reply enthält nicht `zugestellt` / `Taxi ist unterwegs` ohne App-Beweis |
| WhatsApp | stilles Senden bleibt tot; Testchip nicht als Erfolg lügen |
| Regression | `Bro anrufen`, `nächste Apotheke`, `Schreib Mama …` |

## Dateien (Ziel)

| Datei | Rolle |
|-------|--------|
| `poi-parse.ts` / `poi.ts` | Kind `bar` |
| `taxi-parse.ts` / `taxi.ts` | Intent, Confirm, Deep-Link |
| `places-parse.ts` | `Sprachnachricht` → sms (v1) |
| `split-intents.ts` | Komma/dann + TOOLISH |
| Native | optional `shareAudio`, `openRide` |
| `store.ts` | `chain_json`, `taxi_app`, last bar |

## Probe (nach `4.26`, nicht jetzt)

1. `nächste Bar` ≠ Café-only.  
2. Drei Aufträge in einem Satz: Bar zuerst, dann eine Nachfrage.  
3. `Ja` nach SMS öffnet nicht heimlich Uber.  
4. Ohne Ride-App: Anruf-Fallback oder ehrlich.  
5. Kein `if (handleTaxi)` in `chat.ts`.  
6. Regression: Tanke, Steckdose, Tagesschau, Bro anrufen.

## Won’t

- WhatsApp/Telegram still zustellen, Business-API, Accessibility.  
- „Nachricht zugestellt“, „Taxi kommt in 3 Minuten“ ohne Quelle.  
- Ride bezahlen, Konto anlegen, Abo-Stack aus dem Reel-Kommentar.  
- Retell/Twilio als Taxizentrale.  
- Embeddings-Router, 0,5B-Function-Calling.  
- iOS, Play Store, Apple CarPlay.

## Verbesserungen (eigene Updates, nach der Kette)

| Version | Verbesserung |
|---------|----------------|
| `4.30` | `Taxi dorthin` nach Bar-Liste; Ordinal. |
| `4.31` | Split-False-Positives, Gold. |
| `4.28`/`4.29` | Composer / Audio-Share nur nach Research-Ja. |
| später | Öffnungszeiten Bar (OSM `opening_hours`, schon POI-Schiene). |
| später | Mehrere Taxis-Apps in der Nachfrage nennen, nicht raten welche installiert ist — `PackageManager` prüfen. |

## Offene Punkte

| ID | Frage | Stufe |
|----|-------|--------|
| T1 | `wa.me` Composer = erlaubtes SMS-Analog oder bleibt WhatsApp-Won’t? | 4.20 |
| T2 | FreeNow vs. Uber vs. nur Anruf als Default DE | 4.21 |
| T3 | Voice-Clip speichern: wie lange, wo (Cache), Datenschutz | 4.20 / 4.29 |
| T4 | Kette ohne „und“ zu aggressiv? (`Brot und Butter` muss Memory/Einkauf bleiben) | 4.22 |

Sprint: [`sprint-111.md`](./sprints/sprint-111.md). Weltlage: [`35-next.md`](./35-next.md). Gespräch/Stimme: [`37-next.md`](./37-next.md).
