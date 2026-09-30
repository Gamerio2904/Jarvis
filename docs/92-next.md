# 92 — YouTube-Highlights als Top-Liste **CODE** (`18.20`)

PO: Reel [DYuOlndDUYF](https://www.instagram.com/reel/DYuOlndDUYF/) von
[@rickandmortyhighlights1](https://www.instagram.com/rickandmortyhighlights1/).
Frage: Kann der TikTok-Agent (und die anderen) das bauen, wenn man ihm
YouTube-Links gibt und er die Highlights schneidet?

**Dieses Dokument ist CODE.** App-Code **`18.20.0`**. Sideload bleibt
**`18.19.0`**, bis ein Windows-PC mit ffmpeg eine Datei geschrieben hat.
Sprints **392–397** sind im Quellcode. Kein Merge mit Draft Clips `#152` / `18.13`.

Hirn-Slots bleiben: **Groq primär → Gemini Spezialist (Vision) → 0,5B
Fallback.** Parser wählen. Ein Domänen-Agent pro Zug. Kein Schwarm, kein
zweiter Clip-Server, kein Docker-Produkt im APK.

---

## 0. Antwort in einem Satz

Heute **nein**: es gibt keinen TikTok-Agenten, und weder Handy noch PC
schneiden Video. **Ja als nächste Schiene:** ein Agent `clip` nimmt ein bis
drei YouTube-Links, der PC schneidet daraus eine vertikale Top-Liste im
Format dieses Reels, die Datei bleibt lokal. Hochladen nach TikTok,
Instagram oder YouTube ist nicht der Auftrag.

---

## 1. Was das Reel wirklich ist

Gemessen an der öffentlichen Datei (Embed, 30.9.2026), nicht an den Hashtags.

| Messung | Wert |
|---------|------|
| Konto | `rickandmortyhighlights1`, nicht verifiziert, 31 Posts, 273 Follower |
| Views | 235 487 |
| Länge | 138,6 s (2:18) |
| Bild | 720×1280, 30 fps, H.264, ~636 kb/s |
| Ton | HE-AAC, 44,1 kHz, Stereo, ~58 kb/s, durchgehend Sprache (Mittel −17,9 dB) |
| Harter Quellenwechsel | bei 66,4 s. Danach nur Kameraschnitte derselben Szene |
| Liste | Punkt 1 ab 0 s, Punkt 2 ab ~66 s, Punkt 3 ab ~112 s |

Caption des Kanals: „Sprinkler water buffalo, Bull dragon combination, A cow
with horns. Rick and Morty highlights best of all seasons.“ Hashtags nennen
`#aianimation`. Die Frames sind die Sendungszeichnung, kein generiertes Bild.

### Aufbau, Frame für Frame

1. **Haken bleibt stehen.** Oben: `top3` grün, `Rick And Morty` gelb,
   `Highlights` rot. Darunter eine nummerierte Liste. Punkt 2 und 3 sind
   zuerst leer und füllen sich, wenn der Abschnitt beginnt.
2. **Bildband.** Die Folge ist 16:9 und liegt in voller Breite in der Mitte.
   Oben und unten ist dieselbe Einstellung unscharf aufgezogen. Kein
   Gesichts-Crop, kein Zoom auf Münder.
3. **Ein Wort.** Unten auf dem Bildband steht genau das gesprochene Wort,
   weiß, schwarz umrandet (`Manhattan`, `treasure`, `voyagers`, `portal`,
   `helping`). Kein Satz, keine Musik-Einblendung, Originalton.
4. **Zwei Stücke, drei Titel.** Stück A ist die Garage (~66 s). Stück B ist
   das Ölfeld mit den Dinos (~72 s) und trägt zwei Listentitel.

### Welche Folge

Die eingebrannten Wörter stehen im Skript von **JuRicksic Mort, Staffel 6
Folge 6** (Adult Swim): `Dr. Manhattan`, `fellow cosmic voyagers`,
`We're fine`, `Portal`, `treasure map`, `ya little`, `We love helping`.
Das Heft im Bild („SO YOU WANNA FIGHT DINOS?“) ist das Pamphlet derselben
Folge, die Planeten-Projektion die Meteor-Tafel.

Die drei Listentitel stehen **nicht** im Skript. „Bull Dragon Combination“
und „A cow with horns“ beschreiben, wie die Dinos **aussehen**. Ein
Transkript allein überschreibt sie mit Dialog („Portal Pistol“, „Voyagers“).

Die Reihenfolge ist **nicht** die der Folge. Im Skript kommt das Ölfeld
vor der Garage-Szene mit Manhattan und der Schatzkarte. Der Schnitt zieht
zwei nicht zusammenhängende Bereiche und sortiert sie nach der Liste.

### Was ein Agent daraus lernen muss

| Sichtbar | Technisch |
|----------|-----------|
| Top-N-Liste, die sich füllt | Titel + Startzeit je Abschnitt, eine ASS-Spur |
| 16:9 in 9:16 mit Unschärfe | ffmpeg `scale` + `gblur` + `overlay`, kein YOLO |
| Ein Wort im Takt | Wortzeiten, ein ASS-Event pro Wort |
| Titel nach dem Bild | Ein JPEG je Abschnitt an Gemini, nicht das ganze MP4 |
| Zwei Links oder eine Folge | 1–3 URLs, nicht zusammenhängende Intervalle, Reihenfolge = Rang |
| „AI animation“ im Hashtag | Ignorieren. Kein Bildgenerator, kein Kling, kein Hailuo |

---

## 2. Ist (Diagnose)

| Fläche | Datei | Ist (`18.19.0`) | Lücke |
|--------|-------|-----------------|-------|
| Medien | `film.ts` | „Wie gut ist Dune“ | Bewertet, schneidet nicht |
| Fernseher | `tv.ts` `tv-watch.ts` | YouTube-Link auf den Samsung, `youtubeVideoId` | Startet die App, lädt nicht |
| Won't | `wont-parse.ts` | `öffne tiktok/instagram` → `app` | Richtig so. Kein Social-Client |
| Fachwissen | [`58-next.md`](./58-next.md) §8 | Reel-Download und Video-ASR sind Won't | Galt fürs **Handy als Ingest**. Ein PC-Schnitt ist ein anderer Vertrag |
| PC | `desktop/jarvis-pc.mjs` | `/v1/status` `/v1/screenshot` `/v1/input` `/v1/launch` `/v1/files` `/v1/trace` | Kein ffmpeg, kein yt-dlp, keine Shell |
| Agenten | `parse-catalog.ts` | 60 Domänen, Cluster `medien` = nur `film` | Kein `clip` |
| Jobs | `board-jobs` | Recherche/Plan, Cap 4, TTL 15 min | Vorbild für einen langen PC-Job, nicht derselbe Store |

Gold heute: `YouTube auf dem Fernseher` → `tv`. `Wie gut ist …` → `film`.
`Öffne TikTok` → Won't.

---

## 3. Leitentscheidung

| Thema | Entscheidung |
|-------|----------------|
| Wer schneidet | Der **PC**. Das Handy plant und spricht. Kein ffmpeg in der APK, kein WASM-Encoder |
| Agent | Neu: `clip`, Cluster `medien`, Organ `pc_hand` + `mouth`, `sideEffect: device`. Ein Zug |
| Auslöser | YouTube-URL **und** Schnittwort (`Highlight`, `schneid`, `Top 3`, `Reel`, `Short`). URL allein bleibt `tv`, wenn der Fernseher gemeint ist |
| Quellen | 1–3 `youtube.com` / `youtu.be` Links, die der Nutzer in den Chat setzt. Kein „such die lustigsten Clips im Netz“ |
| Rang | Groq über Sätze mit Zeiten. Cap 3 Abschnitte, je 20–75 s, Summe ≤ 180 s |
| Titel | Nutzer-Titel gewinnen. Sonst Gemini auf **ein** JPEG je Abschnitt, 2–5 Wörter. Transkript-Zitat nur, wenn kein Bild da ist |
| Layout | Festes Top-N wie das Reel: Unschärfe oben/unten, 16:9 volle Breite, Liste füllt sich, ein Wort. Kein Gesichts-Tracking |
| Ton | Original, kopiert. Keine Musik, kein TTS darüber, keine Synchronisation |
| Datei | `%USERPROFILE%\Videos\Jarvis\clip-YYYYMMDD-HHMM.mp4`. Master 1080×1920, H.264, AAC 128 k, `+faststart`. Das Reel ist nur 720p, weil Instagram neu kodiert hat |
| Job | Ein Clip-Job. Probe (Untertitel) im Zug, Render im Hintergrund, „Clip-Status“ liest den Stand. Kein zweiter Agent |
| Bestätigung | Vor dem ersten Byte: ein Ja. Text nennt Anzahl Links, dass die Datei lokal bleibt, und dass nichts hochgeladen wird |
| Werkzeuge | Vorhandenes `ffmpeg` und `yt-dlp` auf dem Windows-PATH. Fehlt eins: Satz mit dem Namen, kein stilles Nachinstallieren |
| Fremde Apps | OpenShorts, Shortsmith, Opus Clip, MuAPI werden **nicht** eingebaut. Sie sind die Recherche, nicht die Abhängigkeit |

---

## 4. Open Source (Recherche)

Stand der Recherche 30.9.2026. Übernommen wird die **Methode**, nicht das Repo.

| Schritt | Werkzeug | Lizenz | Warum dieses, nicht das Nachbarprojekt |
|--------|----------|--------|----------------------------------------|
| Metadaten, Kapitel, Untertitel, Datei | [yt-dlp](https://github.com/yt-dlp/yt-dlp) | Unlicense | Ein CLI. `--skip-download --write-auto-sub --write-subs --sub-format json3` liefert Wortzeiten, ohne dass das MP4 zum LLM geht. Danach nur die gewählten Intervalle in ≤720p für den Schnitt, Master kodieren wir selbst |
| Wortzeiten, wenn json3 fehlt | [faster-whisper](https://github.com/SYSTRAN/faster-whisper) small/int8 | MIT | Optional, nur auf dem PC, nur wenn das Binary schon da ist. Sonst Satz-Untertitel und ehrlich „ein Wort pro Satz“ |
| Szenengrenzen | ffmpeg `select=gt(scene,0.35)` | der ffmpeg des Nutzers | Das Reel hat ~20 Schnitte; einer davon ist der Quellenwechsel. PySceneDetect wäre eine zweite Python-Abhängigkeit für dieselbe Zahl |
| Abschnitte wählen | Groq, schon im Handy | — | Komödie hängt am Satz, nicht an einem Triggerwort-Lexikon wie in clips-gen |
| Bildtitel | Gemini Vision, schon Spezialist | — | Die Listentitel dieses Reels sind Bildnamen. Ein JPEG, nicht die Folge |
| Liste + Wörter | ASS, libass | ISC (libass, kommt mit ffmpeg) | `drawtext` kann keine Wortzeiten. Filter `ass=` brennt `\k` oder Ein-Wort-Events ein. Ein Event pro Wort trifft das Reel genauer als Karaoke über eine ganze Zeile |
| Hochladen | keins | — | — |

Gelesen und **nicht** übernommen:

| Projekt | Was es kann | Warum es draußen bleibt |
|---------|-------------|-------------------------|
| [mutonby/openshorts](https://github.com/mutonby/openshorts) | MIT-Kern. yt-dlp, faster-whisper, PySceneDetect, Gemini aufs Transkript, ffmpeg, Unschärfe-Modus „GENERAL“ | Docker, FastAPI, YOLO, MediaPipe, ElevenLabs, Upload-Post. GENERAL ist nur die Unschärfe; der Rest ist ein zweites Produkt. `cloud/` ist kommerziell, nicht MIT |
| [Anil-matcha/AI-Youtube-Shorts-Generator](https://github.com/Anil-matcha/AI-Youtube-Shorts-Generator) | Lokaler Modus: yt-dlp + faster-whisper + ffmpeg | API-Modus schickt das Video an MuAPI. Gesicht-Crop ist die falsche Kadrierung für dieses Reel |
| [Aniket-89/clips-gen](https://github.com/Aniket-89/clips-gen) | MIT, Triggerwörter, 9:16, Caption | „unbelievable/million“ findet keinen Dino-Gag |
| [mlvps/shortsmith](https://github.com/mlvps/shortsmith) | yt-dlp, ffmpeg, täglicher Upload | Zieht fremde Shorts und lädt sie hoch. Genau das Won't |
| [stophobia/youtube-shorts-pipeline](https://github.com/stophobia/youtube-shorts-pipeline) | Recherche → Skript → Imagen → Stimme → Upload | Erfindet ein Video. Das Reel schneidet eines |

YouTube-Nutzungsbedingungen verbieten das Herunterladen außer über den
offiziellen Knopf. yt-dlp ist das Werkzeug, das die Aufgabe technisch löst,
und es bricht diese Bedingungen. Deshalb: Ja des Nutzers, Datei nur auf
seinem PC, kein Konto, kein Upload. Die Beispiel-Datei ist eine
Weiterveröffentlichung einer Adult-Swim-Folge (235k Views, 273 Follower).
Denselben Kanal zu automatisieren ist kein Feature.

---

## 5. Ablauf

Ein Zug, eine Bestätigung, dann ein PC-Job.

1. Parser: URLs und Schnittwort → `clip`. Ohne Schnittwort und mit
   Fernseher-Wort → `tv`.
2. Antwort vor dem Ja: „Drei Stellen aus 1 Link, Datei unter Videos\Jarvis,
   kein Upload. Ja?“
3. Nach Ja, `POST /v1/clip` `action: probe`. PC: `yt-dlp -J` plus json3,
   kein MP4. Timeout 45 s.
4. Handy: Sätze an Groq. Rückgabe `{start, end, quote}` × 3, an
   Wortgrenzen, nicht mitten im Wort. Intervalle dürfen in der Quelle
   springen.
5. PC zieht je Abschnitt ein JPEG (`ffmpeg -ss`, nach dem Download nur
   dieser Range). Gemini: „2–5 Wörter, was man sieht, keine Pointe
   erfinden.“ Nutzer-Titel überspringen den Aufruf.
6. `action: render` im Hintergrund. PC lädt ≤720p, schneidet die Ranges,
   legt Unschärfe, ASS-Liste und Wörter, schreibt 1080×1920.
7. Der Zug endet mit den drei Titeln und „Sag Clip-Status“. Fertig: Pfad.
   „Ordner öffnen“ ist der bestehende Datei-Pfad, ein neuer Zug.

Groq sieht Text mit Zeiten. Gemini sieht drei JPEGs. Das MP4 verlässt
den PC nicht.

---

## 6. Bildrezept (Verhältnisse, nicht die 720p-Instagram-Datei)

Leinwand 1080×1920.

| Lage | Anteil | Inhalt |
|------|--------|--------|
| Oben | y 0–640 | Quelle auf 1080×640 aufgezogen, `gblur=24`, dann Liste |
| Bild | y 640, Höhe 608 | 16:9, Breite 1080, ohne Crop |
| Unten | Rest | Dieselbe Unschärfe |
| Wort | Unterkante des Bildbands | Ein ASS-Event, Schrift ~72 px, weiß, Umriss 8 px, Mitte |
| Liste | Oben, ab y 48 | Zeile 1 fest (`Top 3` + Thema aus dem YouTube-Titel, gekürzt). Punkte erscheinen bei `start` ihres Abschnitts |

Thema und Farben sind Parameter mit Default (grüner Index, gelber Titel,
roter Untertitel, Punkte cyan / magenta / gelb). Kein freies CSS aus dem
LLM. Unbekannte Farbe → Default.

Übergang zwischen Abschnitten: harter Schnitt, 0 s. Das Reel blendet nicht.

---

## 7. PC-Vertrag

`jarvis-pc.mjs`, nur LAN, dasselbe Token wie die anderen `/v1`-Routen.

| Action | Body | Antwort |
|--------|------|---------|
| `probe` | `{ urls: string[1..3] }` | Titel, Dauer, ob json3 da ist. Kein MP4 |
| `frames` | `{ url, times: number[1..3] }` | JPEG-Pfade, je ≤ 200 KB |
| `render` | `{ id, segments: [{url, start, end, title}] }` | `{ jobId }` sofort |
| `status` | `{ jobId }` | `probe` \| `render` \| `done` \| `error`, Pfad, fehlendes Werkzeug |

Grenzen im PC, nicht nur im Prompt:

- Nur Hosts `youtube.com`, `youtu.be`, `m.youtube.com`.
- Kein `file://`, kein beliebiges `http`, keine Shell-Zeichen aus dem Titel
  in der Kommandozeile. Titel nur in die ASS-Datei, Argumente als Array.
- Quelle ≤ 45 min, Ausgabe ≤ 180 s, ein Job.
- Arbeitsordner unter `Videos\Jarvis\work\`, wird nach `done` gelöscht.
  Die Master-Datei bleibt.
- `yt-dlp` und `ffmpeg` fehlen → `error: tool`, Name im Text.
- Prozess-Timeout Render 12 min, dann `error: timeout` und Arbeit weg.

Einmal auf dem Windows-PC, vom Menschen, nicht vom Agenten:

```text
winget install yt-dlp.yt-dlp
winget install Gyan.FFmpeg
```

faster-whisper nur, wenn jemand es selbst installiert. Die Schiene läuft
ohne es.

---

## 8. Parser, Agent, Hirn

| Rolle | Ist | `18.20` |
|-------|-----|---------|
| `tv` | YouTube am Fernseher | Gold bleibt, wenn „Fernseher / TV / Samsung“ ohne Schnittwort |
| `film` | Bewertung, Tipp | Gold bleibt ohne URL-Schnitt |
| `wont` | App öffnen | `Öffne TikTok` bleibt `app` |
| **`clip` neu** | — | URL + Schnittwort, Ja, Probe, Rang, Bildtitel, Render, Status |

`conflicts.ts`: `tv` schlägt `clip`, sobald ein Gerätewort da ist.
`clip` schlägt `film`, sobald eine YouTube-URL und ein Schnittwort da sind.
`wont` schlägt `clip` bei „öffne tiktok/instagram“ ohne URL.

Katalog: `parse-catalog.ts`, `execute-map.ts`, `executor-ids.ts`,
`meta.ts` (`department: medien`), `prompt-slices.ts` ein Satz Fakten.
Kein Embedding, kein zweites Hirn. Groq formuliert den einen Satz aus
dem Job-Stand, er erfindet keine Zeiten.

---

## 9. Won't

- Upload, Login oder Teilen nach TikTok, Instagram, YouTube, WhatsApp.
- „Mach denselben Kanal“: fremde Folgen suchen, täglich posten, Hashtags
  `#fyp` setzen.
- Bildgenerator, Lippensync, Synchronstimme, Hintergrundmusik.
- YOLO, MediaPipe, Gesichts-Crop, Docker, OpenShorts als Abhängigkeit.
- ffmpeg oder ein Whisper-Modell in der APK.
- Beliebige URL, Tor, Cookies aus dem Browser, fremde Konten.
- Stilles Nachinstallieren von winget-Paketen.
- Mehr als 3 Links, mehr als 3 Abschnitte, länger als 3 Minuten Ausgabe.
- Reel-Download von Instagram als Quelle (58 bleibt: IG oft 401, und es
  ist nicht der Auftrag).
- Merge mit Clips `#152`.

---

## 10. Ehrliche Grenzen

| Wunsch | Wahrheit |
|--------|----------|
| „Sieht aus wie das Reel“ | Layout, Liste, ein Wort, Originalton, zwei Schnitte. Nicht die Sendung, nicht deren Farben aufs Pixel |
| Titel wie „Sprinkler water buffalo“ | Nur wenn das JPEG den Gag hergibt oder der Nutzer den Titel sagt. Sonst ein sachlicher Bildname |
| Ganze Staffel | 45 min pro Link, drei Links. Eine Folge, nicht acht |
| Ohne PC | „PC-Fenster ist zu.“ Kein Schnitt auf dem Handy |
| Ohne Untertitel und ohne Whisper | Schnitt an Satzpausen aus der Player-Spur, Wörter = ganze kurzen Sätze. Sagen, was fehlt |
| Rechte | Die Datei ist eine private Kopie auf dem PC des Nutzers. Veröffentlichen ist seine Sache und bei fremden Folgen in der Regel nicht erlaubt |
| YouTube-Bedingungen | Download außer über den offiziellen Knopf verstößt dagegen. Der Ja-Satz sagt das in einem Halbsatz |

---

## 11. Sprints (`18.20.0` CODE, Sideload noch `18.19.0`)

| Sprint | Thema | Rolle |
|--------|--------|--------|
| [392](./sprints/sprint-392.md) | Parser `clip`, Konflikte gegen `tv` / `film` / `wont`, Ja-Satz | Must CODE |
| [393](./sprints/sprint-393.md) | PC `/v1/clip` probe + status, yt-dlp json3, Werkzeug fehlt ehrlich | Must CODE |
| [394](./sprints/sprint-394.md) | Groq-Rang auf Sätzen, Grenzen 20–75 s, Summe ≤ 180 | Must CODE |
| [395](./sprints/sprint-395.md) | Ein JPEG, Gemini-Titel, Nutzer-Titel gewinnt | Must CODE |
| [396](./sprints/sprint-396.md) | Render 1080×1920, ASS-Liste, ein Wort, Originalton | Must CODE |
| [397](./sprints/sprint-397.md) | Gold, Job-TTL, Tests ohne Netz (Fixture-VTT) | Must CODE |

Kette: 392 vor allem. 393 vor 394. 394 und 395 vor 396. 397 zuletzt.
396 kann mit Fixture-Zeiten gegen ein lokales Testvideo laufen, ohne YouTube.

Liegt in App-Code **`18.20.0`**. Sideload erst, wenn der
PC-Pfad auf einem Windows-Rechner mit ffmpeg eine Datei geschrieben hat.
Bis dahin bleibt die APK `18.19.0`.

---

## 12. Testprompts

```
Schneide Highlights aus https://www.youtube.com/watch?v=aNvsF1jToJQ
```

Ja-Frage. Nach Ja: Job, drei Titel, kein Upload-Satz.

```
Top 3 aus https://youtu.be/aNvsF1jToJQ und https://youtu.be/dQw4w9WgXcQ
Clip-Status
```

Zwei Links, ein Job. Status nennt Phase oder Pfad.

```
YouTube auf dem Fernseher Rick and Morty
Wie gut ist Dune
Öffne TikTok
```

`tv`, `film`, Won't. Nicht `clip`.

Negativ: eine nackte YouTube-URL ohne Schnittwort startet keinen Download.
`Clip-Status` ohne Job sagt „Kein Schnitt läuft.“

---

## 13. Risiken

| Risiko | Gegenmaßnahme |
|--------|----------------|
| `tv`-Gold wird geklaut | Gerätewort gewinnt in `conflicts.ts`, Gold in 397 |
| Titel aus dem LLM werden Shell | Titel nur in die ASS-Datei, `spawn` mit Argument-Array |
| Großer Download | Erst json3, MP4 nur für die Ranges, ≤720p Quelle, 45 min Deckel |
| Gemini erfindet einen Gag | Prompt: nur Sichtbares, 2–5 Wörter. Leer → „Abschnitt 2“ |
| Nutzer erwartet Upload | Ja-Satz und Won't. Kein Token, keine Social-API |
| ffmpeg-Build ohne `ass` | Status `error: tool`, Text „libass fehlt“ |
| Job überlebt den BAT-Neustart nicht | Beim Status „PC neu gestartet, Job weg.“ Arbeitordner aufräumen |
| Rechte | Lokale Datei, kein Kanal-Modus, Halbsatz zu den YouTube-Bedingungen |

---

Index: [`42-planned.md`](./42-planned.md). Versionen:
[`09-versioning.md`](./09-versioning.md). PC-Ist:
[`desktop/README.md`](../desktop/README.md). Reel-Won't Handy:
[`58-next.md`](./58-next.md) §8. Agenten:
[`66-agents-ist.md`](./66-agents-ist.md).
