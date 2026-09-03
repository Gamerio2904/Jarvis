# 42 — Alles geplant (Stand Code `9.10.0`)

Eine Liste, die **zum Code und zu den offenen Resten passt**.

**Live:** App-Code **`9.10.0`**. Sideload **`9.10.0`**. Vor Neuinstall Hausstand exportieren (Export ist CODE, Keys sonst weg).

Hirn = Handy. PC = Werkzeug. **Gemini Hauptweg** (Key). Groq Backup. 0,5B **reiner letzter Fallback**. Parser wählen Tools.

## Pull-Reihenfolge

1. **Geräte-Katalog** Sprint [`168`](./sprints/sprint-168.md) — Parser CODE, Gerät **PO**
2. **Debug-Hintergrund** `5.17` — FGS **CODE** (169 Spike GO, 170 Service)
3. **LocateAnything** — 171 **NO-GO**, 172 **Freeze CODE** (Parser CODE, Vision ehrlich aus)
4. **Qualität-Could** `9.10.0` — Leit CODE, ONNX **Freeze**, Gold 177 CODE
5. Parking: Mail, Cloud-Kalender, Alexa, Play Store, iOS, NAS-Hirn

Industry-Track V1–V9, Latenz-Loop (Prefix/Groq/SLO/Edge), Screenshot-Fixes, Rest-final Execute: **CODE**. Alltag [`50-next.md`](./50-next.md) unabhängig.

Bereits **CODE** in `9.10.0`: Debug-FGS, Sehen-Freeze-Satz, Could-Schalter ohne Gewichte. In `9.9.2`: Screenshot-Fixes. In `9.9.1`: Handy-Lage chat-first. In `9.9.0`: V9 Hardening.

---

## CODE auf diesem Stand (`9.10.0`)

| Schiene | Version | Was im Code ist |
|---------|---------|-----------------|
| Rest final | `9.10.0` | Debug-FGS, 3060-Freeze, Could-Schalter tot, Debug-P95 |
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
| TV V6 | `9.1` | Device-Registry, Verify Launch, kein SmartThings |
| PC V7 | `9.2` | Capability-Levels, Confirm, Verify Launch/Klick |
| Live V8 | `9.3` | `/v1/webrtc` Signaling, LAN-JPEG-Dock, WebRTC nur mit Peer |
| Hardening V9 | `9.9` | Regression-Katalog, LAN-only PC, Secret-Redact, Password-Felder |
| Davor | `3.19`–`3.0` / `1.x` | Kalender-Fenster, Register, Auge=Gemini, PC-Screenshot |

## Offen

### Geräte-Katalog (Sprint 168)
Parser CODE. **PO** auf dem Handy: Probe V1–V9 + Screenshot-Bugs.

### LocateAnything (`4.77`)
Parser CODE. Gewichte **Freeze**, bis eine RTX 3060 misst.

### Qualität-Could (Gewichte)
Schalter CODE. Silero/Piper/Kokoro/e5 **nicht** in der APK.

### Alltag vom Zettel (`8.0`) · Sprint 141 · [`50-next.md`](./50-next.md)
Eigene Schiene, nicht 54.

### Parking
Mail, Cloud-Kalender, Alexa, Play Store, iOS, NAS-Hirn, Welt-Geocoder, Live-Sat, Geheim-Nachrichten-Feed.
