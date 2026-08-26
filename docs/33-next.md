# 33 — Jarvis 3.x danach **CODE**

PO 2026-08-26: Nach `3.0.0` (Register + Welt) weiter unter dem **v3-Thema**: intelligenter wählen, Härten, dann sichtbare Lage. Drei Reels als Anstoß, nicht als Kopie fremder Cloud-Stacks.

Quellen (ohne Klammern/Tracking):

- Traceroute: https://www.instagram.com/reel/Dbi52EPsbsG/
- Telefon-Agent: https://www.instagram.com/reel/DboqOSvEj_b/
- Lage / Screenshots: https://www.instagram.com/reel/Dak3Si6oBro/

Reihe davor: [`32-intelligence.md`](./32-intelligence.md) **CODE** (`3.0.0`). App-Code: **`3.18.0`** (logische Stufen `3.0.1`–`3.45` mitgeliefert). Letzter Sideload: **`2.2.2`**.

Eine logische Stufe pro Version. Sideload darf bündeln.

## Was in den Reels steht

### Reel 1 — Traceroute (hoodinformatik)

Lehrfilm: welcher Weg nehmen IP-Pakete. TTL zählt an jedem Router runter. ICMP *Time exceeded* kommt zurück. IP-Kopf: Version, TTL, Protocol, Source, Destination. Hop-Liste. Sterne = kein ICMP-Echo. Windows `tracert`, Linux `traceroute` / `tracepath` / `mtr`.

**Nutzen:** ja, als ehrliches Haus-Tool — nicht als Angriff.

| Teil im Video | Bei uns |
|---------------|---------|
| Hop-Liste zu einem Host | **ja** — am Windows-PC über `JarvisPC` (`tracert`). Handy zeigt die Hops. |
| TTL / so funktioniert’s | **ja** — Jarvis erklärt knapp, Siezen, ohne Tutorial-Listen. |
| Sterne / Timeout | **ja** — ehrlich „keine Antwort auf diesem Hop“. |
| ICMP vom Android-WebView | **nein** — die APK kann kein Roh-ICMP. Das sagen, nicht faken. |
| NAT-Jack, Spoof, Firewall umgehen | **Won’t** |

Chat: `Welche Route nimmt google.de?` / `Traceroute zum Router` / `Was ist traceroute?`

### Reel 2 — KI mit echter Nummer (zubair_trabzada)

Intro: Jarvis bekommt eine Telefonnummer. Outbound-Anruf, Termin buchen, 24/7-Hotline, Rechnung aus Sprachnotiz, ruft den Owner bei Dringendem. Stack dort: Retell + Claude + Cloud-„Employee“.

**Nutzen:** nur die Haus-Teile. Kein fremder Cloud-Mitarbeiter.

| Teil im Video | Bei uns |
|---------------|---------|
| Nummer finden, anrufen, **vorher nachfragen** | **schon da** (`1.46`) — härten, Register |
| Nach dem Gespräch: Termin lokal | **ja** — Kalender, kein Google-OAuth |
| „Ruf mich, wenn …“ | **ja** — Erinnerung + Stimme, kein zweites SIM-Agent-Konto |
| Sprachnotiz → strukturierte Notiz / PDF auf dem Gerät | **ja** — lokal, keine Mandanten-Rechnung |
| 24/7-Hotline für Fremde, Empfang, Retell, Twilio, ElevenLabs | **Won’t** |
| Rechnung an Kunden verschicken | **Won’t** (kein DATEV, kein Mandat) |

### Reel 3 — Screenshots vorn + Sales-Analyser (moritz.maaker)

Anfang: Dual-Screen, dunkel, Header `JARVIS > …`, großer Kreis-Prozent, gestapelte Balken (orange/gelb/grün/rot), Flächen-/Linienkurve, Textzeilen, zweite Fläche mit Graph. Caption: Sales-Calls abhören, Learnings, Umsatzlücken.

**Nutzen:** die **Lage-Optik und Modul-Logik** für **Tabletmodus**. Nicht das Sales-CRM, nicht Fireflies/Meet.

| Teil im Video | Bei uns |
|---------------|---------|
| Dunkle Lage, Header, Kreis-Gauge, Balken, Kurve, Modul-Kacheln | **ja** — Tablet-HUD |
| Module an/aus: Wetterstatistik, Spotify, … | **ja** — Settings **und** Chat/Stimme |
| Raster fließt, aus = weg, kein Geister-Platzhalter | **ja** |
| Farben | Layout vom Reel. Palette bleibt **Spotify-dunkel** (nicht Orange-Klon). Optional Akzent als Setting. |
| `JARVIS > SALES-ANALYSER`, Call-CRM, Umsatz-KI | **Won’t** als Produkt |
| Anruf/Gespräch nachbereiten (lokal, ehrlich) | **ja** — Haus-Variante, kein Mandanten-Coach |

