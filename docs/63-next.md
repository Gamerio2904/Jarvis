# 63 — Dual Brain: Groq primär, Gemini Spezialist **PLAN**

PO 2026-09-08: **Groq als Standard-Hirn** (Latenz + Free-Tier), **Gemini nur dort, wo es messbar besser ist** (Vision, Grounding, Deep Research). **Mehr LLM** nur an klar definierten Stellen — mit harter Regel: **Latenz und/oder Qualität müssen besser werden, niemals schlechter.**

**App-Stand:** Code **`13.44.0`**. Agenten-Netzwerk [`62-next.md`](./62-next.md) **PLAN** 226–235. Diese Schiene startet **nach 229 (Director)** oder parallel ab 236 — baut auf **einem Brain-Call pro Turn** auf.

Gold später: `test:prompts` + `test:014` + `test:brain-orchestrator.mjs` + Latenz-Budget aus [`44-next.md`](./44-next.md).

---

## 0. Leitentscheidung (Abkehr von `6.50`)

| Heute (`13.44`) | Ziel (`15.2`) |
|-----------------|---------------|
| Gemini → Groq → 0,5B | **Groq → Gemini (Spezialist) → 0,5B** |
| Gemini blockiert lokales Modell | Lokales 0,5B parallel erlaubt wenn kein Groq |
| Research ohne Gemini = nur Links | Groq fasst DDG/Wiki-Treffer; Gemini nur bei Deep/Grounding |
| Ein `brainKind()` für alles | **`BrainOrchestrator`** wählt Modell **pro Aufgabe** |

**Gemini bleibt** — nicht „ersetzt“, sondern **entlastet**: weniger Turns, gezieltere Calls, bessere p95.

---

## 1. Zielbild — Zusammenspiel Groq ↔ Gemini

```text
Turn
  → Parser / Director / Domänen-Agenten (kein LLM)
  → BrainOrchestrator.plan(turnPlan)
       │
       ├─ slot: none          → canned / Parser-Antwort (0 ms LLM)
       ├─ slot: micro-clarify → Groq tiny (nur bei policy margin < ε, Budget 600 ms)
       ├─ slot: micro-merge   → Groq kurz (Multi-Agent-Fakten → 1–2 Sätze)
       ├─ slot: chat          → Groq Standard (Default Smalltalk + Formulierung)
       ├─ slot: research-lite → Groq + DDG/Wiki (Synthese, kein Google-Grounding)
       ├─ slot: research-deep → Gemini + Grounding (nur Deep/Product/Fact mit Quellen-Pflicht)
       ├─ slot: vision        → Gemini Vision (Auge, Doc, PC-Screenshot — unverändert Pflicht)
       └─ slot: local-fallback → 0,5B (nur wenn Groq+Gemini down / offline)
  → Front (Jarvis/Friday) → eine Nutzer-Antwort
```

**Regel:** Pro User-Turn maximal **ein** `chat`-Slot + optional **ein** `micro-*`-Slot **oder** **ein** Spezial-Slot (`vision` / `research-deep`). Nie zwei volle Chat-Calls.

---

## 2. Aufgaben-Matrix (wer macht was)

| Aufgabe | Primär | Fallback | Gemini Pflicht? | Mehr LLM? |
|---------|--------|----------|-----------------|-----------|
| Geräte/Write (TV, Steckdose, …) | Parser + Verify | — | Nein | **Nein** |
| Read-Tools (Wetter, Tanke, …) | Parser + API | — | Nein | **Nein** |
| Smalltalk / Follow-up | **Groq** | 0,5B | Nein | Ja — **chat** |
| Domänen-Fakten → Stimme | **Groq** `format` | Gemini nur wenn Groq fail | Nein | Ja — **merge** (1 Call) |
| Policy-Gleichstand (zwei Routen) | **Groq** `clarify` | Regex-Frage (heute) | Nein | Ja — **micro-clarify** |
| Live-Lookup leicht | **Groq** + DDG/Wiki | Links-only | Nein | Ja — **research-lite** |
| Deep Research / Product / Grounding | **Gemini** + Search | Groq lite + DDG | **Ja** | Ja — **research-deep** |
| Foto / Datei / PC-Bild | **Gemini Vision** | — | **Ja** | Nein (schon LLM) |
| Digest / Gespräch zusammenfassen | **Groq** | Gemini | Nein | Ja — **chat** kurz |
| Neural-TTS (Film-Stimme) | Gemini TTS | Edge/System | Optional | Nein |

**Qualitäts-Gate:** Ein neuer LLM-Slot wird nur aktiv, wenn im Shadow-Modus (Sprint 237) **≥ gleiche Qualität** und **≤ Latenz** vs. Baseline `13.44` gemessen.

---

## 3. Latenz-Strategie (schneller werden)

