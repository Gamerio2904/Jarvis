# 45 — Bühne & Hirn (`6.0` / `6.50`) **CODE**

PO 2026-08-28: Animationen massiv, GUI Over-the-top, Antworten näher ChatGPT/Grok/Claude. **Nachzug 2026-08-28:** Gemini ist der **Hauptweg**. Groq und das kleine lokale Modell sind nur Backup. Kein größeres Modell lokal testen. Satellitenfoto an: virtueller Globus zum Zoomen; Jarvis dreht/zoomt auf „Zeig London“ und sagt, welche Stadt in der Sicht ist.

**Ist:** Code **`6.90.0`**. Sideload **`6.60.0`**. Gemini zuerst. Virtueller Globus mit Zoom/GIBS/Zeig-Stadt + Briefing + Welt-Tour. Motion 30 fps. Fahrmodus-HUD. Sprach-Orb + Stimmen-Picker. Parser [`46-next.md`](./46-next.md). Split/Identität/Overlay [`47-next.md`](./47-next.md). Globus-Briefing [`48-next.md`](./48-next.md).

**Lücke:** Smalltalk ohne Gemini-Key bleibt klein (gewollt — 0,5B ist Backup). Debug-Hintergrund `5.12`. LocateAnything-Gewichte. Kein 1,5B.

Schiene Execute in `6.50.0`, Sideload `6.60.0`. Debug-Hintergrund bleibt `5.12`. Kein 1,5B-Spike.

## Ehrlichkeit: Hirn und „Live-Erde“

| Wunsch | Was wir bauen | Was wir nicht behaupten |
|--------|----------------|-------------------------|
| So klug wie ChatGPT/Claude | **Gemini** sobald ein Key da ist. Das ist der normale Weg. | 0,5B oder Groq als gleichwertiges Hirn |
| Offline / Gemini tot | Groq, wenn Key da. Sonst 0,5B oder ehrlich „Modell aus / Cloud fehlt“. | Ein zweites großes Modell auf dem Handy |
| Live-Webcam der Erde | Gibt es öffentlich nicht | „Live“-Label, Video |
| Reinzoomen wie ein Globus | NASA **GIBS** True-Color-Kacheln, Stand **Stunden** alt, Datum sichtbar. Weit raus: Blue Marble | Street-View, Wolken in Echtzeit |
| „Zeig London“ | Lexikon-Ort → drehen, zoomen, Satz mit Namen. Sir selten. | Ort erfinden, der nicht in der Tabelle steht |
| „Was ist das für eine Stadt?“ | Blickmitte der Kugel → nächster Lexikon-Ort in Reichweite, sonst ehrlich Meer/keine Stadt | Personen beobachten, jedes Dorf der Welt |

Ohne Gemini-Key bleibt Jarvis ein Geräte-Butler plus kleinem Backup-Smalltalk. Die Bühne und der Globus lohnen sich trotzdem.

## Kurz: was wir konkret bauen

| Fläche | Vor `6.0` | `6.50` CODE | Won’t |
|--------|-----------|-------------|-------|
| Hirn | Gemini Opt-in, 0,5B Default | **Gemini zuerst**, Groq Backup, 0,5B letzter Fallback. Kein 1,5B-Test | 0,5B als Claude verkaufen |
| Motion | mehrere Zeichnungen parallel | Eine Sicht, 30 fps Akku, Pause im Hintergrund | 60 fps Idle |
| Chat-GUI | Tool-Badge | Chip, Mitlauf zur Lage | Markdown-Bubbles |
| Körper | Knoten-Schema | Licht/Pulse aus echten Werten, Kamera zum Organ | Iron-Man-Mesh, Fake-CPU |
| Kugel | Blue Marble, Pins, Koordinaten-Satz | **Virtueller Globus:** Zoom, GIBS nah mit Datum, „Zeig *Stadt*“, „Was ist das?“ | Live-Video, Überwachung |
| Fahrmodus | Karte + Text-HUD | Glas-HUD, echter Pfeil, Spotify nur wenn Track läuft | Apple CarPlay |
| Sprache | Phasen + Wake-Bubble | Orb aus Mic, Stimmen-Picker, Barge-in | ElevenLabs, Stimmklon |
| Tool-Sätze | Canned | Gemini darf **dieselben** Fakten in 1–3 Sätzen sagen | Neue Zahlen erfinden |

## Leitentscheidung

| Thema | Entscheidung |
|-------|----------------|
| Hirn | **Gemini = Hauptweg** (Key in den Einstellungen). Groq nur wenn Gemini fehlt oder ausfällt. 0,5B nur wenn beide Clouds tot oder bewusst „nur lokal“. |
| Lokal größer | **Kein** 1,5B/3B-Spike. 0,5B bleibt das einzige On-Device-Modell. |
| Tools | Parser wählen Geräte. Gemini formuliert, widerspricht den Fakten nicht. |
| Globus | Dieselbe Lage-Sicht Kugel. Weit: Blue Marble. Ran: GIBS-Kacheln, Label „Stand Datum, oft Stunden alt“. Zoom per Geste und per Satz. |
| Stadt zeigen | `Zeig London` / `Zeig mir Paris` = drehen, zoomen, Pin, ein Satz. Unbekannter Name → „Den Ort habe ich auf der Kugel nicht.“ |
| Stadt erkennen | `Was ist das für eine Stadt?` / `Was sehe ich?` bei offener Kugel = Blickmitte gegen Lexikon. Treffer: Name + kurzer fester Satz (Gemini darf ihn schleifen). Kein Treffer: Meer oder „keine Stadt in der Sicht“. |
| Sir | Selten, situativ — nicht jeder Globus-Satz. |
| Motion | Reduced-motion und Akku schlagen Cinematic. |
| Sideload | **CODE** `6.60.0`. Hausstand vor Neuinstall. |

