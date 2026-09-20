# 78 — Listen-Leiste, Selbststeuerung, flexibler Befehl **CODE** (`18.7.0`)

PO 2026-09-20: Watchliste und Lieblinge sollen **unten in der Leiste**
liegen und per Hand **und** Befehl aufgehen. Jarvis soll **sich selbst**
steuern (Einstellungen, Overlays, Dock). Der Agent, der unklare Befehle
aufnimmt, soll flexibler werden — auch Sätze, die so nicht eingebaut
sind, ehrlich weiterführen statt ins Plaudern zu fallen.

Nachzug dieselbe Runde: die Leiste bekommt **ein 6. Dock-Icon** (nicht
Chips). Die Ladeanimation aus
[Reel DdgPH-poGbJ](https://www.instagram.com/reel/DdgPH-poGbJ/?stkn=MWJyc3FvcWhoeDBo)
kommt, wenn Jarvis antwortet — Chat **und** Sprachmodus.

**Ist:** App-Code **`18.7.0`**. Sideload **`18.4.4`**
(versionCode `180404`) — 18.7 steckt noch nicht in der APK. Sechs
Dock-Slots, Folie per Hand und Befehl, Allowlist-Writes mit „Soll ich?“,
Propose-Unknown, Thinking-Orbs im Chat und im Sprachmodus.

**Dieses Dokument ist CODE** in App `18.7.0`. Execute: Sprints
**315–322 CODE**. `18.5` (Stimme/TV) bleibt PLAN daneben. **Nicht
parallel** — beide treffen `App.tsx`, `app-parse.ts`, `director.ts`.

---

## 0. Leitentscheidung

| Thema | Entscheidung |
|-------|----------------|
| Leiste | **Ein 6. Dock-Icon** `Filme` zwischen Kalender und Mehr. PO überschreibt Material 3–5. Kein 7. Icon, keine Chips darüber. |
| Listen | Ein Overlay, Tabs Watchliste / Lieblinge. Icon öffnet die Folie; Befehl setzt den Tab. Hand und Befehl dieselbe FSM. |
| Selbststeuerung | **Eigene Flächen** als Tools: Overlay, Settings-Tab, Dock, Lage-Sicht. Kein Computer-Use, kein Fake-Klick. |
| Settings schreiben | Allowlist + „Soll ich?“ bei Writes. Android-Systemschalter bleiben Won’t (`device.ts`). |
| Unklare Befehle | Parser zuerst. Vorschlag nur wenn `looksCommandish`. Ausgeführt wird der **deutsche Satz**, nie JSON. Unbekannt: ehrliche Absage + 3 Nachbarn, kein Smalltalk-Fake. |
| Antwort-Laden | **Thinking Orbs** (MIT, Canvas 2D) wenn Jarvis antwortet. Chat ersetzt `.typing`. Sprachmodus `thinking` trägt denselben Orb. Kein Reel-Video, kein Lottie, kein WebGL. |
| Hirn | Groq-JSON nur für den Vertrag. Kein LLM-Organizer, e5 nicht in `pickRoute`, kein Mem0/Qdrant. |

Jarvis steuert **Jarvis**. Nicht das Betriebssystem, nicht fremde Apps.

---

## 1. Ist (Code)

### 1.1 Leiste und Overlay

`App.tsx` `dockItems`: fünf Slots. `goDock` kennt `chat`, `lage`,
`voice`, `calendar`, `settings`. `watchlist` ist Overlay-Id in
`overlay-fsm.ts` und öffnet nur über `handleWatchlist` → `action: open`
oder intern. Kein Dock-Treffer. Kalender und Mehr gehen per Hand;
Watchliste nicht.

`WatchlistOverlay` hat schon Tabs Watchliste / Lieblinge. Befehle `show`
setzen `focus`. Fehlt: sichtbare Fläche in der unteren Chrome.

`NavIsland` + `useSlidingThumb` nehmen die Item-Liste dynamisch — sechs
Slots brauchen kein neues Thumb-API, nur schmalere Labels.

### 1.2 Selbststeuerung heute

| Fläche | Hand | Befehl | Lücke |
|--------|------|--------|-------|
| Einstellungen + Tab | Mehr-Dock | `Öffne Einstellungen [Thema]` (`app`) | Schließen, Tab wechseln, Werte setzen |
| Sprachmodus | Hören-Dock | `Sprachmodus` | — |
| Kalender | Kalender-Dock | Kalender-Parser | — |
| Watchliste | **nein** | `Öffne Watchliste` | 6. Icon |
| Lage / Kugel / Körper | Lage-Dock | `hud` | Dock und Befehl nicht ein Katalog |
| Debug / Gedächtnis | Settings-Deep-Link | `app` | — |
| Android WLAN/BT | — | `device` öffnet **System**-Seite, legt nicht um | bleibt |

`device.ts`: „Den Schalter lege ich nicht selbst um.“ Das gilt fürs
**System**. Jarvis-eigene Felder (`hud_accent`, `tv_enabled`,
`tool_propose`, …) darf er umlegen, wenn der Parser es sagt und Writes
bestätigt sind.

### 1.3 Der Aufnahme-Agent

`director.ts` `rescueByProposal`: läuft nur wenn **kein** Parser traf
und `looksCommandish`. Vier Schranken (`tool-propose.ts`,
`tool-contract.ts`): Schema → deutscher Satz → Parser bestätigt denselben
Agenten → Write wartet auf „ja“.

Vertrag heute: `set_timer`, `set_alarm`, `create_reminder`,
`create_calendar_event`, `add_shopping_item`, `switch_tv`.

`looksCommandish` `DOMAIN` ist
`timer|wecker|erinner|termin|kalender|einkauf|liste|notiz|todo|fernseher|tv`.
**Watchliste, Overlay, Einstellungen, Lage, Schicht fehlen.** `COMMAND`
kennt `stell|setz|mach|…`, aber **nicht** `öffne|zeig|schließ|wechsel`.
„Öffne irgendwas mit der Watchliste“ zahlt also keinen Vorschlag — auch
wenn die DOMAIN später wächst — und fällt ins gestreamte Modell, das
dann so tut, als hätte es etwas getan.

Das ist die Lücke „Befehle, die so nicht eingebaut sind“.

### 1.4 Antwort-Laden heute

Chat (`App.tsx`): `streamingText === ''` → drei Punkte `.typing`. Avatar
pulst (`avatarPulse`). Composer `is-busy`.

Sprachmodus (`VoiceMode.tsx`): Phase `thinking` setzt nur
`.voice-orb.thinking { background: #127a38 }`. Ringe drehen immer.
Label „Antwort kommt…“. Kein eigener Loader.

---

## 2. Forschung (Internet)

Geprüft 2026-09-20, Reel nachgezogen 2026-09-20.

| Quelle | Kern | Für Jarvis | Nicht |
|--------|------|------------|-------|
| [Deterministic tool routing](https://how2.sh/posts/how-to-add-deterministic-tool-routing-to-ai-agents/) | Regeln zuerst, LLM nur bei Uneindeutigkeit; ohne Route nachfragen | Parser → Propose → Absage | LLM wählt das Tool endgültig |
| [Why not everything through the LLM](https://dev.to/ventailabs/why-does-everything-in-an-agent-go-through-the-llm-3k1a) | Handler: `handled` / `rejected` / `unknown`; unknown eskaliert | Dritter Ausgang `unknown` statt Smalltalk | Pflicht-Klassifikator vor jedem Zug |
| [Tool-call gatekeeper](https://dev.to/hackrs_3352/a-reproducible-tool-call-gatekeeper-for-ai-agents-3icm) | Deny/Allow deterministisch, LLM nur Long-Tail; malformed = escalate | `none` / kaputtes JSON = Absage, nicht raten | Fail-open |
| [jwalin-shah/personal-assistant](https://github.com/jwalin-shah/personal-assistant) | regex → Heuristik → Parser → LLM-Fallback | Entspricht Propose-Pfad | Plugin-Shell |
| [self-healing-router](https://github.com/jhammant/self-healing-router) | Graph/Dijkstra statt ReAct-pro-Schritt | Retry bleibt im Modul (`applyRetry`) | Neue Graph-Lib, LLM-Replan |
| [Material 3 Nav bar](https://m3.material.io/components/navigation-bar/guidelines) | **3–5** Ziele; >5 = Drawer. [M3 Expressive 2025](https://m3.material.io/components/navigation-bar) bleibt bei 3–5 | Labels enger setzen, Mehr bleibt letzter Slot | 7. Icon, Drawer statt Dock (PO will 6) |
| [ORB](https://github.com/settylokesh/ORB) / [Sai](https://github.com/GodlyDonuts/sai) / [OpenComputer](https://github.com/andykr1k/OpenComputer) | Screenshot, Klick, Hotkey | Muster: eigene Flächen als Tools, Confirm | Computer-Use, Vision-Klick — bei uns Won’t / Freeze |
| Reel [DdgPH-poGbJ](https://www.instagram.com/reel/DdgPH-poGbJ/?stkn=MWJyc3FvcWhoeDBo) (@adilet.fndr, 20.9.2026) | „These orb animations are everywhere — somebody just open-sourced them. Thinking Orbs: nine dotted orbs…“ | Zustände und Canvas-2D-Muster | Reel-Video einbetten, Lottie-Kopie |
| [Jakubantalik/thinking-orbs](https://github.com/Jakubantalik/thinking-orbs) MIT · [npm](https://www.npmjs.com/package/thinking-orbs) · [Demo](https://orbs.jakubantalik.com) | 9 Zustände, Size 64/20, Canvas 2D, kein WebGL, `prefers-reduced-motion` = Standbild, eine Clock, offscreen pause. Theme nur mono | Chat + Voice-Antwort | Framer, Lottie, GSAP, `globe.gl` |

**Urteil:** Der Aufnahme-Agent bleibt Parser → Propose → Absage. Die
Leiste bekommt das **6. Icon**, weil der PO das so will — Material bleibt
Hinweis für Label-Enge, nicht Veto. Die Ladeanimation ist **Thinking
Orbs**, nicht drei Punkte und nicht das Instagram-Video.

---

## 3. Lieferbild

### 3.1 Listen in der unteren Chrome (Must)

Sechs Dock-Slots, nur wenn kein Drive/Schach:

`Chat · Lage · Hören · Kalender · Filme · Mehr`

| Icon | Hand | Befehl |
|------|------|--------|
| Filme | `goDock('watchlist')` → Overlay, Fokus zuletzt oder `watch` | `Öffne Watchliste` → Tab Watchliste; `Öffne Lieblinge` → Tab Lieblinge |

Aktiv-Thumb auf Filme, solange die Folie oben ist. Zweiter Tap auf Filme
schließt (wie Chat die Folien räumt). `Fertig` und Dock-Chat schließen
ebenfalls. Tabs in der Folie bleiben die Umschaltung Watchliste /
Lieblinge — **kein** 7. Icon.

Label **Filme** (kurz). Icon: Filmstreifen in `NavIsland.tsx`, gleicher
Strich wie die anderen. Schrift `.nav-island-label` bei sechs Slots
engführen (`0.55rem` oder zwei Zeilen), Thumb folgt `data-nav`.

### 3.2 Selbststeuerung (Must)

Neuer Schnitt `ui-action` **im** Agent `app` (kein zweiter Organizer):

| Id | Satz | Wirkung |
|----|------|---------|
| `overlay.open` | `Öffne Einstellungen / Kalender / Watchliste / Debug` | `reduceOverlay({type:'open'})` |
| `overlay.close` | `Einstellungen zu`, `Overlay zu`, `Fertig` | `close` der obersten Folie |
| `settings.tab` | `Einstellungen Musik` | Tab, schon teils da |
| `settings.set` | `Gemini aus`, `Research an` | Allowlist, dann „Soll ich?“ |
| `dock.go` | `Zeig Chat`, `Zurück zum Chat`, `Zeig Filme` | `goDock` |
| `lage.view` | bleibt `hud` | nicht doppelt bauen |

Allowlist Writes (Start, erweiterbar): `tv_enabled`, `research_opt_in`,
`tool_propose`, `hud_accent`, `drive_speak`, `globe_webgl`,
`gemini_enabled`. Keys, Tokens, MAC, Hausstand-Import: **nie** per Satz.
`research_enabled` gibt es nicht — der Schalter heißt `research_opt_in`.

### 3.3 Flexibler Befehl (Must)

1. `DOMAIN` um `watchliste|liebling|overlay|folie|einstellungen|settings|lage|kugel|schicht|debug`.
2. `COMMAND` um `öffne|zeig|schließ|wechsel|blende`. Sonst trifft
   „Öffne …“ den Vorschlagsweg nie.
3. Verträge dazu: `open_watchlist`, `open_favorites`, `open_settings`,
   `close_overlay`, `set_jarvis_flag` (state + title aus Allowlist).
4. Trifft weder Parser noch bestätigter Vorschlag, aber
   `looksCommandish`: **eine** Zeile Absage + bis zu drei Sätze aus dem
   Katalog, die der Router **jetzt** kann. Kein „habe ich gemacht“.
5. `none` / Timeout / Quota: dieselbe Absage, kein zweiter Modellaufruf.

Should: Synonyme in `utterance.ts` (`settings` → Einstellungen,
`favorites` → Lieblinge). Kein Embeddings-Router.

### 3.4 Antwort-Orb (Must)

Reel-Quelle ist Thinking Orbs. Jarvis nimmt die **MIT-Bibliothek**, nicht
das Video.

| Fläche | Wann | State | Size |
|--------|------|-------|------|
| Chat-Blase | `busy` und noch kein Stream-Text | `composing` (Antwort) | 64 |
| Chat-Blase | Research läuft, noch kein Text | `searching` | 64 |
| Chat-Blase | Werkzeug / Propose wartet | `solving` | 64 |
| Chat-Blase | erster Token da | Orb **weg**, Caret bleibt | — |
| Sprachmodus | Phase `thinking` | `composing` (Research → `searching`) | 64, im Orb-Schacht |
| Sprachmodus | `listening` / `speaking` | bestehender CSS-Orb | — |

Eine Komponente `ui/ReplyOrb.tsx`: Wrapper um `ThinkingOrb`,
`theme` aus `ui_theme` (`dark`/`light`, system auflösen),
`aria-label` deutsch („Jarvis antwortet“ / „Jarvis sucht“).
`prefers-reduced-motion` nutzt das Standbild der Lib. `document.hidden`
und Offscreen pausieren von allein.

Paket: `thinking-orbs` (MIT, Canvas 2D, keine Runtime-Deps außer React).
Keine zweite Motion-Lib. Kein WebGL. Kein Grün-Fork — Theme bleibt
monochrom wie im Reel; Akzent bleibt am Avatar / am Voice-Ring.

---

## 4. Sätze (Gold)

```
Öffne die Watchliste
Öffne Lieblinge
```

Dock-Tap Filme → Folie. `Öffne Lieblinge` → Tab Lieblinge, Thumb auf Filme.

```
Einstellungen zu
Öffne Einstellungen Musik
Research an
```

Folie zu. Tab Musik. „Verstanden als Research an. Soll ich?“ — nach Ja
steht der Schalter.

```
Mach das Overlay für die Filme auf
Stell irgendwas mit der Watchliste an
```

Erster Satz: Propose → `Öffne Watchliste`. Zweiter: Absage, keine
Erfindung, Vorschlag „Öffne Watchliste / Öffne Lieblinge“.

```
Mach WLAN aus
Klick auf Speichern
```

Won’t wie heute (`device` / `wont`). Kein Selbst-Klick.

Antwort-Orb: Satz senden → Orb in der Blase, bis Text kommt. Sprachmodus
nach dem Hören → Orb statt nur grünem Kreis, bis gesprochen wird.

---

## 5. Won’t in `18.7`

- Chips über dem Dock. 7. Dock-Icon. Drawer-Ersatz fürs ganze Dock.
- Computer-Use, Screenshot-Klick, LocateAnything-Handy (Freeze).
- Android-Systemschalter umlegen.
- Keys/Tokens/MAC per Satz schreiben.
- LLM führt JSON aus oder spielt Organizer.
- e5 / Mem0 / Qdrant / Graphiti in `pickRoute`.
- ReAct-Schleife pro Overlay-Tap.
- Framer Motion, Lottie, GSAP, Reel-MP4, `globe.gl`.
- Alle neun Orb-Zustände sichtbar umschalten — nur die drei Antwort-Fälle.
- Sideload in diesem PLAN versprechen — APK erst mit Execute + SDK.

---

## 6. Probe (nach 321)

```
Leiste: Chat Lage Hören Kalender Filme Mehr.
Tap Filme → Folie Watchliste. Öffne Lieblinge → Tab Lieblinge, Thumb Filme.
Öffne das watchlist overlay → Folie, nicht Fahrmodus.
Einstellungen zu → Folie weg.
Research an → Nachfrage, nach Ja Schalter.
Mach das Film-Overlay auf → Watchliste oder ehrliche Nachfrage.
Klick Speichern / WLAN aus → Won’t.
Lage auf → Kugel wie 18.6, keine Schicht von allein.
Chat-Satz → gepunkteter Orb, bis Text da ist. Dann Caret, kein Orb.
Sprachmodus nach dem Hören → derselbe Orb, bis Jarvis spricht.
Reduce-Motion: Orb steht still.
```
