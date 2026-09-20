# 78 — Listen-Leiste, Selbststeuerung, flexibler Befehl **PLAN** (`18.7`)

PO 2026-09-20: Watchliste und Lieblinge sollen **unten in der Leiste**
liegen und per Hand **und** Befehl aufgehen. Jarvis soll **sich selbst**
steuern (Einstellungen, Overlays, Dock). Der Agent, der unklare Befehle
aufnimmt, soll flexibler werden — auch Sätze, die so nicht eingebaut
sind, ehrlich weiterführen statt ins Plaudern zu fallen.

**Ist:** App-Code **`18.6.0`** auf `main`. Sideload **`18.4.4`**
(versionCode `180404`) — 18.6 steckt noch nicht in der APK. Overlay-FSM
hat `watchlist`. Befehle `Öffne Watchliste` / `Öffne das watchlist
overlay` öffnen die Folie. In der Dock-Leiste fehlt sie. `app` öffnet
Einstellungen/Stimme/Akzent. `tool-propose` übersetzt nur Timer, Wecker,
Erinnerung, Termin, Einkauf, Fernseher.

**Dieses Dokument ist PLAN.** Execute: Sprints **315–321**. `18.5`
(Stimme/TV) bleibt PLAN daneben. **Nicht parallel** — beide treffen
`App.tsx`, `app-parse.ts`, `director.ts`.

---

## 0. Leitentscheidung

| Thema | Entscheidung |
|-------|----------------|
| Leiste | **Chips über dem Dock**, nicht ein 6. Dock-Icon. Material: 3–5 Ziele. Dock bleibt Chat / Lage / Hören / Kalender / Mehr. |
| Listen | Ein Overlay, zwei Chips: Watchliste und Lieblinge. Tab = Fokus. Hand und Befehl dieselbe FSM. |
| Selbststeuerung | **Eigene Flächen** als Tools: Overlay, Settings-Tab, Dock, Lage-Sicht. Kein Computer-Use, kein Fake-Klick. |
| Settings schreiben | Allowlist + „Soll ich?“ bei Writes. Android-Systemschalter bleiben Won’t (`device.ts`). |
| Unklare Befehle | Parser zuerst. Vorschlag nur wenn `looksCommandish`. Ausgeführt wird der **deutsche Satz**, nie JSON. Unbekannt: ehrliche Absage + 3 Nachbarn, kein Smalltalk-Fake. |
| Hirn | Groq-JSON nur für den Vertrag. Kein LLM-Organizer, e5 nicht in `pickRoute`, kein Mem0/Qdrant. |

Jarvis steuert **Jarvis**. Nicht das Betriebssystem, nicht fremde Apps.

---

## 1. Ist (Code)

### 1.1 Leiste und Overlay

`App.tsx` `dockItems`: fünf Slots. `goDock` kennt `chat`, `lage`,
`voice`, `calendar`, `settings`. `watchlist` ist Overlay-Id in
`overlay-fsm.ts` und öffnet nur über `handleWatchlist` → `action: open`
oder intern. Kein Chip, kein Dock-Treffer. Kalender und Mehr gehen per
Hand; Watchliste nicht.

`WatchlistOverlay` hat schon Tabs Watchliste / Lieblinge. Befehle `show`
setzen `focus`. Fehlt: sichtbare Fläche in der unteren Chrome.

### 1.2 Selbststeuerung heute

| Fläche | Hand | Befehl | Lücke |
|--------|------|--------|-------|
| Einstellungen + Tab | Mehr-Dock | `Öffne Einstellungen [Thema]` (`app`) | Schließen, Tab wechseln, Werte setzen |
| Sprachmodus | Hören-Dock | `Sprachmodus` | — |
| Kalender | Kalender-Dock | Kalender-Parser | — |
| Watchliste | **nein** | `Öffne Watchliste` | Chip |
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

---

## 2. Forschung (Internet)

Geprüft 2026-09-20. Was wir nehmen, was wir lassen.

