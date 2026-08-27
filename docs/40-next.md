# 40 — Körper intern: Hirn, Auge, Hand (`4.66`) **PLAN**

PO 2026-08-27: Reel intern nutzen — Jarvis **Hirn, Hand, Auge** und was dazugehört **sichtbar** machen, zugeschnitten auf *dieses* Jarvis. Nicht kopieren, erweitern. Nachzug: **3D-Modell live und anklickbar** — nur Darstellung, keine neuen Funktionen.

https://www.instagram.com/reel/DcjTYTiCt6P/

Caption dort: Jarvis aus **drei Teilen** — was er über mich weiß, was er für mich tut, wie wir reden. Dort: Mails, Instagram, Dashboards, 24/7. Website desselben Autors: **Gehirn, Stimme, Hand**, lokal am Rechner.

Bei uns: **Handy ist das Hirn.** PC ist Werkzeug. Lage gibt es schon ([`33-next.md`](./33-next.md)). Auge, Stimme, Tools, PC-Bildschirm sind CODE — sie liegen nur nicht als **Körper** beieinander.

Voraussetzung: Lage `3.18`+. Organe existieren schon (Auge `1.20`/`1.26`, PC `1.47`, Stimme `1.31`/`4.33`, Face `4.53` auf Branch). Sideload bleibt **`3.18.1`** bis Hausstand-Export.

## Kurz: APK oder nur PC?

**Die Darstellung läuft in der APK.** Dieselbe Capacitor-WebView wie Chat und Lage. Kein Extra-Programm am Rechner, kein Unity, kein zweites Windows-Fenster.

Ein **3D-Schema** (WebGL, wenige Knoten, klickbar) geht **in der APK**, weil die App schon eine Chrome-WebView ist. Der PC ist dafür nicht nötig.

Der **PC** wird nur gebraucht, wenn ein Organ den Rechner meint:

| Organ | Gerät | Ohne PC |
|-------|--------|---------|
| Hirn, Ohr, Mund, Handy-Auge, Handy-Hand, Gedächtnis | Handy | voll |
| PC-Auge (`Was siehst du auf dem PC`), PC-Hand (Klick, FIFA, Traceroute) | `JarvisPC.bat` | Kachel ehrlich: „PC nicht verbunden.“ |

Kein PC nötig, um den Körper **zu sehen**. Kein zweites Hirn auf Windows.

## Reel — was dort wirklich steht

| Im Video / Caption | Bei uns | Votum |
|--------------------|---------|-------|
| Drei Teile: Wissen / Tun / Reden | Gedächtnis / Hand / Ohr+Mund+Face | **ja**, intern so nennen |
| Gehirn am Laptop, Claude-Mitarbeiter | Hirn = Handy (0,5B oder Gemini Opt-in) | **zuschneiden**, nicht übernehmen |
| Hand steuert den Rechner | Handy-Hand = Register (Steckdose, SMS, Taxi, …). PC-Hand extra | **ja, getrennt** |
| Auge / Bildschirm sehen | Handy-Auge = Foto (`Lies das Foto`, Gemini). PC-Auge = Screenshot | **ja, getrennt** |
| Stimme | TTS Algieba/Kore, Native-Fallback | **ja** (Mund) |
| E-Mails beantworten, Instagram posten, Sales-Dashboards 24/7 | Cloud-Employee | **Won’t** |
| Rund um die Uhr Server | Handy an, sonst tot — schon Standing | **Won’t** als Jarvis-Cloud |
| 3D-Figur, Organe anklicken | Darstellung intern, keine neuen Tools | **ja**, Schema in der APK (WebGL) |
| Hologramm / Iron-Man-Mesh / Fake-Puls | Marvel, erfundene Gauges | **Won’t** — unser 3D ist Jarvis-Schema, nicht Filmklone |

## Was schon da ist — mergen, nicht neu erfinden

