# Sprint 318 — Selbststeuerung der Flächen

**Version:** `18.7.3` — **PLAN** Must
**Plan:** [`78-next.md`](../78-next.md)
**Voraussetzung:** Sprint **315**. Overlay-Close aus 317 darf mitlaufen.

## Ziel

Jarvis öffnet, wechselt und schließt **eigene** Flächen per Satz:
Einstellungen (+ Tab), Watchliste, Debug, Dock, Sprachmodus. Kein
Fake-Klick auf Buttons.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S318-1 | Open | `app-parse.ts` `app.ts` `App.tsx` | `Öffne Einstellungen [Thema]` bleibt. Neu verdrahten über `ui.overlay.open` + bestehendes `openSettings(topic)`. `Öffne Debug` / `Öffne Gedächtnis` schon da — gleicher Schnitt |
| S318-2 | Dock | `app-parse.ts` `App.tsx` | `Zeig Chat`, `Zurück zum Chat`, `Zeig Lage`, `Sprachmodus` → `dock.go` ruft `goDock`. Kein zweites `setLageSession` neben `goDock` |
| S318-3 | Tab | `app-parse.ts` `settings-ia.ts` | `Einstellungen Musik` / `Einstellungen Forschung` = `settings.tab`. `TOPIC_WORD` unverändert nutzen. Kein Write |
| S318-4 | Synonyme | `utterance.ts` | `settings` → Einstellungen, `favorites` → Lieblinge (watchlist→Watchliste ist da). Kein Embeddings-Router |
| S318-5 | Test | `test-app-ui.mjs` o. ä. | Open/Close/Dock-Sätze. `Mach WLAN aus` bleibt leer (device/wont). `Klick auf Speichern` bleibt leer |

## Won’t

- Settings-Writes (319). Computer-Use. Android-Systemseite umlegen.
- `hud`-Schichten hier nachbauen.

## Abbruchkriterium

Ein Satz klickt ein DOM-Element. Oder `Zeig Lage` öffnet eine Schicht.
Oder Dock-Satz umgeht `goDock` und lässt die Chrome falsch stehen.

## Manuell

```
Öffne Einstellungen Musik
Zeig Chat
Einstellungen zu
Öffne Watchliste
```

Tab Musik sichtbar. Chat räumt die Folie. Watchliste über Dock-Filme
**oder** Satz dieselbe Folie.
