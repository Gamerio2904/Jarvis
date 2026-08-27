# 36 — Alltagskette Stimme (`4.19`) **CODE**

PO 2026-08-27: Eine gesprochene Äußerung → Sprachnachricht, Bar, Taxi. Reel ohne Tracking:

https://www.instagram.com/reel/Db8bcYijN5y/

**Vollständig** = Ist aus dem Code, geschlossene Research-Voten, Gold-Sätze, Dateien, Konflikte, Tests. Noch kein Execute.

Code jetzt: **`4.19.0`**. Sideload: **`3.18.1`**. Weltlage: [`35-next.md`](./35-next.md). Gespräch/TTS: [`37-next.md`](./37-next.md). **Haus-Backup + Tippfehler:** [`38-next.md`](./38-next.md) — vor dem nächsten Sideload **Backup zuerst**.

## Reel

Caption: Sprachnachricht, Bar, Taxi. *Ich hab nur geredet.* Kein 267-€-Abo.

| Teil | Code `3.18.1` | Soll |
|------|----------------|------|
| Nur geredet | `VoiceMode` → STT-Text. `splitIntents` nur an **„und“**, beide Teile `TOOLISH`. | Nach `normalizeUtterance`/`repairSpeech` splitten: `und` / `dann` / `danach` / Komma / Punkt. Max. 5. |
| Sprachnachricht | `parseSms` + `handlePlaces`: SMS nach Ja (`ACTION_SENDTO` / `sendSms`). Kein Audio-Blob. WhatsApp-Chip in `test-copy.ts` ist **Refuse-Probe**, kein Feature. | v1: STT-Text = SMS-Body, ehrlich „keine Voice-Note“. `wa.me` erst `4.28`. Still senden **Won’t**. |
| Bar | `PoiKind`: pharmacy, bakery, parking, supermarket, chemist, shop, cafe. Overpass in `poi.ts` `FILTER`. **Kein bar/pub.** | `bar`: `amenity=bar` **oder** `amenity=pub`. |
| Taxi | Anruf an Kontakt nach Nachfrage. Kein Ride-Intent. | Tool `taxi`: nach Ja App öffnen **oder** Kontakt `Taxi` anrufen. Nie „ist bestellt“. |

## Ist (Dateien)

| Datei | Rolle jetzt |
|-------|-------------|
| `frontend/src/engine/split-intents.ts` | `und`, 2–5 Teile, `TOOLISH` |
| `frontend/src/engine/poi-parse.ts` / `poi.ts` | POI, Overpass, Ordinal, `beginDriveTo` |
| `frontend/src/engine/places-parse.ts` / `places.ts` | SMS/Anruf, `last_comm_json` |
| `frontend/src/engine/chat.ts` | `splitIntents` dann `routeDeterministic` |
| `frontend/src/engine/route-pick.ts` / `registry.ts` / `conflicts.ts` | kein `taxi`, kein `bar` |
| `frontend/src/engine/utterance.ts` | `repairSpeech` + Vocative; keine Bar/Taxi-Tippfehler |
| `frontend/src/engine/heard.ts` | STT-Alts nach Parser-Score |
| `frontend/native/device/JarvisDevicePlugin.java` | `dial`, `sms`, `callNow`, `sendSms` — kein Share-Audio, kein Ride |
| `frontend/src/engine/store.ts` | `last_comm_json`, `last_poi_json` — kein `chain_json` |

Pending: **ein** Confirm (`last_comm_json` oder `pending`). Schlange fehlt.

## Leitentscheidung (fest)

| Thema | Entscheidung |
|-------|----------------|
| Bar | Nur `poi`, Kind `bar`. Café bleibt Café. |
| Taxi | Neues Register-Tool **`taxi`**. Nicht `drive` (das ist Jarvis-Navi). |
| SMS | bleibt `places`. `Sprachnachricht an X …` → `parseSms`. |
| WhatsApp still | **Won’t**. Composer `wa.me` nach Ja = SMS-Analog (**T1 ja**, Stufe `4.28`). |
| Taxi-Default | **Anruf Kontakt `Taxi`** (haben wir). Deep-Link FreeNow/Uber **nur** wenn 4.21 eine URL ohne Payment-API belegt. Sonst Settings `call`. |
| Audio-Note | **v1 nein** (kein Blob). `4.29` nur wenn Research einen Clip ohne extra Cloud hält — sonst Stufe streichen, ehrlich sagen. |
| Kette | Lesen (Bar) sofort. Schreiben (SMS, Taxi) nacheinander. Ein `Ja` = ein Schritt. `Nein` bricht nur den aktuellen, Rest der Schlange fragen oder verwerfen (nachfragen: „Taxi trotzdem?“). |
| Split | Nach `normalizeUtterance`. Nicht Memory-Write. `Brot und Butter` bleibt ganz (`TOOLISH` greift nicht). |
| STT für die Kette | `repairSpeech`: taxsi→Taxi, kneipe, sprachnachricht. `pickHeard` profitiert sobald `parsePoi`/`parseTaxi` existieren. Bahn≠Bar: `conflicts.ts`. Generelle Tippfehler: [`38-next.md`](./38-next.md). |
| Thread | Ein Voice-Gespräch: **`3.19.0` CODE** auf `main`, nicht in `taxi.ts` nachbauen. |
| Router | Nur Register. Tests: `route-pick.ts`, Imports `.ts`. Kein `if` in `chat.ts`. |
| 0,5B | wählt nicht. |
| Sideload | nach `4.26`, und **nur** wenn Backup [`38-next.md`](./38-next.md) existiert — sonst Keys weg bei Deinstall. |

