# 42 — Alles geplant (Stand Code `16.1.1`)

Eine Liste, die **zum Code und zu den offenen Resten passt**.

**Live:** App-Code **`16.1.1`**. Sideload **`16.1.1`**, versionCode `160101`. Vor Neuinstall Hausstand exportieren (Export ist CODE, Keys sonst weg).

Hirn = Handy. PC = Werkzeug. **Heute (`16.1.1`):** Groq primär → Gemini Spezialist → 0,5B. Parser wählen Tools; Director koordiniert Agenten. Ist-Stand des Netzwerks: [`66-agents-ist.md`](./66-agents-ist.md).

## Pull-Reihenfolge

1. **`17.0.0` messbar und unterbrechbar** [`68-next.md`](./68-next.md) — Sprints **249–259**, geplant aus [`67-upgrades.md`](./67-upgrades.md). Reihenfolge: erst messen (249–250), dann das Billige (251–252), dann Sprache (253–255), dann Struktur (256–259)
2. **PO Handy** Sprint [`178`](./sprints/sprint-178.md) — Katalog 168 + Home-FGS 30 s
4. **OEM-Akku** [`183`](./sprints/sprint-183.md) — nur wenn 178 rot
5. **`9.9.3`** [`186`](./sprints/sprint-186.md) — nur wenn 168 rot
6. **Could-ONNX** Freeze [`181`](./sprints/sprint-181.md) bis Messung; Smalltalk [`184`](./sprints/sprint-184.md) Could
7. Parking: Mail, Cloud-Kalender, Alexa, Play Store, iOS, NAS-Hirn
8. **`10.0` CODE** [`56-next.md`](./56-next.md) — Schema/Gate/Retrieve-2/Graph/Gold in `10.60.0`; Gerät 193 PO; 195 Freeze
9. **Memory-10 Intensiv** [`57-next.md`](./57-next.md) — 196–201 **CODE** in `10.66.0`
10. **`11.0` CODE** [`58-next.md`](./58-next.md) — Fachwissen-Packs + Deep Research in `11.60.0`; 202–208 Execute; kein Diebstahl von `10.61`
11. **`12.0` CODE** [`59-next.md`](./59-next.md) — Drei Flächen in `12.70.0`; 209–216 Execute; kein Diebstahl von `11.0`
12. **`13.0` CODE** [`60-next.md`](./60-next.md) — Körper-Wissensbaum in `13.30.0`; 217–220; kein Qdrant, e5 Freeze
13. **`13.40` CODE** [`61-next.md`](./61-next.md) — Sprachmodus in `13.44.0`; 221–225

## PLAN — Schiene `17.0.0` (Sprints 249–259)

| Version | Sprint | Thema |
|---------|--------|-------|
| `16.2.0` | [249](./sprints/sprint-249.md) | Eval-Rahmen: `node:test`, eine Korpus-Quelle |
| `16.3.0` | [250](./sprints/sprint-250.md) | Eval-Kennzahlen + Baseline |
| `16.4.0` | [251](./sprints/sprint-251.md) | Sicherungsschalter + Agenten-Reste |
| `16.5.0` | [252](./sprints/sprint-252.md) | Lage-Entscheidung (PO) + Wecker-Nummer |
| `16.6.0` | [253](./sprints/sprint-253.md) | Abbruch bis in die Handler |
| `16.7.0` | [254](./sprints/sprint-254.md) | VAD statt Stillezähler |
| `16.8.0` | [255](./sprints/sprint-255.md) | Satzende + Barge-in |
| `16.9.0` | [256](./sprints/sprint-256.md) | Einstellungen aufteilen |
| `16.10.0` | [257](./sprints/sprint-257.md) | Intent-Embeddings |
| `16.11.0` | [258](./sprints/sprint-258.md) | Werkzeug-Vertrag |
| **`17.0.0`** | [259](./sprints/sprint-259.md) | Telemetrie + **Meilenstein** |

Frei kombinierbar: 251, 252, 256. Harte Ketten: 250 → 257, 253 + 254 → 255.

---

Industry-Track V1–V9, Latenz-Loop, Screenshot-Fixes, Rest-final Execute, Alltag-Router, Parser-Härte 179, FGS-Härte 180, Docs 182: **CODE**.

Bereits **CODE** in `9.10.0`: Debug-FGS (Tap/WakeLock/`resumeTimers`), Sehen-Freeze-Satz, Could-Schalter ohne Gewichte, Alltag-Parser-Härte. In `9.9.2`: Screenshot-Fixes. In `9.9.1`: Handy-Lage chat-first. In `9.9.0`: V9 Hardening.

---

## CODE auf diesem Stand (`16.1.1`)

| Schiene | Version | Was im Code ist |
|---------|---------|-----------------|
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
| Weltkugel | `5.0` / `6.20` | Lage-Sicht Kugel, Terminator, GIBS beim Zoom, Pins ISS/GPS/DWD/outlook-Lexikon |
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

### Dual Brain Sprint 238 **PLAN**
SLO-Gates, Shadow-Sign-off, Ship `15.2.0`. [`63-next.md`](./63-next.md).

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

Nächste Schiene: Dual Brain **238** [`63-next.md`](./63-next.md), dann Gerät-PO [`55-next.md`](./55-next.md) (178).
