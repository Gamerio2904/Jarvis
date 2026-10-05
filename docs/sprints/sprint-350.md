# Sprint 350 — Caption-Entwurf und Rechte-Ja

**Version:** `18.13.0` — **PLAN** Must
**Plan:** [`84-next.md`](../84-next.md)
**Voraussetzung:** 349.

## Ziel

Jarvis schlägt eine Beschreibung vor. Der Nutzer ändert und sagt Ja.
Rechte bleiben Nutzerbehauptung.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S350-1 | Entwurf | Gemini (Frames/Audio) | JSON `{caption, sure}`; keine erfundenen Songs, Handles, Folgen |
| S350-2 | Edit | Chat | Nutzersatz überschreibt den Entwurf |
| S350-3 | Confirm | pending `clip`+`caption` | ohne Ja kein Publish-Schritt |
| S350-4 | Rechte | Settings + einmalige Frage | „Sie sagen, die Clips dürfen so raus. Stimmt das?“ Timestamp, kein „ist legal“ |
| S350-5 | Ziel | Settings | Default Instagram; „beides“ merken, TikTok-Sendung erst 352 |
| S350-6 | Test | Pack caption | Gold=TEST_PROMPTS; Nutella/Carbonara/S6 bleiben food/search/hud |

## Won’t

Stilles Übernehmen der Gemini-Zeile. Handle raten. Lizenztext
erfinden. Instagram-Call in diesem Sprint.

## Abbruchkriterium

Eine Caption geht ohne Ja weiter. Oder Jarvis behauptet, die Rechte
geprüft zu haben.