| Hebel | Effekt |
|-------|--------|
| Groq primär | First-Token oft **200–600 ms** schneller als Gemini Flash |
| Kein Gemini für Standard-Chat | ~30–50 % weniger Cloud-Turns |
| Micro-LLM statt User-Nachfrage | Ein 400 ms Groq-Call ersetzt **zwei** volle Turns |
| Director-Merge | Domänen liefern Fakten; **ein** Format-Call statt Parser-Miss → LLM-Raten |
| Gemini parallel nur **prefetch** | Vision/Deep: Groq startet Antwort-Skeleton, Gemini liefert Spezialblock — **nur** wenn Gesamt-p95 sinkt (A/B) |
| Parser bleibt first | Kein LLM vor Score ≥ Schwelle |

**SLO (Gold 238):**

| Metrik | Soll vs. `13.44` |
|--------|------------------|
| p95 First-Token Smalltalk | **≤ −20 %** (Groq primär) |
| p95 Parser-Tools | **±0 %** (kein LLM davor) |
| Research Quellen-Treffer | **≥ Baseline** |
| Vision-Antwortqualität | **≥ Baseline** (Gemini) |
| Fehlrouting bei Gleichstand | **≤ Baseline** (micro-clarify) |

---

## 4. Qualitäts-Strategie (besser werden)

| Hebel | Effekt |
|-------|--------|
| **merge**-Slot | Agenten-/Tool-Fakten werden konsistent in Jarvis-Stimme geformt |
| **clarify**-Slot | Natürlichere Rückfrage statt starrer `askReply(a,b)` |
| Groq Llama 3.x / Qwen-class | Besseres DE als 0,5B für Alltags-Smalltalk |
| Gemini nur Deep | Grounding-Qualität dort, wo Groq+DDG schwächelt |
| `promptSlice` pro Domäne (62-next) | Ein Groq-Call, modularer Prompt — präziser ohne 52 Calls |

**Niemals schlechter:** Feature-Flag pro Slot; Default **aus** bis Shadow grün; Rollback ohne APK-Neuinstall.

---

## 5. Technisches Design

### 5.1 Dateien (neu / geändert)

| Datei | Rolle |
|-------|-------|
| `brain-orchestrator.ts` | `planTurn()`, `executeSlot()`, SLO-Logging |
| `brain-pick.ts` | Erweitert: `pickSlot(task)` statt nur `pickBrain()` |
| `brain-tasks.ts` | Task-Typen + Regeln (vision → gemini, chat → groq, …) |
| `brain.ts` | Delegiert an Orchestrator; `completeBrain` bleibt API |
| `chat.ts` / `director.ts` | Rufen Orchestrator statt fest `kind === 'gemini'` |
| `latency.ts` | Spur pro Slot (`groq-chat`, `gemini-ground`, …) |

### 5.2 Settings (neu)

```typescript
brain_primary: 'groq' | 'gemini' | 'local'        // Default: groq
brain_gemini_roles: {
  vision: boolean      // default true — Auge/Doc/PC
  grounding: boolean   // default true — deep/product research
  tts: boolean         // default true — Film-Stimme
}
brain_micro_llm: {
  clarify: boolean     // default false bis 237 Shadow grün
  merge: boolean       // default false bis 237 Shadow grün
}
brain_shadow_mode: boolean  // misst Baseline vs. Kandidat, antwortet noch alt
```

### 5.3 Orchestrator-Pseudocode

```typescript
export type BrainSlot =
  | 'none' | 'micro-clarify' | 'micro-merge'
  | 'chat' | 'research-lite' | 'research-deep' | 'vision' | 'local-fallback'

export function planBrainSlots(ctx: TurnBrainCtx): BrainSlot[] {
  if (ctx.vision) return ['vision']
  if (ctx.deepResearch) return ['research-deep']
  if (ctx.liveLookup) return ['research-lite']  // Gemini nur wenn grounding an + lite fail
  if (ctx.policyAsk && settings.brain_micro_llm.clarify) return ['micro-clarify']
  if (ctx.agentFacts && settings.brain_micro_llm.merge) return ['micro-merge']
  if (ctx.needsLlm) return ['chat']
  return ['none']
}
```

### 5.4 Gemini-Anbindung (Spezialist)

Gemini wird **nur** gerufen wenn:

1. `brain_gemini_roles.vision` && Vision-Intent
2. `brain_gemini_roles.grounding` && (`isDeepResearch` || Product mit Quellen-Pflicht) && (Groq-lite leer **oder** Quellen < Schwelle)
3. User setzt `brain_primary: 'gemini'` (Override)
4. TTS-Pfad unverändert (`tts.ts`)

**Kein** Gemini für: Smalltalk, Brief-Formulierung, Digest, Standard-Follow-up.

### 5.5 Mehr LLM — erlaubte Slots (explizit)