| Quelle | Kern | Für Jarvis | Nicht |
|--------|------|------------|-------|
| [Deterministic tool routing](https://how2.sh/posts/how-to-add-deterministic-tool-routing-to-ai-agents/) | Regeln zuerst, LLM nur bei Uneindeutigkeit; ohne Route nachfragen | Parser → Propose → Absage | LLM wählt das Tool endgültig |
| [Why not everything through the LLM](https://dev.to/ventailabs/why-does-everything-in-an-agent-go-through-the-llm-3k1a) | Handler: `handled` / `rejected` / `unknown`; unknown eskaliert | Dritter Ausgang `unknown` statt Smalltalk | Pflicht-Klassifikator vor jedem Zug |
| [Tool-call gatekeeper](https://dev.to/hackrs_3352/a-reproducible-tool-call-gatekeeper-for-ai-agents-3icm) | Deny/Allow deterministisch, LLM nur Long-Tail; malformed = escalate | `none` / kaputtes JSON = Absage, nicht raten | Fail-open |
| [jwalin-shah/personal-assistant](https://github.com/jwalin-shah/personal-assistant) | regex → Heuristik → Parser → LLM-Fallback | Entspricht Propose-Pfad | Plugin-Shell |
| [self-healing-router](https://github.com/jhammant/self-healing-router) | Graph/Dijkstra statt ReAct-pro-Schritt | Retry bleibt im Modul (`applyRetry`) | Neue Graph-Lib, LLM-Replan |
| [Material 3 Nav bar](https://m3.material.io/components/navigation-bar/guidelines) | **3–5** Ziele; >5 = Drawer/Tabs, kein 6. Icon. [M3 Expressive 2025](https://m3.material.io/components/navigation-bar): flexible Bar kürzer, immer noch 3–5. [Android Nav-Muster](https://developer.android.com/design/ui/mobile/guides/layout-and-content/layout-and-nav-patterns): sekundär = Tabs/Chips, nicht 6. Icon | Chips über Dock, Dock bleibt 5 | 6./7. Dock-Slot |
| [ORB](https://github.com/settylokesh/ORB) / [Sai](https://github.com/GodlyDonuts/sai) / [OpenComputer](https://github.com/andykr1k/OpenComputer) | Screenshot, Klick, Hotkey | Muster: eigene Flächen als Tools, Confirm | Computer-Use, Vision-Klick — bei uns Won’t / Freeze |

**Urteil:** Der Aufnahme-Agent wird nicht durch ReAct oder Computer-Use
ersetzt. Er bekommt **mehr Verträge**, eine **weitere DOMAIN**, und
einen ehrlichen **unknown**-Ausgang. Die Leiste bekommt Chips, keine
sechste Ikone.

---

## 3. Lieferbild

### 3.1 Listen in der unteren Chrome (Must)

Zwei Chips **über** `.nav-dock`, nur wenn kein Drive/Schach:

| Chip | Hand | Befehl (schon da, härten) |
|------|------|---------------------------|
| Watchliste | `open` focus `watch` | `Öffne Watchliste`, `Öffne das watchlist overlay` |
| Lieblinge | `open` focus `favorite` | `Öffne Lieblingsfilme` |

Aktiv-Zustand wie Dock-Thumb. `Fertig` und Dock-Chat schließen beide.
Reduced-motion: kein Wischen-Zwang.

### 3.2 Selbststeuerung (Must)

Neuer Schnitt `ui-action` **im** Agent `app` (kein zweiter Organizer):

| Id | Satz | Wirkung |
|----|------|---------|
| `overlay.open` | `Öffne Einstellungen / Kalender / Watchliste / Debug` | `reduceOverlay({type:'open'})` |
| `overlay.close` | `Einstellungen zu`, `Overlay zu`, `Fertig` | `close` der obersten Folie |
| `settings.tab` | `Einstellungen Musik` | Tab, schon teils da |
| `settings.set` | `Gemini aus`, `Research an` | Allowlist, dann „Soll ich?“ |
| `dock.go` | `Zeig Chat`, `Zurück zum Chat` | `goDock` |
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

---

## 4. Sätze (Gold)

```
Öffne die Watchliste
Öffne Lieblinge
```

Chip-Tap Watchliste / Lieblinge → dieselbe Folie, richtiger Tab.

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

---

## 5. Won’t in `18.7`

- 6. Dock-Icon, Drawer-Ersatz fürs ganze Dock.
- Computer-Use, Screenshot-Klick, LocateAnything-Handy (Freeze).
- Android-Systemschalter umlegen.
- Keys/Tokens/MAC per Satz schreiben.
- LLM führt JSON aus oder spielt Organizer.
- e5 / Mem0 / Qdrant / Graphiti in `pickRoute`.
- ReAct-Schleife pro Overlay-Tap.
- Neue Motion-Lib.
- Sideload in diesem PLAN versprechen — APK erst mit Execute + SDK.

---

## 6. Probe (nach 321)

```
Leiste: Chat Lage Hören Kalender Mehr. Darüber zwei Chips.
Chip Watchliste → Folie Watchliste. Chip Lieblinge → Tab Lieblinge.
Öffne das watchlist overlay → Folie, nicht Fahrmodus.
Einstellungen zu → Folie weg.
Research an → Nachfrage, nach Ja Schalter.
Mach das Film-Overlay auf → Watchliste oder ehrliche Nachfrage.
Klick Speichern / WLAN aus → Won’t.
Lage auf → Kugel wie 18.6, keine Schicht von allein.
```
