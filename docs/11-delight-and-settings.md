# 11 — Delight, Easter Eggs & Einstellungen

Spielerei und Begeisterung — **dosiert**, abschaltbar, local-first.

## Live `2.28.0` — Einstellungen

Das **neue Design** aus `1.25.0` ([`sprint-77.md`](./sprints/sprint-77.md)) ist der Stand, nicht das flache 7er-Panel von `0.7.0`.

| Was | Stand |
|-----|--------|
| Fläche | Einstellungen füllen den **ganzen Schirm** (Overlay). Nicht mehr der Dump in der Sidebar. |
| Leiste | Links **Themen**. Rechts der Inhalt. Fertig oder Escape schließt. |
| Sidebar | Nur Chats + eine Statuszeile. Gedächtnis sitzt unter Einstellungen. |
| Tests | **Weg.** `2.2.1` hatte Kopierfelder, `2.2.2` hat sie aus der APK genommen. |
| Delight / Eggs | Unter **Ton**, kein eigenes Thema mehr. |
| Neue Marke | `2.21`–`2.28` härten Graphik, **kein** zweites Settings-Design. |

### Themenleiste (jetzt)

```text
Einstellungen (Vollbild)
├─ Allgemein     Version, Modell-Hinweis, TV-Kurzstatus
├─ Modell        lokales Qwen, Download
├─ Cloud         Gemini, Groq, Tankerkönig, OMDb
├─ Sprache       Hören, Wake-Word, Shortcut
├─ Wecker        Ton, Timer, Erinnerungen
├─ Ort           GPS, letzter Ort, Wetter
├─ Fernseher     Tizen + Fire TV
├─ PC            JarvisPC im WLAN
├─ Haus          Steckdosen, Ventilator
├─ Musik         Spotify (Fahrmodus)
├─ Ton           UI-Sounds + Delight + Easter Eggs
├─ Netz          Research, Rabatt-Suche, Audit
├─ Gedächtnis    Liste, Filter, löschen
└─ Gefahr        Memory löschen (Bestätigung)
```

Ein Sideload über `2.21.0` lässt Keys, TV und Gespräche liegen — gleiche App-ID. Das ist Speicher, nicht ein zweites Design.

## Versionierung (verbindlich)

| Version | Sprint / Doc | Inhalt |
|---------|--------------|--------|
| `0.4.0` | Sprint 8 | Gedächtnis (Voraussetzung für Jokes) |
| `0.4.1`–`0.4.3` | Sprints 9–11 | Memory-Fixes/Polish/Hotfix |
| `0.5.0`–`0.5.2` | Sprints 12–14 | Router + Hotfix/Polish |
| `0.6.0`–`0.6.2` | Sprints 15–17 | Research |
| `0.7.0` | Sprint 18 | Delight + **altes** flaches Panel (≤7 Anker) — **ersetzt** |
| `1.13.0` | Sprint 63 | Chat-GUI fest, Motion |
| `1.25.0` | Sprint 77 | **Einstellungen Vollbild + Themenleiste** — gilt |
| `2.2.2` | Sprint 104 | Tests-Thema wieder raus |
| `2.28.0` | Sprint 108 | gleiche Settings-GUI; Alltag & Welt im Chat |
| `2.28.1` | Sprint 108 Patch | Sprache: still zuhören, Charon statt Klick-TTS |

### Delight im Chat

Momente/Jokes/Eggs/Sounds unter **Ton**. Persona siezt. Morgen-Lage und Timer ohne Pflicht-Disclaimer: `1.19` / [`19-next.md`](./19-next.md), **CODE**.

---

## 1) Jarvis-Moment

### Idee
Seltene, situative Mikro-Momente: Jarvis wirkt präsent (UI + Text), ohne Gimmick-Spam.

### Trigger (Beispiele)
- Erste Begrüßung des Tages
- User kommt nach langer Pause zurück
- Erfolgreicher Recall eines wichtigen Fakts
- Nach hartem Inject-Block (trocken siegessicher)

### UX
- Sehr dezenter Accent-Glint am Avatar / Brand-Mark (1×, kurz)
- Optional: ein knapper Satz im Jarvis-Ton
- Frequency-Cap: z.B. max. 1–2 / Tag (Setting)

### Setting
Einstellungen → **Ton** → Jarvis-Momente = An / Aus (Default: An)

---

