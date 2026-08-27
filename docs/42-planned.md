# 42 — Alles geplant (Stand Code `4.53.0`)

Eine Liste, die **zum Code und zu den offenen Plänen passt**. Kein Execute in diesem Dokument.

**Live:** App-Code **`4.53.0`**. Sideload **`3.18.1`**. Nächster Sideload erst nach Hausstand-Export (Export ist CODE, APK noch alt).

Hirn = Handy. PC = Werkzeug. 0,5B wählt keine Tools. Gemini Opt-in.

## Pull-Reihenfolge

1. Sideload mit Hausstand (Export ist CODE `4.46`, APK noch `3.18.1`)
2. Debug-Lauf `5.11` (PLAN) — Live-Spuren schickbar, baut auf Debug `3.19`
3. Körper intern `4.66` (PLAN, Darstellung)
4. Weltkugel `5.0` (PLAN, PR #58, Lage-Sicht)
5. Lokales Sehen `4.76` (PLAN, LocateAnything am PC) — nach `4.77` GO
6. Parking: Mail, Cloud-Kalender, Alexa, Play Store, iOS, NAS-Hirn

---

## CODE auf main (`4.53.0`)

| Schiene | Version | Was im Code ist |
|---------|---------|-----------------|
| Weltlage | `4.0` | `outlook.ts` — Tagesschau/DW, Serie, Szenario, kein Orakel |
| Alltagskette | `4.19` | Bar-POI, SMS-Note, Taxi nach Ja, nie „bestellt“ |
| Stimme/Steuer | `4.33` | TTS Algieba, HUD-Interrupt, Watchdog opt-in |
| Hausstand | `4.46` | Export/Import JSON, `repairSpeech` / `pickHeard` |
| Friday + Tablet | `4.53` | Face Jarvis/Friday, Lage **neben** Chat |
| Davor | `3.19`–`3.0` / `1.x` | Kalender-Fenster, Register, Auge=Gemini, PC-Screenshot |

## PLAN

### Körper `4.66`–`4.75` · Sprint 115 · [`40-next.md`](./40-next.md)

3D-Schema in der APK, Organe anklicken = Kachel, kein Tool. PC nur PC-Auge/PC-Hand-Zustand.

### Lokales Sehen `4.76`–`4.99` · Sprints 116–118 · [`41-next.md`](./41-next.md)

NVIDIA LocateAnything-3B am PC. Erst Spike 3060. Dann Klick mit Box, Overlay, Beleg, TV-Foto, Schreibtisch, EAN.

Konflikt vermeiden: **`4.66` = Körper, `4.76` = LocateAnything.**

### Weltkugel `5.0`–`5.10` · Sprint 119 · PR [#58](https://github.com/Gamerio2904/Jarvis/pull/58)

3D-Erde in der Lage. Nummern nicht für Debug verwenden.

### Debug-Lauf `5.11`–`5.18` · Sprint 120 · [`44-next.md`](./44-next.md)

Settings-Debug aus `3.19` erweitern: Klickboxen, neues Gespräch, Prompts inkl. Welt/Face, JSON-Export mit Soll/Ist. Kein Auto-Ja.

Konflikt vermeiden: **`5.11` = Debug, `5.0` = Kugel.**

## Won’t (übergreifend)

Play Store, iOS, Alexa, Cloud-Kalender-OAuth, Jarvis-Cloud, Marvel-Friday, Aktien-Orakel, Fake-Anruf, 3B-VLM im Handy, Computer-Use-Schleife, Debug-Cloud, Auto-Ja im Prompt-Lauf.