| Organ | Ist | Datei / Tool |
|-------|-----|----------------|
| Hirn | wllama 0,5B **oder** Gemini Opt-in. Register + Score. Face Jarvis/Friday. 0,5B wählt keine Tools. | `llm.ts`, `registry.ts`, `face.ts` |
| Auge (Handy) | `Lies das Foto` — nur mit Gemini, Bild zu Google. Sonst ehrlich. | `eye.ts` |
| Auge (PC) | `Was siehst du auf dem PC` — Screenshot über BAT | `pc.ts` |
| Hand (Handy) | Steckdose, Anruf/SMS nach Ja, Taxi nach Ja, Kalender, TV, Timer, … | Register |
| Hand (PC) | FIFA, Klick, Ordner, `tracert` | `pc.ts` / `trace.ts` |
| Ohr | STT, Wake Jarvis/Friday (nicht Freitag) | `voice.ts`, Wake-Service |
| Mund | TTS, zwei Budgets (stehend/Fahrt) | `tts.ts` |
| Gedächtnis | Memory, Kalender, Erinnerungen, Hausstand-Backup | IDB + `38` |
| Lage | Kacheln Wetter/Gerät/Chat/… — **keine** Organ-Gruppe | `Lage.tsx`, `hud-parse.ts` |

Lücke: der User sieht **Wetter und Akku**, nicht „das ist mein Jarvis-Körper“. Letztes Tool steht in der Chat-Blase, nicht als Organ.

## Leitentscheidung

| Thema | Entscheidung |
|-------|----------------|
| Produkt | **Ein** Jarvis. Körper = **Sicht** auf vorhandene Organe, kein zweites System. |
| Ort | Lage-Modus **Körper** (neben Chat, wie Tablet-Lage). Handy und Tablet. |
| Daten | Nur echte Zustände. Fehlt etwas: leer + ein Satz. Kein Fake-Herzschlag, keine erfundenen Prozent. |
| Handy vs PC | Zwei Augen, zwei Hände — Labels **Auge** / **PC-Auge**, **Hand** / **PC-Hand**. Nie so tun, als sähe das Handy den Windows-Desktop ohne BAT. |
| Hirn | Eine Kachel: Modell (lokal / Gemini / nicht bereit), Face, „denkt“ wenn busy, letzter Router-Treffer. Kein Token-Graph. |
| Hand | Letzte **write**-Aktion + ob Ja noch offen (Taxi, SMS, Interrupt). Liste nicht aller 80 Tools. |
| Auge | Letztes Foto: gelesen / verweigert / „Gemini aus“. PC-Auge: verbunden ja/nein. |
| Ohr / Mund | Wake an/aus. TTS Gemini vs Native. Face steuert Stimme, nicht ein zweites Ohr. |
| Gedächtnis | Wenige Zahlen: N merken, nächste Erinnerung — aus IDB, nicht geraten. |
| Router | `Körper an` / `Zeig Hirn` = HUD-Intent, Register, kein `if` in `chat.ts`. |
| Look | **3D-Schema** in der Lage-Sicht Körper (Spotify-dunkel, deutsch). Organe sind Hit-Ziele. Klick öffnet die ehrliche Kachel, startet kein Tool. Kein Marvel-Mesh. |
| 0,5B | Wählt keine Tools. Körper-Kacheln brauchen kein LLM. |
| Sideload | Nicht in `4.66`. Hausstand [`38`](./38-next.md) vor APK. |

## Drei Caption-Teile → unsere Organe

```text
Was er über mich weiß     →  Gedächtnis
Was er für mich tut       →  Hand  (+ PC-Hand wenn verbunden)
Wie wir miteinander reden →  Ohr + Mund + Gesicht
Sehen                     →  Auge (+ PC-Auge wenn verbunden)
Denken                    →  Hirn  (Handy)
```

Skizze Lage **Körper** (900 px, Chat bleibt rechts):

```text
┌──────────────────────────────────────────────────────────┐
│  JARVIS  >  Körper                        21:04  78 %    │
├─────────────────────┬────────────┬───────────────────────┤
│  3D-Schema          │  gewählt   │  Chat / Stimme        │
│  [Hirn]──[Auge]     │  Hand      │                       │
│     │               │  Taxi: Ja? │                       │
│  [Hand] [Ohr]       │  Bestellt  │                       │
│  [Mund] [Gedächtn.] │  habe ich  │                       │
│  PC grau, wenn tot  │  nicht.    │                       │
└─────────────────────┴────────────┴───────────────────────┘
```

