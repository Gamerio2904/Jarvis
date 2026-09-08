# 62 — Jarvis 14.0 Agenten-Netzwerk **CODE** (`15.1.0`)

PO 2026-09-08: Reel [DbYh2P-MQnj](https://www.instagram.com/reel/DbYh2P-MQnj/) (alassafi.ai) — **137 Agenten**, **7 Abteilungen**, **live Karte**, **zentrales Firmen-Gehirn** als gemeinsame Wissensbasis. Jarvis soll von „eine KI mit Parsern“ zu einem **Netzwerk spezialisierter Agenten** werden — sichtbar in der **Körper-/Agenten-Karte**, ohne Funktionsverlust.

**App-Stand:** Code und Sideload **`15.1.0`**. Execute Sprints **227–235** **CODE**. Hirn: Groq primär ([`63-next.md`](./63-next.md)). Parser zuerst. TypeScript **war** der eine Agent (`chat.ts` + `registry.ts`); ab **229** koordiniert **`director.ts`** das Netzwerk.

---

## 0. Reel-Analyse (Was das Video zeigt)

| Element im Reel | Bedeutung |
|-----------------|-----------|
| **137 Agenten** | Jede **Job-Fähigkeit** ist ein eigener, benannter Agent — nicht ein Prompt an ein großes Modell. |
| **7 Abteilungen** | Meta-Cluster (Sales, Deals, Marketing, Ops, Intelligence, Customer, Back Office) — **Bäume** auf einer Karte. |
| **Firmen-Gehirn (Mitte)** | Zentrale **Wissensbasis**; alle Abteilungen lesen/schreiben dort — **eine Wahrheit**, keine Silos. |
| **Live-Karte** | Agenten sind **klickbar**; man öffnet einen Skill und **führt ihn aus** — Diagramm ≠ Deko. |
| **Manual / Assisted / Autonomous** | Jeder Job hat einen **Reifegrad** — wie viel man abgeben kann. |
| **Echte Skills** | Kein Marketing-Poster: jeder Knoten = ausführbare Fähigkeit mit Ergebnis. |

**Jarvis-Übersetzung (privater Assistent, kein CRM):**

| Reel | Jarvis |
|------|--------|
| Firmen-Gehirn | **Haus-Gehirn** — Memory + Fachwissen + Working Memory + Curator |
| Abteilung | **Cluster** (Geräte, Navigation, Alltag, Information, …) |
| Job-Agent | **Domänen-Agent** — exakt eine Route (`tv`, `weather`, …) |
| Live-Karte | **Agenten-Karte** in der Lage (Evolution von `BodySchema` + `BodyTree`) |
| Ops/Backoffice still | **Interne Agenten** — Gate, Router, Verify, Sleep — **nie** im Chat |

---

## 1. Ist (Code `15.1.0`)

### 1.1 Nachrichtenfluss heute

```text
Chat / VoiceMode
  → turn-gate (Mutex)
  → normalizeUtterance + splitIntents
  → chat.routeDeterministic
       → pending FSMs (maps, pc, taxi, …)
       → runDirectorTurn (director.ts) wenn agent_network_v2
            → curatorPreflight
            → route-pick.propose + policy.pickPolicy
            → runAgent → handleX
       → sonst routeRegistry (Legacy)
  → bei Miss: streamChat → brain-orchestrator (brain_v2) oder Legacy Gemini/Groq/0,5B
  → eine Antwort, eine Stimme (Jarvis/Friday)
```

**Kern:** Ein Orchestrator-Prozess, flaches Register, **keine Agent-Grenzen**, **kein Message-Bus**.

### 1.2 Wissen heute

| Store | Datei | Rolle |
|-------|-------|-------|
| Langzeitgedächtnis | `store.ts` + `memory-layer.ts` | Cap 80, Gate STORE/MERGE/IGNORE |
| Fachwissen | `knowledge-store.ts` | Packs, Claims, Teach |
| Working Memory | `working-memory.ts` | 8 Zeilen rolling |
| Retrieve | `retrieve.ts` | Token + RRF, e5 nur Rerank |
| Körper-Baum | `body-graph.ts` | 9 Skills, 8 Organe — **nicht** 52 Domänen |

### 1.3 Körper-UI heute

| Datei | Ist |
|-------|-----|
| `BodySchema.tsx` | 8 Organe, Kanten, Puls, Mund = Stimme |
| `BodyTree.tsx` | Organ → Skill → Wissen (Token-Cluster) |
| `body-snap.ts` | Statuszeile pro Organ |

**Lücke:** Keine Darstellung des **Agenten-Netzwerks**; Skills decken ~9 von ~52 Routen ab.

### 1.4 Strukturelle Schulden (Rework-Anker)

1. **Doppeltes Register** — `route-pick.ts` (parse) und `registry.ts` (execute) müssen synchron bleiben.
2. **Settings-God-Object** — `last_*` Session-State nicht agent-scoped.
3. **Eine Persona** — `persona.ts` für alle Domänen; TV-Regeln stehen im gleichen Block wie Smalltalk.
4. **Kein Internal Channel** — alles was `handleX` zurückgibt, landet beim User.
5. **Produkt-Won’t** — [`56-next.md`](./56-next.md) §1: „Multi-Agent = Won’t“ — wird in **14.0** neu definiert (siehe §6).

---

## 2. Ziel — Agenten-Netzwerk

### 2.1 Produkt in einem Satz

Jarvis bleibt **ein Gespräch** — aber **hinten** arbeitet ein **Netzwerk**: jede Funktion (Fernseher, Wetter, Kalender, …) ist ein **spezialisierter Agent**; ein **Director** koordiniert; ein **Curator** hält das gemeinsame Wissen sauber; **stille Agenten** machen Routing, Verify und Sleep — **ohne** je mit dem User zu reden.

### 2.2 Leit (Ziel-Architektur)

```text
                    ┌─────────────────────────────────┐
                    │  Front-Agent (Jarvis / Friday)   │  ← einzige Nutzer-Stimme
                    │  Chat + Sprache + TTS            │
                    └───────────────┬─────────────────┘
                                    │
                    ┌───────────────▼─────────────────┐
                    │  Director (Orchestrator)         │
                    │  Turn → Plan → Merge → Reply     │
                    └───────────────┬─────────────────┘
          ┌─────────────────────────┼─────────────────────────┐
          │                         │                         │
┌─────────▼─────────┐   ┌───────────▼──────────┐   ┌─────────▼─────────┐
│ Router (intern)    │   │ Curator (intern)      │   │ Verify (intern)   │
│ route-pick+policy  │   │ Gate, Prune, Conflict │   │ action-fsm        │
└─────────┬─────────┘   └───────────┬──────────┘   └─────────┬─────────┘
          │                         │                         │
          └─────────────────────────┼─────────────────────────┘
                                    │
                    ┌───────────────▼─────────────────┐
                    │  Haus-Gehirn (Shared Brain)      │
                    │  Memory · Packs · Working · Events│
                    └───────────────┬─────────────────┘
                                    │
     ┌──────────┬──────────┬────────┼────────┬──────────┬──────────┐
     │ Geräte   │ Navigation│ Alltag │ Info   │ Medien   │ Werkstatt│
     │ Agents   │ Agents    │ Agents │ Agents │ Agents   │ Agents   │
     │ tv,fan…  │ drive,poi…│ cal…   │ weather│ film…    │ pc,eye…  │
     └──────────┴──────────┴────────┴────────┴──────────┴──────────┘
```

### 2.3 Agent-Typen

| Typ | Sichtbar für User | Spricht | Beispiele |
|-----|-------------------|---------|-----------|
| **Front** | Ja | Ja | Jarvis, Friday |
| **Director** | Nein (Debug) | Nein | Turn-Plan, Multi-Intent-Merge |
| **Domäne** | Indirekt (Antwort) | Nur über Front | `TvAgent`, `WeatherAgent`, … |
| **Curator** | Nein | Nein | Memory-Gate, Prune, Pack-Harvest |
| **Infrastruktur** | Nein | Nein | Router, TurnGate, BrainPicker, Sleep |

**Regel:** Nur **Front-Agent** darf `addMessage(assistant)` und TTS auslösen. Domänen-Agenten liefern `AgentResult { facts, tool, internalNote }`.

### 2.4 Autonomie-Stufen (wie im Reel)

| Stufe | Jarvis heute | Ziel 14.x |
|-------|--------------|-----------|
| **Parser** (deterministisch) | 52 Routen | Bleibt — Geräte/Write **immer** Parser-first |
| **Assisted** | LLM formuliert nach Tool | Domänen-Agent liefert Fakten, Front formuliert 1–2 Sätze |
| **LLM-Domäne** | Smalltalk, Lücken | Nur wenn kein Parser trifft; Director wählt **einen** Brain-Pfad |

Kein Agent bekommt standardmäßig **eigenes** Gemini — das wäre 52× Latenz. **Ein** Brain-Aufruf pro Turn, optional **interne** Hilfsläufe ohne LLM.

---

## 3. Abteilungen & Agenten-Katalog

Sieben **Cluster** (Reel-Analog), ~**52 Domänen-Agenten** + **12 interne**.

### 3.1 Cluster-Übersicht

| Cluster | Organ(e) | Domänen-Agenten (Route-ID) |
|---------|----------|----------------------------|
| **Geräte** | `hand` | `tv`, `fan`, `plug`, `device`, `amazon`, `app` |
| **Medien** | `mouth`, `hand` | `film` (+ TV-Apps über `tv`) |
| **Navigation** | `eye`, `hand` | `drive`, `maps`, `here`, `fuel`, `poi`, `transit`, `taxi`, `leave`, `blitzer`, `hud`, `trace` |
| **Alltag** | `memory`, `hand` | `calendar`, `alarm`, `timer`, `reminder`, `todo`, `brief`, `birthday`, `holiday`, `ferien`, `shopping`, `home`, `watch-price`, `chat-folder` |
| **Information** | `brain`, `eye` | `weather`, `news`, `outlook`, `search`, `warn`, `fx`, `sport`, `sky`, `nature`, `flights`, `food`, `library`, `law`, `haushalt`, `sensors`, `chess`, `digest` |
| **Gedächtnis & Lernen** | `memory`, `brain` | `memory`, `recall`, `teach`, `pack`, `research`* |
| **Werkstatt** | `pc_eye`, `pc_hand`, `eye` | `pc`, `eye`, `doc`, `desk` |
| **System** | `brain` | `backup`, `face`, `wont`, `identity`† |

\* `research` = Live-Lookup ohne festen Parser — bleibt Director-Pfad.  
† `identity`/`help`/`greeting` = Front-canned, kein separater LLM-Agent.

### 3.2 Interne Agenten (nie User-Chat)

| ID | Heutige Datei | Aufgabe |
|----|---------------|---------|
| `router` | `route-pick.ts`, `policy.ts`, `conflicts.ts` | Score, Margin, Konflikte |
| `curator` | `memory-gate.ts`, `sleep-memory.ts`, `knowledge-harvest.ts` | Wissen schreiben/verwerfen/verdichten |
| `recall-engine` | `retrieve.ts` | RRF, Alias, 1-Hop — **kein** pickRoute |
| `verify` | `action-fsm.ts` | Verified Actions, kein Fake-Execute |
| `turn-gate` | `turn-gate.ts` | Mutex, Dedup |
| `brain-picker` | `brain-pick.ts`, `brain.ts` | Heute: Gemini → Groq → 0,5B; ab **15.0**: [`BrainOrchestrator`](./63-next.md) Groq primär, Gemini Spezialist |
| `chain` | `chain.ts` | Multi-Intent Read/Write-Partition |
| `latency` | `latency.ts` | SLO, First-Token/Audio |
| `body-snap` | `body-snap.ts` | Organ-Status für Karte |
| `pending` | diverse `*-pending.ts` | Maps/PC/Taxi/Research FSM |
| `research-guard` | `research-parse.ts` | Quellen-Pflicht, kein Browser-Verweis |

### 3.3 Funktions-Erhalt (Pflicht)

**Keine Route-ID darf in 14.9 verschwinden.** Abnahme = heutige `test-prompts.mjs` (181 Chips) + `test:014` grün. Neue Tests pro Agent-Spec in `test:agents`.

Vollständige 1:1-Tabelle Route → Agent → Cluster → Organ: [`62-agent-catalog.md`](./62-agent-catalog.md).

---

## 4. Technisches Ziel-Design

### 4.1 AgentSpec (neue Single Source of Truth)

Ersetzt die Doppelpflege `route-pick` + `registry`:

```typescript
// frontend/src/engine/agents/types.ts (geplant)

export type AgentVisibility = 'user' | 'domain' | 'internal'
export type AgentAutonomy = 'parser' | 'assisted' | 'llm'

export type AgentSpec = {
  id: string                    // = route-pick id
  label: string                 // DE, UI + Karte
  department: DepartmentId
  organs: BodyOrgan[]
  visibility: AgentVisibility
  sideEffect: 'read' | 'write' | 'device' | 'none'
  autonomy: AgentAutonomy
  parse?: (ctx: RouteCtx) => Candidate | null
  execute: (ctx: RouteCtx) => Promise<AgentResult>
  promptSlice?: string          // Domänen-Regeln nur für LLM-Fallback
  goldPrompts?: string[]        // Test-Chips
}

export type AgentResult = {
  handled: boolean
  userFacts?: string            // Rohfakten für Front-Agent
  reply?: string                // nur wenn Director direkt durchreicht (Parser)
  tool?: ToolMeta
  lastTool?: string
  internal?: AgentTrace[]       // Debug / Agent Map
}

export type AgentTrace = {
  agentId: string
  phase: 'parse' | 'plan' | 'execute' | 'verify' | 'curator'
  ms: number
  ok: boolean
  detail?: string
}
```

### 4.2 AgentBus (In-Process, kein Microservice-Schwarm)

```typescript
// frontend/src/engine/agents/bus.ts (geplant)

// Synchron im WebView — kein WebSocket, kein 137-Prozess-Overhead.
agentBus.dispatch('tv', ctx) → AgentResult
agentBus.emit('curator.review', { write, agent: 'memory' })
director.runTurn(utterance) → { traces, merged, speak }
```

**Warum In-Process:** Jarvis läuft **auf dem Handy**; Reel-Optik ≠ 137 Cloud-Worker. Netzwerk-**Metapher** in UI und Code, **eine** Runtime.

### 4.3 Director (ersetzt Schritt für Schritt `chat.routeDeterministic`)

```text
1. turn-gate.begin
2. normalize + splitIntents
3. curator.preflight (Widerspruch? Dump? Gate?)
4. router.proposeAll → Kandidaten
5. policy.pick → ein oder mehrere Agenten (Chain)
6. parallel nur bei read-only + explizit erlaubt; sonst sequential
7. verify.wrap (device/write)
8. merge AgentResults → userFacts
9. wenn LLM nötig: brain **einmal** mit variablem Block + Domänen-slices — ab **15.0** [`BrainOrchestrator`](./63-next.md) (Groq chat, Gemini nur vision/deep)
10. front.formatReply (Jarvis-Stimme, 1–3 Sätze)
11. traces → Agent Map + Debug
```

**Geräte-Sicherheit:** `sideEffect: device|write` **darf nicht** allein vom LLM-Director ausgelöst werden — Parser + Verify bleiben Pflicht (V9-Hardening).

### 4.4 Haus-Gehirn (Shared Brain API)

```typescript
// frontend/src/engine/agents/brain-api.ts (geplant)

brain.read(query, { agentId, kinds, cap })   // gefiltertes retrieve
brain.proposeWrite(fact, { agentId, source }) // → curator entscheidet
brain.working(note, { agentId })              // rolling, max 8
```

**Curator-Agent** ist der **einzige** Schreib-Gatekeeper für Memory/Packs (heute schon implizit in `memory-gate.ts` — wird explizit).

### 4.5 Domänen-Agent (Wrap, kein Rewrite Tag 1)

Phase 1–3: **Thin Wrapper** um bestehende `handleX`:

```typescript
export const tvAgent: AgentSpec = {
  id: 'tv',
  department: 'geraete',
  organs: ['hand', 'mouth'],
  visibility: 'domain',
  sideEffect: 'device',
  autonomy: 'parser',
  parse: (ctx) => parseTvIntent(ctx.text) ? score(ctx.text, 0.06) : null,
  execute: async (ctx) => wrap(await handleTv(ctx.text)),
  promptSlice: 'Fernseher: WoL/Tizen wirklich. Kein Fake-an.',
}
```

Später optional: Logik **in** Agent-Modul verschieben — **kein** Big-Bang.

---

## 5. Körper → Agenten-Karte (UI-Rework)

### 5.1 Zielbild (Reel-like)

```text
              [ Geräte ]     [ Medien ]
                   \           /
                    \         /
         [Navigation]—[ HAUS-GEHIRN ]—[ Alltag ]
                    /         \
                   /           \
            [Information]   [Werkstatt]
```

- **Mitte:** `brain` — pulsierend wenn Curator/Retrieve aktiv.
- **Zweig:** Cluster-Knoten (7), aufklappbar in `BodyTree`.
- **Blatt:** Domänen-Agent (Icon + Label DE).
- **Kante animiert:** Director-Pfad `brain → cluster → agent` während Turn (800 ms Pulse).
- **Klick auf Agent:** wie Reel „Skill öffnen“ — Chat-Prompt aus `goldPrompts[0]` oder Read-only Status.
- **Interne Agenten:** standard **aus**; Debug-Einstellung „Agenten-Netz zeigen“ → graue Geisterknoten.

### 5.2 Dateien (geplant)

| Datei | Änderung |
|-------|----------|
| `BodySchema.tsx` | Cluster-Layout, aktive Kante, Gehirn-Hub größer |
| `body-graph.ts` | `AGENT_CATALOG` statt nur `SKILL_CATALOG` (52 Einträge, capped display) |
| `BodyTree.tsx` | Cluster → Agents → optional Wissen |
| `agent-map.ts` | `activeTrace`, `pulseAgent(id)` aus Director |
| `Lage.tsx` | Tab „Agenten“ neben Körper (oder Körper = Agenten) |

### 5.3 Was bleibt

- Organe als **Sensorik-Metapher** (Ohr=Wake, Mund=Stimme) — nicht wegwerfen.
- Globe/Tiles unverändert — Agenten-Karte = **Body-View-Evolution**, kein Ersatz der Kugel.

---

## 6. Won’t & Grenzen (14.0)

| Won’t | Warum |
|-------|-------|
| 137× Gemini pro Turn | Handy, Latenz, Kosten |
| Cloud-Agent-Farm / Pipecat / LiveKit | On-Device-Produkt |
| Embedding-Router (`e5` pickRoute) | [`56-next.md`](./56-next.md) Freeze |
| Qdrant / HNSW / ColPali | Freeze |
| Selbst-modifizierender Code (ADAS) | Sicherheit |
| Zweite Nutzer-Persona pro Agent | Jarvis/Friday bleiben Front |
| Funktion streichen „weil Agenten“ | Parity-Tests |

| **Neu erlaubt** (Abkehr von altem Won’t) | Bedingung |
|------------------------------------------|-----------|
| Multi-Agent **Architektur** | In-Process, tracebar |
| Interne Agenten ohne UI | Curator, Router, Verify |
| Domänen-`promptSlice` | Ein Brain-Call, modularer Prompt |
| Agenten-Karte klickbar | Read-only oder Parser-Prompt |

---

## 7. Migrationsplan — Sprints 226–235

Eigene Schiene **`14.0`**. Kein Diebstahl von `13.44`. Rückschritte erlaubt in 226–228 (Refactor), **Parity ab 229** Pflicht.

| Sprint | Version | Thema | Must? | Risiko |
|--------|---------|-------|-------|--------|
| **226** | `14.0.0` | Leit + `AgentSpec` + Katalog | Must | Docs only |
| **227** | `14.1.0` | Unified Catalog (route-pick ≡ registry) | Must | Mittel — viele Dateien |
| **228** | `14.2.0` | `AgentBus` + `AgentRunner` + Traces | Must | Niedrig — Wrapper |
| **229** | `14.3.0` | `Director` ersetzt `routeRegistry`-Shell | Must | Mittel — `chat.ts` |
| **230** | `14.4.0` | **Curator-Agent** (Gate/Prune/Harvest) | Must | Niedrig |
| **231** | `14.5.0` | Domänen-Batch A: Geräte + Medien | Must | Niedrig |
| **232** | `14.6.0` | Domänen-Batch B: Alltag + Navigation | Must | Niedrig |
| **233** | `14.7.0` | Domänen-Batch C: Info + Werkstatt + Rest | Must | Mittel |
| **234** | `14.8.0` | **Agenten-Karte** (Körper-UI) | Must | UI — sichtbar |
| **235** | `14.9.0` | Gold Parity + Sideload `14.9.0` | Must | APK |

Detail Agenten-Netzwerk: [`sprints/sprint-226.md`](./sprints/sprint-226.md) … [`sprint-235.md`](./sprints/sprint-235.md).

### 7.0 Folgeschien **Dual Brain** (15.0)

Nach **229 Director** — baut auf **einem Brain-Call** + `AgentResult.userFacts` auf. Vollständig: [`63-next.md`](./63-next.md).

| Sprint | Version | Thema | Must? |
|--------|---------|-------|-------|
| **236** | `15.0.0` | Groq primär + `brain-orchestrator` | Must |
| **237** | `15.1.0` | Micro-LLM (clarify, merge, research-lite) + Shadow | Must |
| **238** | `15.2.0` | Gold Latenz/Qualität + Sideload `15.2.0` | Must |

Detail: [`sprint-236.md`](./sprints/sprint-236.md) … [`sprint-238.md`](./sprints/sprint-238.md).

**Pull-Reihenfolge:** 226–235 (Agenten-Netzwerk) → **236–238 (Dual Brain)**. PO Handy 178 parallel möglich.

### 7.1 Phasen-Logik

```text
226–227  Fundament (Spec, ein Register)
228–229  Runtime (Bus, Director) — Feature-Flag agent_network_v2
230       Wissen (Curator explizit)
231–233  Alle handleX → AgentSpec (kein Verhalten ändern)
234       UI = Reel-Moment
235       Ship
```

### 7.2 Feature-Flag

`settings.agent_network_v2: boolean` — Default `false` bis 229 grün, dann Default `true` in 235. Rollback ohne APK-Neuinstall.

### 7.3 Temporäre Rückschritte (ehrlich)

| Phase | Möglicher Rückschritt |
|-------|------------------------|
| 227 | Kurz **zwei** Register parallel — Tests müssen beide pflegen |
| 229 | Director-Bug → Flag aus, alter `routeRegistry`-Pfad |
| 234 | Alte Körper-Ansicht per Flag (`body_view=classic`) |
| 233 | Einzelne Domäne regress → nur diesen Agent auf Legacy-Wrap |

Langfristig: **klarer** Debug (Traces), **schnellere** Domänen-Erweiterung (ein Eintrag in Catalog), **bessere** Karte — kein langsameres Handy.

---

## 8. Gold (nach Execute 14.9)

| ID | Soll |
|----|------|
| **A1** | `test:prompts` 181/181 — identische Routen wie 13.44 |
| **A2** | `test:014` grün |
| **A3** | `test:agents` — jeder `AgentSpec.id` hat parse+execute Smoke |
| **A4** | Turn mit „Fernseher an“ — Trace: `router → tv → verify → front` |
| **A5** | Memory-Write — Trace enthält `curator` vor Persist |
| **A6** | Agenten-Karte: Klick `Wetter` → Chip / Parser trifft |
| **A7** | Kein interner Agent schreibt `addMessage(assistant)` |
| **A8** | Debug-Panel: Agent-Trace pro Turn exportierbar |

---

## 9. Abnahme & PO

1. **226:** Leit + Katalog reviewed.
2. **229:** Flag an — 1 Woche Dev-Alltag, Parity grün.
3. **234:** Körper/Agenten-Karte auf Handy — „Fernseher“-Zweig sichtbar pulsiert bei TV-Turn.
4. **235:** Sideload `14.9.0`, Docs CODE, [`42-planned.md`](./42-planned.md) aktualisiert.

PO Handy (178) bleibt **parallel** — Agenten-Netzwerk ersetzt nicht Gerät-PO.

---

## 10. Referenzen

- Reel: https://www.instagram.com/reel/DbYh2P-MQnj/
- Ist-Audit: [`51-phase0-audit.md`](./51-phase0-audit.md)
- Register: `frontend/src/engine/route-pick.ts`, `registry.ts`, `chat.ts`
- Körper: [`60-next.md`](./60-next.md), `BodySchema.tsx`, `body-graph.ts`
- Alter Won’t: [`56-next.md`](./56-next.md) §1 — wird in 14.0 durch **§6** ersetzt, nicht gelöscht (Historie)
- Agent-Katalog: [`62-agent-catalog.md`](./62-agent-catalog.md)
- Dual Brain: [`63-next.md`](./63-next.md)

Sprints Agenten-Netzwerk: [`sprints/sprint-226.md`](./sprints/sprint-226.md)–[`sprint-235.md`](./sprints/sprint-235.md).  
Sprints Dual Brain: [`sprints/sprint-236.md`](./sprints/sprint-236.md)–[`sprint-238.md`](./sprints/sprint-238.md).
