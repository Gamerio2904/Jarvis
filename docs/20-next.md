# 20 — Extra-Alltag (`1.21`–`1.24`)

PO 2026-08-16: Nummer an Person, Maps-Modus, Geburtstag, Serie ohne Geofence, Widget, „das zweite“, Gespräch suchen.  
Ort am Termin im selben Satz hängt an **`1.17`** (Losgehen), nicht hier.

Kein Alles-in-einem-Wurf. Jede Stufe sideloadbar. **Nichts davon ist im Code, bis die Version `CODE` heißt.**

Reihe davor: [`19-next.md`](./19-next.md) (`1.14`–`1.20`). App jetzt: **`1.15.0`**.

## Reihenfolge

| Version | Inhalt | Warum getrennt | Status |
|---------|--------|----------------|--------|
| **`1.21.0`** | **Nummer** + **Maps-Modus** | Personen/Maps schärfen, ohne Losgehen | **PLANNED** |
| **`1.22.0`** | **Geburtstag** + **Serie** (kein Geofence) | Kalender/Erinnerung, kein Standort | **PLANNED** |
| **`1.23.0`** | **Widget** + **„das zweite“** | Homescreen und Listen-Kontext | **PLANNED** |
| **`1.24.0`** | **Gespräch suchen** | Lokal in den Chats, kein Netz | **PLANNED** |

Sprints: [`sprint-73`](./sprints/sprint-73.md) … [`sprint-76`](./sprints/sprint-76.md).

## `1.21` — Nummer + Maps-Modus

An der Person: Ort **und** Telefon. `Freundin, Tel 0171 …` / `Merk dir Nummer von Jane: …`.

`Ruf die Freundin an` öffnet die Telefon-App (`tel:`). Keine Nummer → nachfragen, nicht raten.

Maps: `Lauf zur Freundin`, `mit der Bahn nach Heilbronn` setzt `travelmode=walking` / `transit`. Default bleibt Auto. Unbekannter Modus: Auto, eine ehrliche Zeile.

**Probe:** Nummer setzen → Anruf-Knopf. `Lauf nach Hause` öffnet Maps zu Fuß.

## `1.22` — Geburtstag + Serie ohne Geofence

`Mama hat am 3. März Geburtstag` → Datum lokal, am Vorabend/am Tag eine Erinnerung, eine Zeile in der Tageslage wenn `1.19` da ist.

Serie **ohne** Standort: `Jeden Dienstag Müll`, `was kommt diese Woche raus?`. Wiederkehrend nach Wochentag, Handy an fürs Klingeln. **Kein** Geofence — das bleibt `1.18`.

Schon da (`1.8`): `jeden Tag 8 Uhr Tabletten`. Diese Stufe macht die Wochenserie sichtbar (Liste), nicht nur eine einzelne Erinnerung.

**Probe:** Geburtstag anlegen → Erinnerung liegt. `Jeden Dienstag Müll` → Dienstag in der Serie. Gerät aus: kein Klingeln.

## `1.23` — Widget + „das zweite“

Widget (heute: nächster Timer + letzte Wetterzeile) um nächster Termin und eine Einkaufszeile (wenn `1.16` da) und „Route nach Hause“ wenn Zuhause liegt.

`das zweite` / `lösch das zweite` nach einer Liste: zweites Todo, zweiter Termin, zweite Erinnerung. Ohne Liste davor: nachfragen.

**Probe:** Zwei Termine zeigen → `lösch das zweite`. Widget nach Sideload neu legen.

## `1.24` — Gespräch suchen

`Wann hatte ich das mit der Steuer?` durchsucht **lokale** Chats (Titel + Nachrichten). Treffer: Gespräch öffnen oder die Zeile zitieren. Kein Netz, kein Gemini-Pflicht.

Leer / nichts gefunden: ehrlich. Keine erfundenen alten Sätze.

**Probe:** Altes Gespräch mit „Steuer“ → die Suche findet es. Offline.

## Wake-Word (schon `1.11`, kein neues Update)

Handy **an**: ja. Settings → **Auf „Jarvis“ hören**. Bildschirm darf aus sein (vordergründiger Dienst, sichtbare Leiste).  
Gerät **komplett aus**: nein. Manche OEM beenden das Mikro im Standby — dann ehrlich, nicht so tun als Alexa.

## Won’t

Play Store, iOS, WhatsApp-Schreiben, Google-Kalender-Sync, ChatGPT lokal. Serie ist kein heimliches Tracking.