Tippen auf einen Knoten füllt die mittlere Karte. Wetterstatistik bleibt ein **anderes** Lage-Thema, nicht Organ. `Lage` und `Körper` sind zwei Sichten, nicht zwei Hirne.

## 3D — live und anklickbar (nur Darstellung)

PO: Reel-Idee als **Körper-Modell**, live, tippbar. Inhaltliche Funktionen (Mails, Instagram, Desktop steuern wie dort) **nicht** übernehmen. Nur zeigen, was *dieses* Jarvis schon ist.

| Frage | Antwort |
|-------|---------|
| Geht 3D in der APK? | **Ja.** WebGL in derselben WebView. Three.js (oder gleichwertig leicht) als Schema: Knoten Hirn/Auge/Hand/Ohr/Mund/Gedächtnis, Linien dazwischen. Kein Spiel, keine 60-fps-Demo im Hintergrund. |
| Braucht das den PC? | **Nein**, um den Körper zu sehen und anzutippen. PC nur für PC-Auge/PC-Hand-Zustand. |
| Live | Organ leuchtet aus **echtem** Store: Hirn=`busy`/Face, Hand=letzter write + Confirm, Auge=letztes Foto, Ohr=Wake, Mund=TTS, Gedächtnis=Zählung. Kein erfundenes Herz, keine Fake-Prozent. |
| Anklickbar | Tippen wählt das Organ und zeigt denselben ehrlichen Satz wie die Kachel. **Kein** Tool-Execute, kein „Foto lesen“ nur weil das Auge glüht. Chat-Composer bleibt. |
| Drehen | Finger zieht die Sicht. Stillstand: **kein** Dauer-Render (Akku). `prefers-reduced-motion` oder WebGL tot → **2D-Kacheln**, dieselben Daten. |
| Zuschneiden | Labels deutsch, Grün/Schwarz wie die App, Friday/Jarvis nur als Face am Hirn. Nicht Claude-Laptop, nicht Iron-Man-Brust. |

Research `4.67` entscheidet: wie wenig Geometrie reicht, Pixel-Ratio-Kappe in der WebView, ob Default 3D oder Kacheln mit 3D-Schalter. Execute erst nach Spike auf einem echten Handy (nicht nur Chrome am PC).

## Researchphasen

### `4.66.0` Leitentscheidung

Dieses Dokument. **Done wenn:** APK-ja inkl. 3D-Schema, PC-nur-Organe, Klick≠Execute, Won’t-Liste, Organ-Tabelle.

### `4.67.0` Research: Schema + Kacheln

1. Default-Körper: Hirn, Auge, Hand, Ohr, Mund, Gedächtnis. PC-Auge/PC-Hand nur wenn `pc_enabled` + Host, sonst eine Zeile.  
2. Gold: `Körper an`, `Zeig den Körper`, `Körper aus` → wieder normale Lage. `Was sieht das Auge?` bleibt Tool `eye`, nicht nur HUD. Tippen aufs 3D-Auge = Kachel, nicht `eye`-Execute.  
3. WebGL-Spike in Capacitor: wenige Meshes, Raycast, Render nur bei Änderung/Drag. Pixel-Ratio kappen. Reduced-motion = 2D.  
4. Nicht: Film-Mesh, Dauer-Orbit, „Organ tot“-Drama wenn Wake aus ist.  
**Done wenn:** Katalog-IDs + Default-an + 3D-ja/nein-mit-Fallback in der Tabelle.

### `4.68.0` Research: Live ohne Lüge

1. Hirn-busy = bestehendes `busy`/Stream, nicht ein zweiter Timer.  
2. Hand = `last_*` / lastTool + Confirm-JSON (Taxi, Interrupt) — schon im Store, nicht neu erfinden.  
3. Poll: Körper-Kacheln lokal (kein Wetter-HTTP). PC-Status höchstens wie bisher `/v1/status`.  
**Done wenn:** welche Store-Felder, welches Poll-Budget.