## Leitentscheidung

| Thema | Entscheidung |
|-------|----------------|
| Thema 3.x | Intelligenz zuerst (Register härten), dann Lage, dann ausgewählte Reel-Fähigkeiten. |
| Tablet | Eigene Lage ab Querformat / breitem Viewport. Handy-Chat bleibt. |
| Module | Katalog. Jedes Modul = Register-Eintrag + Setting. `Wetterstatistik an` zeigt, `Spotify aus` nimmt weg. |
| Daten | Nur vorhandene Tools. Keine erfundenen Kurven. Fehlt die Zahl: leer + Satz. |
| Look | Reel-Layout (Gauges, Balken, Kacheln, Header). Jarvis-Ton und Spotify-Dunkel. |
| Router | Neue Fähigkeiten nur Register, kein `if` in `chat.ts`. |
| 0,5B | Wählt keine Tools. |
| Sideload | nächster Build `3.18.0`; letzter APK bleibt `2.2.2`. |

## Reihenfolge

| Version | Inhalt | Status |
|---------|--------|--------|
| **`3.0.1`** | Sideload `3.0.0` + Gold-Set Welt/Konflikte | **CODE** (in `3.18.0`; APK noch `2.2.2`) |
| **`3.18.0`** | Follow-up / last-tool: `und morgen?`, `nochmal`, `lauter` | **CODE** |
| **`3.19.0`** | Zwei Dinge an „und“ = zwei Register-Läufe | **CODE** |
| **`3.20.0`** | Parser-Score aus Treffer-Sicherheit, nicht nur Kürze | **CODE** |
| **`3.21.0`** | Nachfrage-Satz Jarvis-Ton; Gleichstand eine Frage | **CODE** |
| **`3.22.0`** | Konflikttabelle + Gold aus Live-Fehlern | **CODE** |
| **`3.23.0`** | Tablet-Lage: Raster, Header `JARVIS > Lage`, Kreis/Balken-Kacheln | **CODE** |
| **`3.24.0`** | Module an/aus (Setting + Chat/Stimme), Raster fließt | **CODE** |
| **`3.25.0`** | Modul Wetterstatistik (Open-Meteo + DWD-Hinweis) | **CODE** |
| **`3.26.0`** | Modul Spotify now-playing | **CODE** |
| **`3.27.0`** | Modul Gerät: Uhr, Akku, Netz ehrlich | **CODE** |
| **`3.28.0`** | Modul Tageslage / Kalender / nächste Erinnerung | **CODE** |
| **`3.29.0`** | Modul Chat auf dem Tablet (eine Kachel, nicht Vollbild-Zwang) | **CODE** |
| **`3.30.0`** | Modul Steckdosen / TV / Ventilator Status | **CODE** |
| **`3.31.0`** | Modul Nachrichten / Feiertag / Ferien | **CODE** |
| **`3.32.0`** | Modul Karte/Restweg wenn Fahrmodus | **CODE** |
| **`3.33.0`** | Traceroute: PC `tracert`, Handy ehrlich ohne ICMP | **CODE** |
| **`3.34.0`** | Telefon: Anruf-Nachfrage härten, Termin danach lokal | **CODE** |
| **`3.35.0`** | „Ruf mich wenn …“ = Erinnerung + Stimme | **CODE** |
| **`3.36.0`** | Sprachnotiz → Notiz/PDF lokal, keine Kundenrechnung | **CODE** |
| **`3.37.0`** | Gespräch nachbereiten (lokal, Gemini opt-in) | **CODE** |
| **`3.38.0`** | Foto: Food / Pflanze / Tier (3.6/3.10/3.12 brauchbar) | **CODE** |
| **`3.39.0`** | Stimme spricht Warnung, Ferien, Kurs, Hops in ganzen Sätzen | **CODE** |
| **`3.40.0`** | Sensoren nur mit Sensor; sonst ehrlich | **CODE** |
| **`3.41.0`** | Schach-Brett in der Lage, nicht nur FEN-Text | **CODE** |
| **`3.42.0`** | Slot-Füllen: Ort/Name aus letztem Tool | **CODE** |
| **`3.43.0`** | Ordinal `das zweite` über Lage-Listen | **CODE** |
| **`3.44.0`** | World-Phrasen Gold-Set (Unwetter, Dollar, Schach, ISS) | **CODE** |
| **`3.45.0`** | Härten: False-Positives der neuen Module, keine Fake-Kurven | **CODE** |

Kickoff: [`sprint-107.md`](./sprints/sprint-107.md).

## Tablet-Lage (aus Reel 3, Anfang)

