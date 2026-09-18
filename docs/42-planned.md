# 42 — Alles geplant (Stand Code `17.0.0`)

Eine Liste, die **zum Code und zu den offenen Resten passt**.

**Live:** App-Code **`18.1.2`**. Sideload **`18.1.2`**, versionCode `180102`. Vor Neuinstall Hausstand exportieren (Export ist CODE, Keys sonst weg). Test: [`TEST-18.1.2.md`](./TEST-18.1.2.md).

Hirn = Handy. PC = Werkzeug. **Heute (`17.0.0`):** Groq primär → Gemini Spezialist → 0,5B. Parser wählen Tools; Director koordiniert Agenten. Ist-Stand des Netzwerks: [`66-agents-ist.md`](./66-agents-ist.md).

## Pull-Reihenfolge

1. **`18.0.0` zeigen und spielen** [`70-next.md`](./70-next.md) — Sprints **260–271**. Live in `18.0.8`. Kein LLM-Organizer (§0b)
2. **Audit-Reste** [`71-audit.md`](./71-audit.md) — Sprints **272–281 CODE** in `18.1.0`. **282** Freeze. Gerät-PO: [`TEST-18.1.0.md`](./TEST-18.1.0.md)
3. **Karten-Reste** [`73-next.md`](./73-next.md) — Sprints **288–290**. Unbekannter Ort ohne Netz, Mikrofon-Absage, Overlay/Gespräch. 290 Ziel `18.1.3`
4. **`18.2` Ideen halten** [`72-next.md`](./72-next.md) — Sprints **283–287**. Festhalten, Überblick, **feste Sprint-Vorlage**, Jarvis füllt auf Zuruf und darf Custom-Sprints anlegen. Kein Architect-Organizer, kein RICE, kein Notion, Plan wird nicht ausgeführt
5. **`18.3` Watchliste** [`74-next.md`](./74-next.md) — Sprints **291–296**. Watchliste + Lieblinge, Overlay-Slides, OMDb-Noten, Gesehen intern, Tipp (Lieblinge schwer). Nach 18.2
6. **`18.4` Körper/Wissen** [`75-next.md`](./75-next.md) — Sprints **297–300**. Katalog am Körper, Agent↔Pack, Pack-Links + 1-Hop. Nach 18.3
7. **PO Handy** Sprint [`178`](./sprints/sprint-178.md) — Katalog 168 + Home-FGS 30 s ⚠︎ Anker veraltet
8. **OEM-Akku** [`183`](./sprints/sprint-183.md) — nur wenn 178 rot ⚠︎
9. **`9.9.3`** [`186`](./sprints/sprint-186.md) — nur wenn 168 rot ⚠︎
10. **Could-ONNX** Freeze [`181`](./sprints/sprint-181.md) bis Messung; Smalltalk [`184`](./sprints/sprint-184.md) Could ⚠︎
11. Parking: Mail, Cloud-Kalender, Alexa, Play Store, iOS, NAS-Hirn
12. **`10.0` CODE** [`56-next.md`](./56-next.md) — Schema/Gate/Retrieve-2/Graph/Gold in `10.60.0`; Gerät 193 PO; 195 Freeze
13. **Memory-10 Intensiv** [`57-next.md`](./57-next.md) — 196–201 **CODE** in `10.66.0`
14. **`11.0` CODE** [`58-next.md`](./58-next.md) — Fachwissen-Packs + Deep Research in `11.60.0`; 202–208 Execute; kein Diebstahl von `10.61`
15. **`12.0` CODE** [`59-next.md`](./59-next.md) — Drei Flächen in `12.70.0`; 209–216 Execute; kein Diebstahl von `11.0`
16. **`13.0` CODE** [`60-next.md`](./60-next.md) — Körper-Wissensbaum in `13.30.0`; 217–220; kein Qdrant, e5 Freeze
17. **`13.40` CODE** [`61-next.md`](./61-next.md) — Sprachmodus in `13.44.0`; 221–225