## Soll — Durchlauf

```text
„Schreib Tom ich komme, such eine Bar und bestell ein Taxi.“
  repairSpeech / normalizeUtterance
  split → [sms Tom], [poi bar], [taxi]
  1. poi bar → 1–3 Treffer, last_poi_json, last_step
  2. chain_json = [sms, taxi]; start sms pending (last_comm_json wie heute)
  3. Ja → SMS-Intent; pop chain → taxi pending (Ziel = POI[0] oder GPS)
  4. Ja → openRide oder call Kontakt Taxi
     Reply: „App ist auf / ich rufe an. Bestellt und bezahlt habe ich nicht.“
```

Ohne GPS: Bar ehrlich wie andere POI (`NO_GPS` in `poi.ts`). Ohne Kontakt Taxi und ohne App: „Wen soll ich anrufen, oder welche App?“

## Research — Voten (geschlossen, außer Spike-URL)

### `4.19.0` Leitentscheidung — **CODE** (dieses Dokument)

### `4.20.0` Sprachnachricht

| Votum | Fest |
|-------|------|
| SMS-Text v1 | **ja** |
| WhatsApp Business / Accessibility | **Won’t** |
| `wa.me` nach Ja | **ja in 4.28**, User sendet |
| Voice-Clip Share | **4.29 nur bei Blob**; sonst entfällt |
| TTS als Fake-Note | **Won’t** |

Rest-Spike: E.164 für `wa.me` aus Memory `contact` (wie SMS).

### `4.21.0` Taxi

| Votum | Fest |
|-------|------|
| Stille Buchung / Payment-API | **Won’t** |
| Fallback Anruf `Taxi` | **ja, Default** |
| Deep-Link | **Spike:** eine dokumentierte URL (FreeNow oder `uber://` Pickup=my_location, Dropoff=lat/lon). Scheitert der Spike: nur Anruf. |
| Google Maps Ride | Could, nicht v1 |

Settings `taxi_app`: `call` \| `freenow` \| `uber` \| `ask`. Default `call` bis Spike grün.

### `4.22.0` Kette

| Votum | Fest |
|-------|------|
| Split-Trenner | `\s+und\s+` \| `\s+dann\s+` \| `\s+danach\s+` \| `\s*,\s*` \| `(?<=[a-zäöüß])\.\s+(?=[A-ZÄÖÜ])` — nur wenn **jedes** Teil nach Split `TOOLISH` (erweitert) oder bekannten Parser hat |
| Queue | `chain_json` in Settings (kurz, wie `last_list_json`). Confirm bleibt `last_comm_json` **oder** taxi-pending, nie zwei gleichzeitig |
| Ordinal | nach Bar: `die zweite` → `handlePoiOrdinal`, nicht Taxi |
| Gold | unten |

**TOOLISH erweitern:** `bar|kneipe|pub|taxi|uber|freenow|sprachnachricht|whatsapp|nachricht|sms` (whatsapp nur Routing zum ehrlichen Satz / Composer).

## Bau-Reihenfolge

| Version | Inhalt | Status |
|---------|--------|--------|
| **`4.19.0`** | Dieses Dokument + Kern Bar/SMS/Taxi/Kette | **CODE** |
| **`4.20`–`4.22`** | Spikes: `wa.me`-Format, eine Ride-URL, Split-Gold | **CODE** |
| **`4.23.0`** | `PoiKind` + `bar`, FILTER, Parser, Label, Konflikte Bahn/Café | **CODE** |
| **`4.24.0`** | `Sprachnachricht` → SMS, Satz „Text, keine Note“ | **CODE** |
| **`4.25.0`** | `taxi-parse.ts` / `taxi.ts`, Confirm, call oder Deep-Link | **CODE** |
| **`4.26.0`** | Split + `chain_json` | **CODE** |
| **`4.27.0`** | Stimme, Siezen; braucht `3.19` Thread | **CODE** (Thread schon `3.19`) |
| **`4.28.0`** | `wa.me` nach Ja; Chip WhatsApp = Composer | **CODE** |
| **`4.29.0`** | Audio-Share **oder Stufe streichen** | **entfällt** (kein Blob ohne extra Cloud) |
| **`4.30.0`** | `Taxi dorthin`, Ordinal | **CODE** |
| **`4.31.0`** | False-Positives Minibar/Schokolade, Gold | **CODE** |
| **`4.32.0`** | Sideload **nach** Backup `4.46` | geplant |