### `4.69.0` Research: PC-Organe ehrlich

1. BAT tot → „PC nicht verbunden“, keine graue Fake-Desktop-Vorschau.  
2. Screenshot nicht als Live-Webcam loopen (Akku, Privacy). Nur letzter Stand oder auf Nachfrage.  
**Done wenn:** ein Satz für tot, ein Satz für da.

## Bau

| Version | Inhalt | Status |
|---------|--------|--------|
| **`4.66.0`** | Leitentscheidung | **PLAN** |
| **`4.67.0`** | Research Katalog + WebGL-Spike | geplant |
| **`4.68.0`** | Research Live-Felder | geplant |
| **`4.69.0`** | Research PC-leer | geplant |
| **`4.70.0`** | HUD-Intent `körper` + Setting-Sicht | geplant |
| **`4.71.0`** | 3D-Schema + Kacheln Hirn / Auge / Hand | geplant |
| **`4.72.0`** | Ohr / Mund / Gedächtnis klickbar | geplant |
| **`4.73.0`** | PC-Auge / PC-Hand ehrlich | geplant |
| **`4.74.0`** | Gold, Härten, Reduced-motion-2D | geplant |
| **`4.75.0`** | Sideload **nach** Hausstand `4.52` | geplant |

## Chat / Stimme (Ziel)

| User | Soll |
|------|------|
| `Körper an` / `Zeig den Körper` | Lage-Sicht Körper, Chat bleibt |
| Tippen auf ein Organ im Schema | Kachel füllen, **kein** Tool |
| `Körper aus` | vorige Lage-Module |
| `Was sieht das Auge?` / `Lies das Foto` | Tool `eye` wie heute |
| `Was siehst du auf dem PC` | PC-Auge, oder ehrlich ohne BAT |
| `Was macht die Hand?` | letzter write + Confirm, kein Roman |

## Settings

Unter Tablet-Lage oder eigenes Thema **Körper**: Sicht an/aus, 3D oder Kacheln. Hinweis: Darstellung intern, kein zweites Modell. PC-Organe brauchen JarvisPC.

## Dateien (Ziel)

| Datei | Rolle |
|-------|--------|
| `frontend/src/engine/body-parse.ts` | `Körper an/aus`, Organ-Aliase |
| `frontend/src/engine/hud-parse.ts` | Katalog-IDs `brain` `eye` `hand` … oder Sicht-Flag |
| `frontend/src/Lage.tsx` | Sicht Körper: Schema + Kacheln, echte Snaps |
| `frontend/src/BodySchema.tsx` (Ziel) | WebGL-Knoten, Raycast, Pause wenn unsichtbar |
| `frontend/src/engine/hud.ts` | Snap aus Store/lastTool, kein Fake |
| Tests | `pickRoute` / parse; **nicht** `registry.ts` importieren |

## Won’t

Mails-Agent. Instagram-Poster. 24/7-Cloud-Mitarbeiter. Jarvis-Cloud. Zweites Hirn auf dem PC. Fake-Gauges. Marvel-/Iron-Man-Mesh. Organ-Klick als Tool-Start. Live-Desktop-Stream. 60-fps-Idle in der WebView. Andere Apps auf dem Handy steuern wie ein PC-Computer-Use. Captcha-Bypass. Play Store, iOS.

## Abnahme

1. Handy ohne PC: 3D-Schema (oder 2D-Fallback) zeigt Hirn/Auge/Hand/Ohr/Mund/Gedächtnis, PC-Zeile ehrlich leer.  
2. Composer bleibt. Tippen auf ein Organ führt kein Tool aus.  
3. `Lies das Foto` ändert Auge-Knoten/Kachel nach echtem Lauf, nicht vorher.  
4. Taxi-Confirm erscheint an der Hand, Satz bleibt „Bestellt habe ich nicht.“  
5. Reduced-motion: 2D, kein Orbit. WebGL aus: dieselben Sätze als Kacheln.