**⚠︎** Diese vier Einträge (178, 183, 184, 186; dazu 185) sind sachlich offen, nennen als Ziel aber `8.0`–`9.10.0`, während der Code bei `17.0.0` steht. Es sind Geräte- und PO-Sprints plus Bedingte. Vor dem Ziehen **neu verankern**, sonst prüft der PO eine App, die es nicht mehr gibt. Details in [`sprints/README.md`](./sprints/README.md).

## PLAN — Schiene `18.0.0` (Sprints 260–271)

| Version | Sprint | Thema |
|---------|--------|-------|
| `17.1.0` | [260](./sprints/sprint-260.md) | Screenshot-Fixes: Schach-Route, Wahl-Live, Satzabbruch |
| `17.2.0` | [261](./sprints/sprint-261.md) | Chat-Blöcke, fail-closed |
| `17.3.0` | [262](./sprints/sprint-262.md) | Bundesliga-Tabelle als Karte |
| `17.4.0` | [263](./sprints/sprint-263.md) | Bilder nur auf Verlangen |
| `17.5.0` | [264](./sprints/sprint-264.md) | `chess.js`, deutsche Züge |
| `17.6.0` | [265](./sprints/sprint-265.md) | Schach-Modus |
| `17.7.0` | [266](./sprints/sprint-266.md) | Stockfish opt-in |
| `17.8.0` | [267](./sprints/sprint-267.md) | Coach selten, aus der Bewertung |
| `17.9.0` | [268](./sprints/sprint-268.md) | Kugel: Tag/Nacht + ISS-Bahn — **CODE** in `18.0.0` |
| `17.10.0` | [269](./sprints/sprint-269.md) | Kugel: Schichten auf Zuruf — **CODE** in `18.0.0` |
| — | [270](./sprints/sprint-270.md) | Freeze `globe.gl` — **NICHT GEZOGEN** |
| **`18.0.0`** | [271](./sprints/sprint-271.md) | **Meilenstein** Kugel |

Harte Ketten: 260 → alles; 261 → 262/263/265; 264 → 265 → 266 → 267; 268 → 269.
Kein LLM spielt Schach. Kein GPL-Brett. Kein Bild ohne Parser. Kein LLM-Organizer.
Kein EarthOS. `globe.gl` nur nach Framezeit.

Begründung und Reel-Triage: [`70-next.md`](./70-next.md).

## PLAN — Schiene `18.2` (Sprints 283–287)

| Version | Sprint | Thema |
|---------|--------|-------|
| `18.2.0` | [283](./sprints/sprint-283.md) | Idee festhalten |
| `18.2.1` | [284](./sprints/sprint-284.md) | Überblick: Liste, Parken, Erledigt |
| `18.2.2` | [285](./sprints/sprint-285.md) | Sprintplan-Vorlage im Code |
| `18.2.3` | [286](./sprints/sprint-286.md) | Plan auf Zuruf füllen, Custom erlaubt |
| `18.2.4` | [287](./sprints/sprint-287.md) | Ergänzen, Custom nach Satz, Erinnerung |

Harte Kette: 283 → 284 → 285. 286 braucht das Schema. 287 braucht die Vorlage.
Kein Architect-Organizer. Kein RICE. Kein Notion. Plan wird nicht ausgeführt.

Begründung: [`72-next.md`](./72-next.md). Audit-Zahlen 272–282 bleiben
[`71-audit.md`](./71-audit.md). Karten-Nachzug 288–290:
[`73-next.md`](./73-next.md).

## PLAN — Karten-Reste (Sprints 288–290)

| Version | Sprint | Thema |
|---------|--------|-------|
| `18.0.9` | 288 | Unbekannter Ort ohne Netz |
| `18.0.9` | 289 | Mikrofon-Absage sichtbar |
| `18.1.3` | 290 | Overlay-Zurück vs. Gesprächswechsel |

Begründung: [`73-next.md`](./73-next.md).

