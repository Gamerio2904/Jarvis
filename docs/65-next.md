# 65 — Reel-UI, Sprache, Lage, Kalender, Antwort-Qualität **PLAN** (`16.0.0`)

PO 2026-09-09: Drei Instagram-Reels als Design-Vorbild + Screenshots aus dem Feld. Code-Stand **`15.3.1`**.

| Reel | Inhalt (Jarvis-Ziel) |
|------|----------------------|
| [Dc_qazGKcQ8](https://www.instagram.com/reel/Dc_qazGKcQ8/) | Iron-Man-HUD: flüssiger Modus-Wechsel, Glow-Arc, PC-Ästhetik → **Theme-Transition + Lage** |
| [Dcv8J2OknIz](https://www.instagram.com/reel/Dcv8J2OknIz/) | Kalender-UI: große Tage, Swipe-Monat, FAB „Termin“ → **Calendar v2** |
| [DclotjJkrDF](https://www.instagram.com/reel/DclotjJkrDF/) | Schalter statt Checkbox, Slide-Animation → **`JarvisSwitch`** |

Gold: `test:prompts` + `test:rest-final` + manuell Handy (Lage, Hören, Kalender, Einstellungen-Suche).

---

## 0. Screenshot ↔ Bug ↔ Code

| Screenshot / Symptom | Ursache (Code) | Sprint |
|----------------------|----------------|--------|
| **Lage-Tap → Blackscreen** (auch nach 15.3.1) | `lageScene` versteckt Chat **und** Composer; Lage = dunkle Kugel-Canvas (`#050a10`). Session-Fix half nur beim **Neustart**, nicht in der Session. | **242** |
| **Einstellungen „Fernseher“ → nichts** | `filterTopics()` matcht nur Tab-Label/Hint; `/tv/` trifft nicht `fernseher`. Keine Feld-Suche in Panes. `settings-ia.ts` | **242** quick, **248** voll |
| **Sprache abgehackt** („1 inuten“) | Web STT 800 ms bei unvollständig; native `listenExtend` max 2×; Satz-Chunks in `createSentenceTap` | **246** |
| **Fallback-Stimme / bricht ab** | TTS-Kette Edge→Gemini→gTTS→**Pico**; `voice_tts: system` oder Timeout → native; Satz-für-Satz-Lücken | **246** |
| **Timer „20: 48“** | Formatierung in Timer-Antwort / TTS-Normalize | **247** |
| **Smalltalk → „Ort im Textblock nicht…“** | Falscher Agent (`search`/Fachwissen) oder LLM mit leerem Knowledge-Block; Director-Routing | **247** |
| **„Niederlande auf Kugel“ → nicht vorhanden** | `wont-parse` / HUD pin vs. Gazetteer; `globe-geo.ts` hat NL, aber Fly-to/Pin fehlt bei Chat-Flow | **242** |
| **Wetter doppelt / Hauptstraße 5** | Korrekt aber repetitiv; `briefPlace` + feste Demo-Adresse in Tests/Settings | **247** |
| **Research-Antwort abgeschnitten** | Composer überlappt letzte Bubble (kein `padding-bottom` für floating composer) | **242** |
| **Kein Light/Dark-Toggle** | Nur `--color-scheme: dark`; `hud_accent` = orange/grün, kein `ui_theme` | **244** |
| **26× native Checkbox** | `SettingsScreen.tsx` `.settings-toggle` | **243** |

---

## 1. Versions-Roadmap

| Version | Sprint | Fokus | Ship |
|---------|--------|-------|------|
| **`15.3.2`** | 242 | **Hotfix:** Lage Handy chat-first, Composer sichtbar, Suche Fernseher, Globe-NL, Chat-Padding | sofort |
| **`15.4.0`** | 243 | Reel-Schalter `JarvisSwitch` (alle Settings) | |
| **`15.5.0`** | 244 | Light-Theme + Reel-Transition (Dc_qazGKcQ8 Arc/Glow) | |
| **`15.6.0`** | 245 | Kalender Reel-UI + Workflow (Dcv8J2OknIz) | |
| **`15.7.0`** | 246 | Sprachmodus STT/TTS (ganzer Satz, Neural-Lane) | |
| **`15.8.0`** | 247 | Antwort-Qualität (Routing, Timer, Smalltalk) | |
| **`16.0.0`** | 248 | Einstellungs-Suche v2 (Felder + Synonyme + Tab-Sprung) | Meilenstein UI |

Abhängigkeit: **242 vor 244** (Lage stabil, sonst testet PO auf schwarzem Screen).

---

## 2. Sprint 242 — Lage-Handy + Quick Fixes (`15.3.2`)

### 2.1 Lage Blackscreen (P0)

**Heute (`App.tsx`):**
```typescript
lageScene = lageOn && !lageWide  // Handy: Vollbild-Lage
!lageScene && … → composer-wrap   // Composer aus
messages hidden={lageScene}
```

**Ziel:**
- Handy: **Chat-first** — Lage als Panel **über** Chat, Composer **immer** sichtbar (wie `layout-probe.ts` erwartet).
- `lageSession` bleibt für Tablet/Desktop-Split.
- CSS: `messages`/`composer` `padding-bottom` wenn Research-Bubble lang.

**Dateien:** `App.tsx`, `index.css`, `layout-probe.ts` Gold aktualisieren.

### 2.2 Einstellungs-Suche Quick

`settings-ia.ts` Aliase erweitern:
```typescript
/fernseh|samsung|tizen|tizen|hollywood/i → geraete
/kalender|termin/i → alltag
/timer|wecker/i → alltag
```

`settingsTabForQuery`: bei Treffer **Tab wechseln** (bereits implementiert — fehlte nur Match).

### 2.3 Kugel Niederlande

- Chat „Wo ist Niederlande?“ → `wont-parse` / `globe-countries.ts` ✓
- „Zeig auf Globus“ → `saveSettings(last_globe_focus)` + Pin in `loadGlobePins`
- Antwort nicht „nicht vorhanden“ wenn `matchCountry('niederlande')` trifft

---

## 3. Sprint 243 — Reel-Schalter (`15.4.0`)

**Vorbild:** [DclotjJkrDF](https://www.instagram.com/reel/DclotjJkrDF/)

| Heute | Ziel |
|-------|------|
| `<input type="checkbox">` in `.settings-toggle` | `<JarvisSwitch>` — Track + Thumb, 200 ms ease, Accent-Glow wenn an |
| HUD-Module Grid Checkboxen | gleiche Komponente |
| `hud_force` Sonderfall | Switch + `setLageSession` |

**Dateien:** `ui/JarvisSwitch.tsx`, `index.css`, `SettingsScreen.tsx` (26 Stellen).

**Akzeptanz:** Alle Booleans in Settings nutzen Switch; Keyboard + `aria-checked`; reduced-motion ohne Slide.

---

## 4. Sprint 244 — Theme + Reel-Animation (`15.5.0`)

**Vorbild:** [Dc_qazGKcQ8](https://www.instagram.com/reel/Dc_qazGKcQ8/)

| Heute | Ziel |
|-------|------|
| Nur Dark (`index.css :root`) | `ui_theme: 'dark' \| 'light' \| 'system'` in `store.ts` |
| Kein Toggle | Settings → Lage: Theme-Switch mit **Arc-Wipe** (Canvas/CSS `@property` oder clip-path) |
| `hud_accent` orange/grün | bleibt orthogonal zum Light/Dark |

**Animation (Reel-Näherung):**
1. Tap Theme → radial wipe von Nav-Island (grün → hell oder umgekehrt)
2. 280 ms `--ease-out`; `prefers-reduced-motion` → instant swap
3. Ambient-Orbs passen Helligkeit an

**Dateien:** `index.css` (`[data-theme=light]`), `App.tsx`, `SettingsScreen.tsx`, optional `fx/theme-transition.ts`.

---

## 5. Sprint 245 — Kalender Reel (`15.6.0`)

**Vorbild:** [Dcv8J2OknIz](https://www.instagram.com/reel/Dcv8J2OknIz/)

### UI
- Monats-Swipe (touch `pointer-events` auf `.cal-grid`)
- **FAB** „＋ Termin“ (grün, fix unten rechts, über Nav)
- Tages-**Sheet** statt Formular inline: Titel, Uhrzeit-Rad, Speichern
- Wochenleiste sticky; heute = Ring, Termin = Dot + Titel-Vorschau

### Workflow
| Schritt | Heute | Neu |
|---------|-------|-----|
| Termin anlegen | Form unten, „Anlegen“ | FAB → Sheet → Speichern → Haptic |
| Sprache | `calendar-parse.ts` | unverändert + Bestätigungs-Chip |
| Erinnerung | separate Liste | im Tages-Sheet mit Badge |
| Jahr-Ansicht | kleine Mini-Grids | Vollbreite mit Heatmap-Dots |

**Dateien:** `Calendar.tsx`, `index.css` (`.cal-*`), `calendar.ts`.

---

## 6. Sprint 246 — Sprachmodus (`15.7.0`)

### STT (abgehackt)
| Fix | Datei |
|-----|-------|
| Silence 800 ms → 1100 ms bei VoiceMode | `turn-detect.ts` / `VoiceMode.tsx` flag |
| Native: `listenExtend` 2 → 4 bei Satz ohne Punkt | `JarvisVoicePlugin.java` |
| `repairSpeech` vor Turn: „inuten“→„Minuten“ | `utterance.ts` erweitern |
| Partials nicht als final committen | `native/voice.ts` |

### TTS (Fallback / abbricht)
| Fix | Datei |
|-----|-------|
| **Ein** Audio-Stream pro Antwort (merge chunks) | `createSpeakPipeline.ts` |
| `voice_tts: auto` — Edge Timeout 1100→1800 ms Standing | `edge-tts.ts` |
| Kein Lane-Wechsel mid-reply (bereits Regel — prüfen) | `native/voice.ts` |
| VoiceMode: `truncateSpoken` erst nach Satzende | `VoiceMode.tsx` |

**Gold:** Manuell 3 Sätze + Timer-Befehl; kein Pico unless `voice_tts: system`.

---

## 7. Sprint 247 — Antwort-Qualität (`15.8.0`)

| Problem | Fix |
|---------|-----|
| Smalltalk → Fachwissen-Antwort | Director: `identity`/`chat` vor `search`; Knowledge-Block leer → nicht in Prompt |
| Wetter „Hauptstraße 5“ immer | `last_place` aus GPS; Antwort „bei Ihnen“ wenn Fix frisch |
| Timer Format „20: 48“ | `formatDue` / `timerSetLine` ohne Leerzeichen nach `:` |
| Research bricht ab | `.messages` padding-bottom = composer height |
| `/hilfe` + Wetter same turn | Split-Intents Reihenfolge prüfen |

**Dateien:** `director.ts`, `chat.ts`, `persona.ts`, `timer-announce.ts`, `index.css`.

---

## 8. Sprint 248 — Einstellungs-Suche v2 (`16.0.0`)

### Index
```typescript
type SettingsSearchHit = { tab: SettingsTab; field: string; keywords: string[] }
```
Build aus `SettingsScreen` Labels + `SETTINGS_FIELD_INDEX` (neu).

### Verhalten
- Treffer → Tab springen + **Feld highlight** (scroll + 2 s Accent-Ring)
- Synonyme: Fernseher→tv, Wecker→alarm, Kalender→calendar, Groq→keys, …
- Leer → alle Tabs (heute); Miss → Vorschläge („Meinten Sie TV?“)

**Dateien:** `settings-ia.ts`, `settings-search-index.ts`, `SettingsScreen.tsx`.

---

## 9. Abgleich Docs

| Doc | Update bei Ship |
|-----|-----------------|
| `CHANGELOG.md` | pro Version |
| `09-versioning.md` | 15.3.2–16.0.0 |
| `42-planned.md` | 65-next eintragen |
| `apk.md` | nach 242/245 |
| `TEST-15.x.md` | PO-Checkliste Lage/Sprache/Kalender |

---

## 10. PO-Testreihenfolge (nach 242 APK)

1. App starten → **Chat** sichtbar (nicht schwarz)
2. Lage → Kugel → drehen; Chat-Tab zurück
3. Einstellungen → Suche „Fernseher“ → Tab Geräte
4. Hören → ganzer Satz Timer 1 Minute
5. Kalender → Termin anlegen (bis 245: FAB)

Siehe Einzelsprints: [`sprint-242.md`](./sprints/sprint-242.md) … [`sprint-248.md`](./sprints/sprint-248.md).
