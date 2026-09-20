# Sprint 322 — Antwort-Orb (Thinking Orbs)

**Version:** `18.7.7` — **CODE** Must
**Plan:** [`78-next.md`](../78-next.md)
**Voraussetzung:** Sideload-Optik `18.4.4` / Code `18.6.0`. Darf neben
316–320 laufen. **321 zuletzt.**

## Ziel

Wenn Jarvis **antwortet**, sieht man die gepunktete Kugel aus dem Reel
[DdgPH-poGbJ](https://www.instagram.com/reel/DdgPH-poGbJ/?stkn=MWJyc3FvcWhoeDBo)
— im Chat und im Sprachmodus. Quelle ist die MIT-Lib
[thinking-orbs](https://github.com/Jakubantalik/thinking-orbs), nicht das
Video.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S322-1 | Dep | `frontend/package.json` | `thinking-orbs` (MIT). Kein Framer/Lottie/GSAP. Kein WebGL |
| S322-2 | Wrapper | `ui/ReplyOrb.tsx` **neu** | `<ThinkingOrb state size={64} theme={dark\|light} aria-label />`. Theme aus `ui_theme` (system auflösen). Deutsche Labels: „Jarvis antwortet“ / „Jarvis sucht“ / „Jarvis arbeitet“ |
| S322-3 | Chat | `App.tsx` | `.typing` (drei Punkte) **ersetzen**. `busy` + leerer Stream → Orb. Research-Pending → `searching`. Propose/Tool-Pending → `solving`. Sonst `composing`. Erster Token → Orb weg, Caret bleibt |
| S322-4 | Stimme | `VoiceMode.tsx` `index.css` | Phase `thinking`: Orb `size={64}` im Orb-Schacht statt nur `#127a38`. `listening` / `speaking` bleiben CSS-Orb. Reduce: Lib-Standbild |
| S322-5 | Pause | | Lib pausiert offscreen + `document.hidden`. Kein zweiter `rAF`. Idle ohne Busy: **kein** Orb, keine Extra-Clock |
| S322-6 | Copy | CHANGELOG | MIT-Hinweis Jakub Antalik / thinking-orbs. Reel nur als Vorbild, kein Clip |

## Won’t

- Reel-MP4, Lottie-Export, alle neun States als Spielerei.
- Orb während Idle, Listening oder nachdem Text streamt.
- Grün-Fork der Lib. `globe.gl`. Neue Motion-Lib außer diesem einen MIT-Paket.

## Abbruchkriterium

Drei Punkte bleiben der einzige Chat-Loader. Oder der Sprachmodus
`thinking` bleibt nur ein grüner Kreis. Oder ein Video/WebGL-Pfad
entsteht. Oder der Orb läuft auf der Idle-Kugel mit.

## Manuell

Chat: Satz senden → gepunkteter Orb in der Blase → Text kommt, Orb weg.
Sprachmodus: nach dem Hören Orb, bis Jarvis spricht. Reduce-Motion:
steht still.