## PLAN — Schiene `18.3` (Sprints 291–296)

| Version | Sprint | Thema |
|---------|--------|-------|
| `18.3.0` | [291](./sprints/sprint-291.md) | Watchliste + Lieblinge festhalten |
| `18.3.1` | [292](./sprints/sprint-292.md) | Overlay für Watchliste und Lieblinge |
| `18.3.2` | [293](./sprints/sprint-293.md) | Poster, Kritiker + Publikum über OMDb |
| `18.3.3` | [294](./sprints/sprint-294.md) | Konflikte, reduced-motion, Probe |
| `18.3.4` | [295](./sprints/sprint-295.md) | Gesehen intern, Wissenszentrum |
| `18.3.5` | [296](./sprints/sprint-296.md) | Filmtipp aus Lieblingen |

Harte Kette: 291 → 292 → 293. 294 braucht Parser und Overlay.
295 braucht 291. 296 braucht 291 + 295.
Kein RT-Scrape. Keine erfundenen Prozent. `Spiel … Film` bleibt TV.
Kein Sideload `18.3.x` solange die APK `18.1.2` ist.

Begründung: [`74-next.md`](./74-next.md).

## PLAN — Schiene `18.4` (Sprints 297–300)

| Version | Sprint | Thema |
|---------|--------|-------|
| `18.4.0` | [297](./sprints/sprint-297.md) | Knoten: Organ-Baum aus dem Katalog |
| `18.4.1` | [298](./sprints/sprint-298.md) | Kanten: Agent↔Pack, Broadcast-Allowlist |
| `18.4.2` | [299](./sprints/sprint-299.md) | Zentrum: Pack-Links + 1-Hop Retrieve |
| `18.4.3` | [300](./sprints/sprint-300.md) | Härten, Probe, Motion |

Harte Kette: 297 → 298 → 299. 300 braucht 297 und 298.
Kein Qdrant, kein LLM-Organizer, kein Graphiti/cognee, keine neue Graph-Lib.
Kein Sideload `18.4.x` solange die APK `18.1.2` ist.

Begründung: [`75-next.md`](./75-next.md).

## CODE — Audit-Reste `18.1.0` (Sprints 272–281)

| Version | Sprint | Thema |
|---------|--------|-------|
| `18.1.0` | [272](./sprints/sprint-272.md) | Java-11 im Quelltext + PO-Gerät |
| `18.1.0` | [273](./sprints/sprint-273.md) | `factual` + ehrliche Absage |
| `18.1.0` | [274](./sprints/sprint-274.md) | fuel/poi `device`, ein Versuch |
| `18.1.0` | [275](./sprints/sprint-275.md) | SMS `sentIntent` |
| `18.1.0` | [276](./sprints/sprint-276.md) | Fahrmodus-Cleanup, Kalender-Fokus |
| `18.1.0` | [277](./sprints/sprint-277.md) | Widerspruch → Suche an `last_step_tool` |
| `18.1.0` | [278](./sprints/sprint-278.md) | `looksTruncated` mit Abkürzungen |
| `18.1.0` | [279](./sprints/sprint-279.md) | `scripts/` unter tsc |
| `18.1.0` | [280](./sprints/sprint-280.md) | exhaustive-deps einzeln |
| `18.1.0` | [281](./sprints/sprint-281.md) | Leichen-Test |
| — | 282 | Freeze versionCode-Schema |

Anker in 71 waren `18.0.4`/`18.0.5`/`18.1.0`; live war schon `18.0.8`, deshalb
ein Bündel **`18.1.0`**. 290 rückt auf `18.1.3`.

## CODE — Schiene `17.0.0` (Sprints 249–259)