## Gold (Parser / Route)

| Äußerung | Tool-Reihenfolge |
|----------|------------------|
| `Bar in der Nähe` | `poi` bar |
| `nächste Kneipe` | `poi` bar |
| `nächstes Café` | `poi` cafe |
| `fahr mich zur Bar` | `drive` (Ziel last POI) |
| `bestell ein Taxi` / `Taxi zur Bar` | `taxi` |
| `mit der Bahn nach …` | `transit`, nicht bar |
| `Sprachnachricht an Mama ich bin in 10 Minuten` | `places` sms |
| `Schreib Mama auf WhatsApp ich bin unterwegs` | bis 4.28: ehrliche Absage; danach Composer |
| `Schreib Tom ich komme, such eine Bar und bestell ein Taxi` | poi → sms-pending → taxi-pending |
| `Bro anrufen` | call, unverändert |
| `Nachrichten` | `news` |
| `Minibar im Hotel` | LLM, nicht poi |

## Konflikte

| Muster | Gewinner |
|--------|----------|
| `tanke` | `fuel` (schon) |
| `bar` + nähe/nächste | `poi` |
| `taxi` / `uber` / `freenow` / `bestell` | `taxi` |
| `fahr mich` + Bar | `drive` |
| `bahn` / `öpnv` | `transit` |
| `schreib` + Name | `places`, nicht research |
| `wetterstatistik` / `lage` | `hud` (schon) |

`conflicts.ts` ergänzen, nicht `chat.ts`.

## Native (Ziel)

| Methode | Wann |
|---------|------|
| bestehend `sms` / `sendSms` / `callNow` | 4.24, 4.25 Fallback |
| `openUrl(uri)` oder `openRide` | 4.25 wenn Spike URL |
| `shareAudio` | nur 4.29 |

Kein neues Permission außer schon SMS/CALL.

## Settings

| Key | Default |
|-----|---------|
| `taxi_app` | `call` |
| `chain_json` | `''` |
| WhatsApp-Composer | aus bis 4.28 |

## Dateien (anlegen/ändern)

| Datei | Änderung |
|-------|----------|
| `poi-parse.ts` | Kind `bar`, Regex Kneipe/Pub/Bar |
| `poi.ts` | FILTER bar/pub |
| `taxi-parse.ts` **neu** | Intent |
| `taxi.ts` **neu** | Confirm, Link, Anruf |
| `places-parse.ts` | `sprachnachricht` |
| `split-intents.ts` | Trenner + TOOLISH |
| `route-pick.ts` / `registry.ts` / `policy.ts` / `conflicts.ts` | `taxi` |
| `utterance.ts` | REPAIRS taxsi, kneipe-STT |
| `store.ts` | `taxi_app`, `chain_json` |
| `test-copy.ts` | Gold-Zeilen; WhatsApp-Chip bleibt Refuse bis 4.28 |
| Native Device | optional URL |

## Tests

`test:014` / `test:prompts`: Gold-Tabelle. Confirm: ein Ja ≠ SMS und Taxi. Reply-Verbot: `/zugestellt|taxi ist unterwegs|habe bestellt/`. Ohne Key/GPS: kein erfundener Treffer. Regression: Apotheke, Bro, Tagesschau, Steckdose.

## Probe (`4.26`, nicht jetzt)

1. `nächste Bar` liefert Kneipe/Bar, nicht nur Café.  
2. Drei Aufträge: Bar-Liste, dann **eine** Nachfrage.  
3. `Ja` nach SMS öffnet nicht Uber.  
4. Kein Ride-App + kein Kontakt: ehrlich.  
5. Kein `handleTaxi` in `chat.ts`.  
6. `mit der Bahn` ≠ Bar.

## Won’t

Stilles WhatsApp/Telegram. „Zugestellt“. Taxi bezahlen. Retell. Embeddings. 0,5B-Function-Calling. iOS, Play Store, Apple CarPlay. ConnectionService-Fake-Anruf ([`37-next.md`](./37-next.md)).

## Offene Punkte (nur Spike)

| ID | Rest |
|----|------|
| T2b | Konkrete FreeNow-URI nach einem Gerätetest |
| T3 | Clip ja/nein → 4.29 behalten oder Zeile in Changelog „entfällt“ |

Sprint: [`sprint-111.md`](./sprints/sprint-111.md). Backup: [`38-next.md`](./38-next.md).