## Ortslexikon (Globus)

Keine freie Weltkarte aller Dörfer. Tabelle im Code: Hauptstädte + die Orte, die wir schon haben (Berlin, London, Paris, Ingersheim, …) plus eine **erweiterte** Liste gängiger Städte mit lat/lon und einem **festen** Halbsatz (Paris: Liebe/Seine — Klischee aus der Tabelle, keine Wikipedia-Erfindung zur Laufzeit).

Blickmitte → nächster Eintrag unter festem Kilometer-Limit (z. B. ~80 km). Darüber: kein Raten.

## Sprints

| Sprint | Version | Inhalt |
|--------|---------|--------|
| 121 | `6.0.0` | Leitentscheidung (dieses Dokument) — **CODE** in `6.50.0` |
| 122 | `6.10.0` | Motion-Kern + Chat-Gewand — **CODE** in `6.50.0` |
| 123 | `6.20.0` | Körper-Show + **virtueller Globus** — **CODE** in `6.50.0` |
| 124 | `6.30.0` | Fahrmodus-Bühne — **CODE** in `6.50.0` |
| 125 | `6.40.0` | Sprach-Theater + Stimmen-Picker — **CODE** in `6.50.0` |
| 126 | `6.50.0` | Hirn: Gemini zuerst, Tool-Schliff, Kontext. Kein 1,5B — **CODE** |
| 127 | `6.51.0` | Parser nach Prompt-Test — **CODE** |
| 128–130 | `6.60.0` | Split, Identität, Overlay, Sideload — **CODE** [`47-next.md`](./47-next.md) |

`5.12` Debug-Service und LocateAnything `4.77` daneben. GIBS ist **nicht** mehr Parkplatz — Execute in **123**.

## Research (in dem Sprint der Fläche)

| Version | Frage | Grün wenn |
|---------|-------|-----------|
| `6.1`–`6.3` | FPS, Reduced-Motion, eine Zeichnung | 30 fps, Tab hidden = aus |
| `6.21` | Fly-to + Zoom ohne Extra-Netz für Lexikon-Orte | London/Paris/Berlin aus der Tabelle |
| `6.22` | GIBS-Kacheln ab Zoom-Schwelle | Datum sichtbar, Blue Marble darunter, Akku ok |
| `6.23` | Blickmitte → Stadt | Paris in Sicht = Paris; Atlantik = kein Stadt-Name |
| `6.31` | Drive-HUD bei Karten-Load | kein Einfrieren |
| `6.41` | Gemini-Stimmenliste | < 3,5 s stehend; Steuer Native-first |
| `6.51` | Tool-Schliff + Parser nach Prompt-Test [`46-next.md`](./46-next.md) | **CODE.** Guard streicht neue Orte/Zahlen. Matrix-Gaps zu. |

## Gold (Abnahme)

1. Gemini-Key an → Plaudern und Tool-Schliff über Gemini. Key weg / Gemini tot → Groq, sonst 0,5B, sonst ehrlicher Satz.
2. `zeig mal den körper` → Kamera zum Hirn, Pulse nur echt.
3. `Zeig mir London` → Kugel dreht, zoomt, „Das ist London.“ (Sir höchstens einmal). GIBS wenn nah genug, mit Stand-Datum.
4. Kugel auf Paris, `Was ist das für eine Stadt?` → Paris, kurzer fester Satz, optional von Gemini geschliffen — keine erfundenen Einwohner.
5. Kugel über dem Atlantik, dieselbe Frage → keine Stadt erfunden.
6. Fahrmodus-Pfeil aus echter Route. Spotify-Glow nur bei laufendem Track.
7. Sprach-Orb folgt dem Mic. Captcha/Banking weiter Won’t.

## Won’t

Marvel-Mesh. 60 fps Idle. Live-Satellitenvideo. Street-View. Überwachung. ElevenLabs. 0,5B als Claude. Größeres Modell lokal. Computer-Use. Auto-Ja. Play Store / iOS.

## Stories

| ID | Inhalt |
|----|--------|
| B1 | Motion-Budget, Reduced-Motion |
| B2 | Chat-Chip, Lage-Mitlauf |
| B3 | Körper Pulse + Ease |
| B4 | Globus Zoom + GIBS + Fly-to |
| B5 | `Zeig *Stadt*` dreht/zoomt/spricht |
| B6 | `Was ist das für eine Stadt?` aus Blickmitte |
| B7 | Drive-HUD |
| B8 | Sprach-Orb + Stimmen-Picker |
| B9 | Gemini zuerst, Groq/0,5B Backup, Tool-Schliff mit Guard |

## Reihenfolge vs. Reste

1. Globus-Briefing `6.70` — [`48-next.md`](./48-next.md) **PLAN**.
2. LocateAnything-Gewichte nach 3060-GO.
3. Debug-Service `5.12` nur wenn der Lauf bei App-zu sterben würde.
