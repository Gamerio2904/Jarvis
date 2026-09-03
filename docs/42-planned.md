# 42 — Alles geplant (Stand Code `10.60.0`)

Eine Liste, die **zum Code und zu den offenen Resten passt**.

**Live:** App-Code **`10.60.0`**. Sideload **`10.60.0`**. Vor Neuinstall Hausstand exportieren (Export ist CODE, Keys sonst weg).

Hirn = Handy. PC = Werkzeug. **Gemini Hauptweg** (Key). Groq Backup. 0,5B **reiner letzter Fallback**. Parser wählen Tools.

## Pull-Reihenfolge

1. **PO Handy** Sprint [`178`](./sprints/sprint-178.md) — Katalog 168 + Home-FGS 30 s
2. **OEM-Akku** [`183`](./sprints/sprint-183.md) — nur wenn 178 rot
3. **`9.9.3`** [`186`](./sprints/sprint-186.md) — nur wenn 168 rot
4. **Could-ONNX** Freeze [`181`](./sprints/sprint-181.md) bis Messung; Smalltalk [`184`](./sprints/sprint-184.md) Could
5. Parking: Mail, Cloud-Kalender, Alexa, Play Store, iOS, NAS-Hirn
6. **`10.0` CODE** [`56-next.md`](./56-next.md) — Schema/Gate/Retrieve-2/Graph/Gold in `10.60.0`; Gerät 193 PO; 195 Freeze
7. **Memory-10 Intensiv** [`57-next.md`](./57-next.md) — Alias, G5-Echo, memoryBlock; Execute 196+

Industry-Track V1–V9, Latenz-Loop, Screenshot-Fixes, Rest-final Execute, Alltag-Router, Parser-Härte 179, FGS-Härte 180, Docs 182: **CODE**.

Bereits **CODE** in `9.10.0`: Debug-FGS (Tap/WakeLock/`resumeTimers`), Sehen-Freeze-Satz, Could-Schalter ohne Gewichte, Alltag-Parser-Härte. In `9.9.2`: Screenshot-Fixes. In `9.9.1`: Handy-Lage chat-first. In `9.9.0`: V9 Hardening.

---

## CODE auf diesem Stand (`10.60.0`)

| Schiene | Version | Was im Code ist |
|---------|---------|-----------------|
| Rest final | `9.10.0` | Debug-FGS (Härte 180), 3060-Freeze, Could-Schalter tot, Debug-P95, Alltag-Parser-Härte 179 |
| Weltlage | `4.0` | `outlook.ts` — Tagesschau/DW, Serie, Szenario, kein Orakel |
| Alltagskette | `4.19` | Bar-POI, SMS-Note, Taxi nach Ja, nie „bestellt“ |
| Stimme/Steuer | `4.33` | TTS Algieba, HUD-Interrupt, Watchdog opt-in |
| Hausstand | `4.46` | Export/Import JSON, `repairSpeech` / `pickHeard` |
| Friday + Tablet | `4.53` | Face Jarvis/Friday, Lage **neben** Chat |
| Körper | `4.66` | Lage-Sicht Körper, Canvas-Schema, Organ-Kachel, kein Tool-Start |
| Sehen-Parser | `4.76`–`4.97` | `ground-parse`, `/v1/ground` Client, zwei Confirms; **keine** 3B-Gewichte |
| Weltkugel | `5.0` / `6.20` | Lage-Sicht Kugel, Terminator, GIBS beim Zoom, Pins ISS/GPS/DWD/outlook-Lexikon |
| Debug-Lauf | `5.11` / `5.17` | Klickboxen, FGS „Jarvis testet…“, JSON+TXT mit Verdict + Latenz |
| Bühne & Hirn | `6.50` | Gemini zuerst, Motion 30 fps, Globus, HUD, Sprach-Orb |
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
| Davor | `3.19`–`3.0` / `1.x` | Kalender-Fenster, Register, Auge=Gemini, PC-Screenshot |

## Offen

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
Schema, Gate, Retrieve-2, Graph light, Gold G1–G6, Experience **CODE**. 195 e5 **FREEZE** (G2/G3 grün ohne Encoder). Gerät-Protokoll Sprint **193** PO. Sideload bleibt `9.10.0`. [`56-next.md`](./56-next.md).

Intensiv-Befund: [`57-next.md`](./57-next.md) **PLAN** (Sprints 196–201). G5 live Echo, Alias zu breit, memoryBlock ohne Memory-Hits.

Nächste Schiene Gerät: [`55-next.md`](./55-next.md) (178) plus Memory-Gerät 193.