```text
┌─────────────────────────────────────────────────────────┐
│  JARVIS  >  Lage                         21:04  78 %    │
├──────────────┬──────────────────────┬───────────────────┤
│  Kreis       │  Wetterstatistik     │  Spotify          │
│  (Akku/Lage) │  Temp, Regen, DWD    │  Titel / Pause    │
├──────────────┴──────────────────────┼───────────────────┤
│  Balken / Kurve nur mit echten Werten│  Chat / Stimme   │
│  (7-Tage-Temp, nicht Umsatz)         │                   │
└──────────────────────────────────────┴───────────────────┘
```

- Querformat oder Viewport ≳ 900 px **oder** Setting „Tablet-Lage“.
- Module aus dem Katalog. Aus = Kachel weg, Nachbarn rücken nach.
- Chat: `Wetterstatistik an`, `Spotify-Kachel aus`, `Zeige Steckdosen`, `Lage aus` (zurück zum Chat). `Spotify aus` bleibt Pause.
- Kreis-Gauge: nur echte Größe (Akku, Timer-Rest, nicht „Sales 71 %“).
- Balken/Kurve: z. B. 7-Tage-Temperatur aus Open-Meteo. Kein Dummy.

### Modul-Katalog (an/aus)

| id | Inhalt | Quelle |
|----|--------|--------|
| `hud.weather` | Wetterstatistik | Open-Meteo, DWD nur als Warn-Punkt |
| `hud.spotify` | Now-playing | internes Spotify |
| `hud.device` | Uhr, Akku, Taschenlampe-Status | Gerät |
| `hud.brief` | Was steht an | Brief/Kalender/Erinnerung |
| `hud.chat` | Chat-Kachel | bestehend |
| `hud.plugs` | Steckdosen | lokal |
| `hud.tv` | TV/Fire | lokal |
| `hud.news` | Tagesschau-Zeile | bestehend |
| `hud.drive` | Restweg | nur im Fahrmodus |
| `hud.warn` | Unwetter | DWD |
| `hud.fx` | Kurs | Frankfurter.app |
| `hud.sport` | Liga | OpenLigaDB |
| `hud.chess` | Brett | ab `3.41` |
| `hud.trace` | letzte Hops | ab `3.33` |

## Intelligenz (3.x, unabhängig von Reels)

| Lücke jetzt | Soll |
|-------------|------|
| `isFollowish` zu eng | kurze Nachsätze treffen last-tool |
| `und` | zwei Parses, zwei Executes, Reihenfolge links→rechts |
| Score ≈ 0,72 für jeden Parser | Parser liefert Sicherheit 0,45–0,95 |
| Gates noch in `chat.ts` | bleiben Gates; Rest nur Register |
| Welt-Tools ohne Gold | Chips für DWD, Ferien, Kurs, Schach, ISS |
| Nachfrage | eine Alternative, Jarvis-Ton |
| Slot | `zur Freundin` nach `Heilbronn merken` ohne neues Raten |

## Chat (Zielbild)

| Version | Beispiel |
|---------|----------|
| `3.18` | `und morgen?` nach Wetter → Wetter, nicht LLM |
| `3.19` | `Timer 8 Minuten und Wetter heute` |
| `3.24` | `Wetterstatistik an` / `Spotify aus` |
| `3.33` | `Welche Route nimmt 1.1.1.1?` — Hops oder „vom Handy kein Traceroute, am PC …“ |
| `3.34` | `Ruf die Freundin an` — Nachfrage bleibt |
| `3.35` | `Ruf mich in 20 Minuten` |
| `3.36` | Sprachnotiz → Notiz, kein „Rechnung an Kunde raus“ |
| `3.37` | `Fass das Gespräch zusammen` — lokal / Gemini opt-in, kein Umsatz-Coach |

## Probe

1. Sideload folgt (`2.2.2` zuletzt). `/hilfe` `3.18.0`.  
2. `kein Kaffee mehr`, `Fahr mich zur Freundin`, `lauter` nach Spotify.  
3. Tablet quer oder Setting Lage. `Wetterstatistik an`. `Spotify aus` = Pause, `Spotify-Kachel aus` = Kachel weg.  
4. Wetterstatistik nur mit Open-Meteo-Zahlen, sonst leer.  
5. Traceroute ohne PC: ehrlicher Satz, keine erfundenen Hops.  
6. Kein `if (handleHud)` in `chat.ts` — Register.  
7. Regression: Steckdose, Uhr, Guten Morgen, das zweite.

## Won’t

Embeddings als Primärwahl. 0,5B-Function-Calling. Retell/Twilio/ElevenLabs. 24/7-Fremden-Hotline. Kundenrechnungen. Sales-CRM. Fireflies + Google Meet. Orange-Iron-Man-Klon als Default. Fake-Gauges. ICMP-Exploit, NAT-Jack, Spoofing. Apple CarPlay, iOS, Play Store, Alexa, Tuya-Cloud, Cloud-Kalender-OAuth.