| Version | Sprint | Thema |
|---------|--------|-------|
| `16.2.0` | [249](./sprints/sprint-249.md) | Eval-Rahmen: `node:test`, eine Korpus-Quelle |
| `16.3.0` | [250](./sprints/sprint-250.md) | Eval-Kennzahlen + Baseline, Prompt-Tokens, Sprach-A/B |
| `16.4.0` | [251](./sprints/sprint-251.md) | Sicherungsschalter + **Kontingent** + Agenten-Reste |
| `16.5.0` | [252](./sprints/sprint-252.md) | Lage-Entscheidung (PO) + Wecker-Nummer |
| `16.6.0` | [253](./sprints/sprint-253.md) | Abbruch bis in die Handler + Barge-in verdrahten |
| `16.7.0` | [254](./sprints/sprint-254.md) | Satzende-Heuristik (A) + Silero opt-in (B) |
| — | [255](./sprints/sprint-255.md) | **AUFGELÖST** — existiert im Code; Rest in 253 und 254 A |
| `16.8.0` | [256](./sprints/sprint-256.md) | Feldschutz + Migrationsschritte (verkleinert) |
| `16.9.0` | [257](./sprints/sprint-257.md) | Trennschärfe-Tor; Alltagsdeutsch statt Embeddings |
| `16.10.0` | [258](./sprints/sprint-258.md) | Werkzeug-Vertrag, erzwungenes JSON, ein Modellaufruf |
| **`17.0.0`** | [259](./sprints/sprint-259.md) | Historie im Speicher + **Meilenstein** (verkleinert) |

Frei kombinierbar: 251, 252, 253, 254 A, 256. Harte Ketten: 250 → 257, 254 A → 254 B.

**Gegen die PO-Prioritäten geprüft.** Vorgaben: hohe Antwortqualität, alles funktioniert, wenig Latenz, kostenlos und viel nutzbar — und nur ändern, wenn es einer Kategorie nutzt, ohne einer anderen zu schaden. Ergebnis: **255 aufgelöst** (Barge-in und Satzende existieren; ein Klassifikator hätte Latenz und Kontingent gekostet), **256 und 259 verkleinert** (Aufteilung und IndexedDB-Ring gestrichen), **257 und 258 mit Latenz-Schranke** (Embedding nur bei Gleichstand, ein Modellaufruf je Zug). Rechnung je Sprint: [`68-next.md`](./68-next.md) §3b.

**Zwei Entscheidungen aus der Planungsrunde** ([`69-modell-grundlagen.md`](./69-modell-grundlagen.md)):

- **Interne Sprache:** Persona, Ton und Beispiele bleiben **deutsch** (sie sind
  faktisch Few-Shot-Beispiele; ein Sprachwechsel würde vorgelesen). Nur
  Maschinenseitiges — Werkzeug-Schemas, Feldnamen, Intent-Labels — wird neu auf
  **englisch** geschrieben, in Sprint 258. Keine Migration. A/B-Messung in 250.
- **Free Tier ist kostenlos, aber nicht unbegrenzt:** 1.000 Requests und
  200.000 Tokens am Tag für die Chat-Modelle, pro Organisation. Das sind rund
  **80 Züge am Tag**. Sprint 251 schaltet deshalb *vor* der Grenze auf das
  lokale 0,5B, statt in `429` zu laufen.

---

Industry-Track V1–V9, Latenz-Loop, Screenshot-Fixes, Rest-final Execute, Alltag-Router, Parser-Härte 179, FGS-Härte 180, Docs 182: **CODE**.

Bereits **CODE** in `9.10.0`: Debug-FGS (Tap/WakeLock/`resumeTimers`), Sehen-Freeze-Satz, Could-Schalter ohne Gewichte, Alltag-Parser-Härte. In `9.9.2`: Screenshot-Fixes. In `9.9.1`: Handy-Lage chat-first. In `9.9.0`: V9 Hardening.

---

## CODE auf diesem Stand (`17.0.0`)