## 2) Inside Jokes

### Idee
Laufende Gags aus **Langzeitgedächtnis** (category `joke` / `pref`), selten und treffend.

### Regeln
- Nur speichern, wenn User mitspielt oder explizit „das behalten wir“
- Nie überstrapazieren (Cooldown-Cap)
- Soft-delete in „Was Jarvis über mich weiß“
- Kein Witz bei ernstem Intent (`task` / `research` / klar schlechte Stimmung)

### Setting
Einstellungen → **Ton** → Inside Jokes = An / Aus  
Einstellungen → **Ton** → Witz-Frequenz = Selten / Normal (zwei Stufen, kein Slider-Wald)

---

## 3) Sound Design (light)

### Idee
Minimale UI-Sounds für Präsenz — Premium, nicht Arcade.

### Sounds (wenige)
| Event | Charakter |
|-------|-----------|
| Send | kurz, weich |
| Receive/done | sehr kurz, warm |
| Error | gedämpft, nicht schrill |
| Jarvis-Moment | optional hauchzart |

### Regeln
- Default: **Aus** oder sehr leise (PO-Entscheidung im Sprint)
- Ein Master-Toggle + Volume (eine Stufe-Leiste)
- `prefers-reduced-motion` respektiert; separates `prefers-reduced-sound` wenn möglich

### Setting
Einstellungen → **Ton** → UI-Sounds An/Aus  
Einstellungen → **Ton** → Lautstärke niedrig/mittel/hoch

---

## 4) Easter-Egg-Commands

### Idee
Versteckte, aber **in den Einstellungen gelistete** Kommandos — Entdecken + Nachschlagen.

### Beispiele
| Command | Wirkung |
|---------|---------|
| `/protokoll` oder „Protokoll“ | Dry Status: Modell, Memory-Count, Version |
| `/mission` | Quatsch-Mission im Jarvis-Ton (1 Kurzabsatz) |
| `/kante` / `/ruhe` | Stimmungsmodus für die Session |
| `/vergissWitz` | letzten Joke-Pin löschen |
| `/quellen` | nur sinnvoll wenn Research an |

### Sichtbarkeit
Einstellungen → **Ton** (nicht mehr ein eigenes Thema „Easter Eggs“):
- Toggle: Easter Eggs an (Default An)
- Keine Verschachtelung, keine versteckten Submenüs

### Sicherheit
- Keine Shell, kein Dateisystem, kein Netz über Eggs
- Eggs laufen durch dieselbe Guard-Pipeline

---

## 5) UX-Prinzip (weiter gültig)

Das 7er-Panel von `0.7.0` ist **Historie**. Die Regeln darunter gelten im Vollbild von `1.25.0`:

1. **Ein** Overlay — kein Nesting über 1 Ebene (Thema → Karte → Kontrolle)
2. Themen links, Inhalt rechts — nicht alles in der Sidebar
3. Jede Einstellung: **Label + 1 Satz Hilfe + Kontrolle**
4. Keine Modal-in-Modal; keine Accordion-Hölle
5. Sofort speichern
6. Gefahr klar getrennt (Gedächtnis löschen)

### Historie `0.7.0` (nicht mehr die GUI)

```text
Allgemein · Modell · Gedächtnis · Delight · Sound · Easter Eggs · Forschung
```

### Anti-Patterns
- Tabs in Tabs
- Versteckte Advanced-Seite mit 50 Flags
- Einstellungen nur als JSON-Datei

### Abnahme Settings
- Zahnrad oder Menü → Einstellungen: ganzer Schirm, Themenleiste
- Ton: Sounds, Delight, Eggs
- Memory löschen braucht Bestätigung
- Kein Tests-Thema in der APK

---

## Backlog-IDs

| ID | Story | Stand |
|----|-------|--------|
| S8.1 | Jarvis-Momente An/Aus + Frequency-Cap | done, unter Ton |
| S8.2 | Inside Jokes via Memory-Pins | done, unter Ton |
| S8.3 | UI-Sounds Send/Receive/Error | done, unter Ton |
| S8.4 | Easter-Egg-Commands in Settings | done, unter Ton |
| S8.5 | Settings-GUI | `0.7.0` Panel ersetzt durch `1.25.0` Vollbild |

Epic: **E8 Delight & Settings** in [`05-product-backlog.md`](./05-product-backlog.md).