| Slot | Wann | Modell | Abbruch wenn |
|------|------|--------|--------------|
| **micro-clarify** | `pickPolicy` → ask, margin < 0.08 | Groq, max 80 tokens | p95 > 600 ms → Regex-Fallback |
| **micro-merge** | Director: ≥1 AgentResult mit facts | Groq, max 120 tokens | facts leer → Front canned |
| **chat** | LLM-Miss nach Parser | Groq | fail → Gemini **nur** wenn primary=gemini |
| **research-lite** | `isLiveLookup`, nicht deep | Groq + digest | Quellen < 2 → escalate research-deep |
| **research-deep** | deep / lite fail | Gemini + search | — |

---

## 6. Einbindung Agenten-Netzwerk (62-next)

| Sprint 62 | Sprint 63 (diese Schiene) |
|-----------|---------------------------|
| 227 Catalog | — |
| 228 Bus + Traces | Trace-Feld `brainSlot` |
| **229 Director** | Director ruft `planBrainSlots` **nach** merge |
| 230 Curator | unverändert |
| 231–233 Domänen | `AgentResult.userFacts` speist **merge** |
| 234 Agenten-Karte | Debug: letzter Slot pro Organ |
| 235 Parity 14.9 | — |
| **236–238** | **Dual Brain Execute** (diese Schiene) |

**Wichtig:** 14.9 shippt **ohne** Groq-primary (Flag aus). 15.2 shippt Dual Brain als Default.

---

## 7. Migrationsplan — Sprints 236–238

Eigene Schiene **`15.0`**. Baut auf Director (229) und Catalog (227) auf.

| Sprint | Version | Thema | Must? | Risiko |
|--------|---------|-------|-------|--------|
| **236** | `15.0.0` | **Groq primär** — `brain-orchestrator`, Settings, `pickBrain` v2 | Must | Mittel — `chat.ts` |
| **237** | `15.1.0` | **Micro-LLM** clarify + merge + research-lite; Shadow-Modus | Must | Mittel — Qualitäts-Gates |
| **238** | `15.2.0` | Gold Latenz/Qualität + Sideload `15.2.0` | Must | APK |

Detail: [`sprints/sprint-236.md`](./sprints/sprint-236.md) … [`sprint-238.md`](./sprints/sprint-238.md).

### 7.1 Phasen-Logik

```text
236  Groq Default, Gemini Spezialist (Vision + Deep), Flag brain_v2 aus
237  micro-clarify + micro-merge + research-lite — je Slot Shadow → Default an
238  SLO grün, Docs CODE, Sideload 15.2.0
```

### 7.2 Feature-Flags

| Flag | Default bis | Default ab 238 |
|------|-------------|----------------|
| `brain_v2` | `false` | `true` |
| `brain_micro_llm.clarify` | `false` | `true` wenn Shadow ok |
| `brain_micro_llm.merge` | `false` | `true` wenn Shadow ok |

Rollback: `brain_v2: false` → Verhalten `13.44` (Gemini first).

### 7.3 Won’t

| Won’t | Warum |
|-------|-------|
| Zwei volle Chat-Calls pro Turn | Latenz |
| Gemini für TV/Wetter/Timer | Parser-first |
| LLM statt Verify bei device/write | Sicherheit |
| Slot aktiv ohne Shadow-Grün | „Niemals schlechter“ |
| Groq Vision | Qualität — Gemini bleibt |

---

## 8. Gold (nach Execute 15.2)

| ID | Soll |
|----|------|
| **B1** | `brain_primary=groq`: Smalltalk p95 First-Token **−20 %** vs. 13.44 |
| **B2** | `test:prompts` 181/181 unverändert |
| **B3** | Vision-Turns nutzen Gemini, nicht Groq |
| **B4** | Deep Research: ≥ Baseline Quellen + keine erfundenen Preise |
| **B5** | micro-clarify: Gleichstand-Turns **≤** Fehlrouting Baseline |
| **B6** | micro-merge: Agent-Turn lesbar, **ein** Groq-Call im Trace |
| **B7** | Debug-Export: `brainSlots[]` mit ms + model |
| **B8** | `brain_v2` aus = identisch 13.44 Hirn-Reihenfolge |

---

## 9. Abnahme & PO

1. **236:** Groq primary auf Dev-Handy — Smalltalk subjektiv schneller, Vision noch Gemini.
2. **237:** Shadow 3 Tage — clarify/merge nur aktivieren wenn B5/B6 grün.
3. **238:** Sideload `15.2.0`, [`16-gemini.md`](./16-gemini.md) + [`42-planned.md`](./42-planned.md) aktualisiert.

---

## 10. Referenzen

- Agenten-Netzwerk: [`62-next.md`](./62-next.md)
- Hirn heute: `brain-pick.ts`, `brain.ts`, `chat.ts`, `gemini.ts`, `groq.ts`
- Latenz: [`44-next.md`](./44-next.md), `latency.ts`
- Gemini-Rolle historisch: [`16-gemini.md`](./16-gemini.md)

Sprints: [`sprint-236.md`](./sprints/sprint-236.md)–[`sprint-238.md`](./sprints/sprint-238.md).