| Schiene | Version | Was im Code ist |
|---------|---------|-----------------|
| Messbar und unterbrechbar | `17.0.0` | Eval, Abbruch, Alltagsdeutsch, Werkzeug-Vorschlag, Historie der letzten 50 Züge |
| Wecker | `16.1.1` | Abgelaufene Frist wird geschlossen, Nachholen nur im Browser, wiederkehrende Alarme halten ihre Uhrzeit |
| Agenten-Härtung | `16.1.0` | Budget je Nebenwirkung, Wiederholung nur beim Lesen, ehrlicher Fehler statt Modell-Fallback, Traces mit Zugnummer |
| Reels & QA | `16.0.0` | Theme-Blende, Kalender-Umbau, Schalter statt Kästchen, Lage ohne Blackscreen, Einstellungs-Suche |
| Agenten-Netzwerk | `15.1.0` | Catalog, Bus, Director, Curator, Agenten-Karte, 60 Agenten, Debug-Traces |
| Dual Brain | `15.1.0` | Groq primär, `brain-orchestrator`, micro-clarify/merge/research-lite |
| Sprachmodus | `13.44.0` | TV-Stimme, Hören, 1–2 Sätze, eine TTS-Lane; kein Whisper |
| Weltlage | `4.0` | `outlook.ts` — Tagesschau/DW, Serie, Szenario, kein Orakel |
| Alltagskette | `4.19` | Bar-POI, SMS-Note, Taxi nach Ja, nie „bestellt“ |
| Stimme/Steuer | `4.33` | TTS Algieba, HUD-Interrupt, Watchdog opt-in |
| Hausstand | `4.46` | Export/Import JSON, `repairSpeech` / `pickHeard` |
| Friday + Tablet | `4.53` | Face Jarvis/Friday, Lage **neben** Chat |
| Körper | `4.66` | Lage-Sicht Körper, Canvas-Schema, Organ-Kachel, kein Tool-Start |
| Sehen-Parser | `4.76`–`4.97` | `ground-parse`, `/v1/ground` Client, zwei Confirms; **keine** 3B-Gewichte |
| Weltkugel | `5.0` / `6.20` | Lage-Sicht Kugel Canvas 2D, GIBS beim Zoom, Pins ISS-Punkt/GPS/DWD/outlook-Lexikon. **Kein** Terminator im Code `17.0.0` — Nachzug Sprint 268 |
| Debug-Lauf | `5.11` / `5.17` | Klickboxen, FGS „Jarvis testet…“, JSON+TXT mit Verdict + Latenz |
| Bühne & Hirn | `6.50` / `15.1.0` | Ab 15.1: Groq primär via `brain-orchestrator`; Gemini Spezialist |
| Parser | `6.51` | Wont/Help/HUD-Skip nach Prompt-Test |
| Split / Overlay / APK | `6.60` | Live-Split, Identität canned, Overlay Gemini zuerst, `releases/Jarvis.apk` |
| Globus-Briefing | `6.90` | Fly-to 4.4, Stadt-Briefing, Welt-Tour Glow, Debug-Gruppe |
| Stabilität V1 | `6.91`–`6.93` | Turn-Gate, Debug-Session, Overlay-FSM, Weltlage ≠ Wecker, Gemini-Retry, `ja bitte` |
| Voice & App V2 | `6.94`–`6.96` | TTS-Primary Standing, App-Actions, Banner einmal, Wake-Final |
| Verified Actions V3 | `6.97`–`6.99` | Action-FSM, Navi-Replace verifiziert, Research-Pending hart |
| Dokumente V4 | `9.0` | Datei-Knopf PDF/Text/Foto, Parser, OCR, Verify Upload |
| Memory V5 | `7.0` | Hierarchical Memory: Quelle, Confidence, Contradiction, Prune |
| Memory `10.0` | `10.60.0` | Schema kind/tense/entities, Gate, Retrieve 2 (Alias/Boost), 1-Hop, Gold G1–G6, Utility-Prune; e5 Freeze |
| TV V6 | `9.1` | Device-Registry, Verify Launch, kein SmartThings |
| PC V7 | `9.2` | Capability-Levels, Confirm, Verify Launch/Klick |
| Live V8 | `9.3` | `/v1/webrtc` Signaling, LAN-JPEG-Dock, WebRTC nur mit Peer |
| Hardening V9 | `9.9` | Regression-Katalog, LAN-only PC, Secret-Redact, Password-Felder |
| Körper-Baum | `13.30.0` | Organ-Eingang, BodyTree, Kalender nächsten Freitag |
| Live-Patches | `13.31.7` | Navigation-Island, PC-QR, Liquid-Download, Gemini-Key-Opt-in |
| Sprachmodus | `13.44.0` | TV-Stimme, Hören, 1–2 Sätze, eine TTS-Lane; kein Whisper |
| Davor | `3.19`–`3.0` / `1.x` | Kalender-Fenster, Register, Auge=Gemini, PC-Screenshot |

