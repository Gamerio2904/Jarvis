# 42 — Alles geplant (Stand Code `6.96.0`)

Eine Liste, die **zum Code und zu den offenen Resten passt**.

**Live:** App-Code **`6.96.0`**. Sideload **`6.90.0`**. Vor Neuinstall Hausstand exportieren (Export ist CODE, Keys sonst weg).

Hirn = Handy. PC = Werkzeug. **Gemini Hauptweg** (Key). Groq Backup. 0,5B **reiner letzter Fallback**. Parser wählen Tools.

## Pull-Reihenfolge

1. LocateAnything-Sidecar nach `4.77` GO (Parser schon CODE, Vision ehrlich aus)
2. **Stabilität Industry-Track** [`51-phase0-audit.md`](./51-phase0-audit.md) V1 `6.91`–`6.93` **CODE**, V2 `6.94`–`6.96` **CODE** — vor Recall und Alltag-Execute
3. Debug-Hintergrund `5.12` — PLAN (Lauf v1 ist CODE `5.11`, Session `6.91`)
4. V3 Verified Actions [`51-phase0-audit.md`](./51-phase0-audit.md) `6.97`+ — Action-FSM
5. Alltag vom Zettel [`50-next.md`](./50-next.md) `8.0` **PLAN** — unabhängig von Recall und 3060, **nach V1**
6. Agentic Recall nach Stabilität — [`49-next.md`](./49-next.md) **PLAN** (`7.0`, Sprints 137+)
7. Parking: Mail, Cloud-Kalender, Alexa, Play Store, iOS, NAS-Hirn

Bereits **CODE** in `6.96.0`: V2 TTS-Primary, App-Actions, Banner/Chips/Wake. V1 Overlay-FSM, Weltlage ≠ Wecker, Gemini-Retry. In `6.91`: Turn-Gate, Debug-Session. In `6.90`: Globus-Briefing, Sideload `6.90`.

---

## CODE auf diesem Stand (`6.96.0`)

| Schiene | Version | Was im Code ist |
|---------|---------|-----------------|
| Weltlage | `4.0` | `outlook.ts` — Tagesschau/DW, Serie, Szenario, kein Orakel |
| Alltagskette | `4.19` | Bar-POI, SMS-Note, Taxi nach Ja, nie „bestellt“ |
| Stimme/Steuer | `4.33` | TTS Algieba, HUD-Interrupt, Watchdog opt-in |
| Hausstand | `4.46` | Export/Import JSON, `repairSpeech` / `pickHeard` |
| Friday + Tablet | `4.53` | Face Jarvis/Friday, Lage **neben** Chat |
| Körper | `4.66` | Lage-Sicht Körper, Canvas-Schema, Organ-Kachel, kein Tool-Start |
| Sehen-Parser | `4.76`–`4.97` | `ground-parse`, `/v1/ground` Client, zwei Confirms; **keine** 3B-Gewichte |
| Weltkugel | `5.0` / `6.20` | Lage-Sicht Kugel, Terminator, GIBS beim Zoom, Pins ISS/GPS/DWD/outlook-Lexikon |
| Debug-Lauf | `5.11` | Klickboxen, neues Gespräch, JSON+TXT mit Verdict |
| Bühne & Hirn | `6.50` | Gemini zuerst, Motion 30 fps, Globus, HUD, Sprach-Orb |
| Parser | `6.51` | Wont/Help/HUD-Skip nach Prompt-Test |
| Split / Overlay / APK | `6.60` | Live-Split, Identität canned, Overlay Gemini zuerst, `releases/Jarvis.apk` |
| Globus-Briefing | `6.90` | Fly-to 4.4, Stadt-Briefing, Welt-Tour Glow, Debug-Gruppe |
| Stabilität V1 | `6.91`–`6.93` | Turn-Gate, Debug-Session, Overlay-FSM, Weltlage ≠ Wecker, Gemini-Retry, `ja bitte` |
| Voice & App V2 | `6.94`–`6.96` | TTS-Primary Standing, App-Actions, Banner einmal, Wake-Final |
| Davor | `3.19`–`3.0` / `1.x` | Kalender-Fenster, Register, Auge=Gemini, PC-Screenshot |

## Offen

### LocateAnything Sidecar (`4.77`)
Parser CODE. Gewichte erst nach 3060-GO. Ohne Sidecar: ehrlich aus.

### Debug-Hintergrund (`5.12`)
Lauf in der App ist CODE. Dienst im Hintergrund PLAN.

### Alltag vom Zettel (`8.0`) · Sprint 141 · [`50-next.md`](./50-next.md)
Alte Notizen: Blitzer+Baustelle, **Stimme `8.20`**, GUI-Härte, **Lage** `8.32`, **Netz** `8.33`, **Test-Tore** nach Bündeln, Settings `8.35`, Amazon/Ordner/Preis. Nach Recall: **Dauer-Zuhören `8.95`**. Nicht mit Recall-Nummern mischen.

### Parking
Mail, Cloud-Kalender, Alexa, Play Store, iOS, NAS-Hirn, Welt-Geocoder, Live-Sat, Geheim-Nachrichten-Feed.
