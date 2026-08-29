# Sprint 112 — Gespräch, Film-Stimme, Reel am Steuer **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Priorität | **MUST** |
| Ziel-Version | `4.33.0` (bündelt `4.34`–`4.44`, ohne Sideload) |
| Quelle | PO: realistisches Gespräch/Stimme, Reel lukebuildsai, Kalender-Screenshots |
| Voraussetzung | `3.19.0` auf `main`; Kalender/Voice-Thread nicht neu bauen |
| Plan | [`37-next.md`](../37-next.md) |

## Code

- TTS: stehend Budget 3,5 s, Native-Race aus. Fahrt Race 400 ms / Budget 700 ms. Stimme **Algieba** (eine, kein Karussell). Navi bleibt Native.
- Am Steuer: HUD-Zeile + Notify + Ja/Nein. Kein Fake-Incoming-Call. Zweite Nummer nur Opt-in und ≠ dieses Gerät.
- Watchdog (Default aus): Steckdose tot, Termin-Kollision. Timer klingeln schon. Outlook-Watch bleibt `4.9`.
- Kalender-Fenster und Voice-Thread: nicht angefasst (`3.19`).

Kein neuer Sideload. Backup vor Sideload: [`38-next.md`](../38-next.md).

## Won’t

Retell, Twilio, Fake-Incoming-Call, Stimmklone, ElevenLabs, Play Store, iOS, Duzen, 0,5B als Film-Stimme, Allwissen-Finden.