## Offen

### Dual Brain Sprint 238 **CODE** (`15.2.0`)
SLO-Gates, Shadow, Ship. [`63-next.md`](./63-next.md). Ist-Hirn: Groq primär.

### PO Handy (Sprint 178)
Parser CODE. **PO** auf dem Handy: Probe V1–V9 + Screenshot-Bugs + Home-FGS 30 s.

### LocateAnything (`4.77`)
Parser CODE. Gewichte **Freeze**, bis eine RTX 3060 misst.

### Qualität-Could (Gewichte)
Schalter CODE. Silero/Piper/Kokoro/e5 **nicht** in der APK. Sprint **181** Freeze.

### Alltag vom Zettel (`8.0`)
Router + Parser-Härte **CODE**. Gerät-Tore Sprint **185** PO.

### Parking
Mail, Cloud-Kalender, Alexa, Play Store, iOS, NAS-Hirn, Welt-Geocoder, Live-Sat, Geheim-Nachrichten-Feed. Qdrant/Qwen-Embed/ColPali/Multi-Agent — [`56-next.md`](./56-next.md) Won’t.

### `10.0` Semantisches Gedächtnis (CODE `10.60.0`)
Schema, Gate, Retrieve-2, Graph light, Gold G1–G6, Experience **CODE**. 195 e5 **FREEZE** (G2/G3 grün ohne Encoder). Gerät-Protokoll Sprint **193** PO. Sideload damals `9.10.0`, Live `13.31.7`. [`56-next.md`](./56-next.md).

Intensiv 196–201: [`57-next.md`](./57-next.md) **CODE** `10.66.0`.

### `11.0` Fachwissen + Deep Research (CODE `11.60.0`)
Getrennt von Cap-80-Prefs. Teach nur nach „lern das“. Deep = mehr Queries, kein 12-h-Crawl. Instagram-Reel ist **kein** Ingest. [`58-next.md`](./58-next.md) Sprints 202–208 **CODE**.

### `12.0` Drei Flächen (CODE `12.70.0`)
Handy = Hirn. Tablet = Lage+Chat ab 900 px oder Fenster. PC = Werkzeug `:18790` + Viewer `:18791`. Presence Default aus. VR Parking. Native Bind auf der Sideload-APK fehlt — Handler ist CODE, Schalter bleibt ehrlich. [`59-next.md`](./59-next.md) Sprints 209–216 **CODE**.

### `13.0` Körper-Wissensbaum (CODE `13.30.0`)
Organ = Eingang. Baum = Skill + Wissen (Packs/Pins/Termine). Token-Cluster, kein Vektorindex. [`60-next.md`](./60-next.md) Sprints 217–220 **CODE**.

### `13.40` Sprachmodus (CODE `13.44.0`)
„Fernseher an“ aus dem Mic, Autokorrektur, 1–2-Satz-Antworten, flüssiger Mund. [`61-next.md`](./61-next.md) Sprints 221–225 **CODE**.

Nächste Produktschiene: **`18.2`** [`72-next.md`](./72-next.md) Sprints 283–287. Audit-Reste 272–282 in [`71-audit.md`](./71-audit.md). Gerät-PO [`55-next.md`](./55-next.md) (178) ⚠︎ Anker veraltet.
