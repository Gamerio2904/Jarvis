# Sprint 178 — PO Handy: Katalog + Home-FGS (`9.10.0`) **PLAN**

> ⚠︎ **Anker veraltet.** Dieser Sprint ist sachlich offen, nennt aber Sideload
> `9.10.0`. Der Code steht bei **`17.0.0`**. Vor dem Ziehen neu verankern:
> [`TEST-17.0.0.md`](../TEST-17.0.0.md), nicht die APK aus `9.x`.

| Feld | Wert |
|------|------|
| Status | **PLAN** |
| Ziel-Version | Sideload **`9.10.0`** (kein Bump, außer 168 rot → `9.9.3` / Sprint 186) |
| Quelle | [`55-next.md`](../55-next.md) · Katalog [`sprint-168.md`](./sprint-168.md) · FGS [`sprint-170.md`](./sprint-170.md) |
| Vorher | 168 KATALOG. 170/180 FGS CODE. Parser-Suiten grün |

## Ziel

Auf **einem** physischen Gerät belegen, was der Parser nicht belegen kann: Probe V1–V9, Screenshot-Bugs, Debug-Lauf überlebt Home 30 s, App schließen beendet ihn.

## Must

| ID | Inhalt |
|----|--------|
| P1 | Hausstand exportieren, Sideload `9.10.0` über `9.9.2` |
| P2 | Katalog 168 A–H: GPS, Mic, TTS, TV, Wake — Häkchen oder schriftlich rot |
| P3 | Debug starten, Home, 30 s, zurück: Lauf lebt, Meldung „Jarvis testet…“ |
| P4 | Notify-Tap öffnet die App, **nicht** den Sprachmodus |
| P5 | App schließen / Stop: Lauf tot |
| P6 | Kein Erfolgssatz in Chat/Docs ohne diese Zeilen |

## Won’t

Remote-PO. Emulator als Ersatz für Mic/GPS/TV. Auto-Ja. Zweiter permanenter FGS.

## DoD

- [ ] Gerät-Protokoll (welche Zeile grün/rot)
- [ ] Wenn rot: Sprint **186** / `9.9.3`, sonst kein Patch-Bump
