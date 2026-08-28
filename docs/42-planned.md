# 42 — Alles geplant (Stand Code `5.11.0`)

Eine Liste, die **zum Code und zu den offenen Resten passt**.

**Live:** App-Code **`5.11.0`**. Sideload **`3.18.1`**. Nächster Sideload erst nach Hausstand-Export (Export ist CODE, APK noch alt).

Hirn = Handy. PC = Werkzeug. 0,5B wählt keine Tools. Gemini Opt-in.

## Pull-Reihenfolge

1. Sideload mit Hausstand (Export ist CODE `4.46`, APK noch `3.18.1`)
2. **Bühne & Hirn `6.0`** — PLAN [`45-next.md`](./45-next.md) (Motion, Lage-Show, CarPlay, Stimme, Gemini-Schliff)
3. Debug-Hintergrund `5.12` — PLAN (Lauf v1 ist CODE `5.11`)
4. LocateAnything-Sidecar nach `4.77` GO (Parser schon CODE, Vision ehrlich aus)
5. Parking: Mail, Cloud-Kalender, Alexa, Play Store, iOS, NAS-Hirn

---

## CODE auf diesem Stand (`5.11.0`)

| Schiene | Version | Was im Code ist |
|---------|---------|-----------------|
| Weltlage | `4.0` | `outlook.ts` — Tagesschau/DW, Serie, Szenario, kein Orakel |
| Alltagskette | `4.19` | Bar-POI, SMS-Note, Taxi nach Ja, nie „bestellt“ |
| Stimme/Steuer | `4.33` | TTS Algieba, HUD-Interrupt, Watchdog opt-in |
| Hausstand | `4.46` | Export/Import JSON, `repairSpeech` / `pickHeard` |
| Friday + Tablet | `4.53` | Face Jarvis/Friday, Lage **neben** Chat |
| Körper | `4.66` | Lage-Sicht Körper, Canvas-Schema, Organ-Kachel, kein Tool-Start |
| Sehen-Parser | `4.76`–`4.97` | `ground-parse`, `/v1/ground` Client, zwei Confirms; **keine** 3B-Gewichte |
| Weltkugel | `5.0` | Lage-Sicht Kugel, Terminator, Pins ISS/GPS/DWD/outlook-Lexikon |
| Debug-Lauf | `5.11` | Klickboxen, neues Gespräch, JSON+TXT mit Verdict |
| Davor | `3.19`–`3.0` / `1.x` | Kalender-Fenster, Register, Auge=Gemini, PC-Screenshot |

## Offen

### LocateAnything Sidecar (`4.77`)

RTX 3060 GO/NO-GO. JarvisSee localhost. Ohne Sidecar: ehrlicher Satz, keine Fake-Boxen.

### GIBS (`5.9`)

Satellitenfoto mit Zeitstempel, Default aus.

### Debug-Hintergrund (`5.12` Service)

v1: App offen lassen. Foreground-Service nach Spike.

### Bühne & Hirn (`6.0`)

Motion-Kern, Körper/Kugel-Show, Fahrmodus-HUD, Sprach-Theater, Gemini-Schliff. 0,5B wird nicht Claude. Plan [`45-next.md`](./45-next.md).

## Won’t (übergreifend)

Play Store, iOS, Alexa, Cloud-Kalender-OAuth, Jarvis-Cloud, Marvel-Friday, Aktien-Orakel, Fake-Anruf, 3B-VLM im Handy, Computer-Use-Schleife, Debug-Cloud, Auto-Ja im Prompt-Lauf, Live-Satellitenvideo, Überwachung.
