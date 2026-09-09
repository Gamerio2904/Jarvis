# 64 — PC-Dashboard (Reel-Stil) + flüssige Lage-GUI **PLAN** (`15.3.0`)

PO 2026-09-08: Instagram-Reel [Dc_qazGKcQ8](https://www.instagram.com/reel/Dc_qazGKcQ8/) — Jarvis am PC installiert/updated Spiele per Sprache, Iron-Man-Ästhetik, Community-Plugin geplant. Ziel: **gleiche Fluidität auf dem PC-Doc** wie im Reel, plus **sichtbar welcher Agent gerade arbeitet** (Körper/Lage).

**App-Stand:** Sprint **239–241** (`15.3.0`). GUI-Fixes **CODE**. PC-Dashboard **CODE** 240. Lage Phase-2 **CODE** 241.

Gold: `test:prompts` + `test:pc` + `npm run build` + manuell Lage/Kalender/Kugel auf Handy.

---

## 0. Reel → Jarvis-Mapping

| Reel | Jarvis heute | Ziel |
|------|--------------|------|
| Sprache: „Installiere/update Spiel X“ | `pc.ts` Launch/Steam/Epic-Pfade, `PcAgent` | **Live-Aktionsleiste** am PC: Schritt, Agent, ETA |
| Kaputtes Game-Updater repariert | `pc-cap.ts`, Verify-Pack | Status „Werkstatt · PC-Hand“ in AgentStatusBar |
| Iron-Man HUD | Lage Körper/Kugel, grünes OLED-Theme | **Desktop-Breite**: Agent-Graph links, Chat/Aktion rechts |
| Community-Plugin | — | **240:** optional `jarvis-pc-plugin` (Steam/Epic Hooks) — nur PLAN |

---

## 1. Sprint 239 — CODE (`15.2.0`)

| Fix | Ursache | Änderung |
|-----|---------|----------|
| Kalender unter Composer | `cal-view` z-index 6, Composer immer sichtbar | z-index 14; Composer aus bei Kalender/Lage-Szene |
| Lage-Overlap | globaler Composer + WakeBubble | `App.tsx`: Composer nur im Chat |
| Agent-Karte laggy | 30 fps rAF idle | `AgentMapCanvas` kick/idle wie `GlobeView` |
| Kugel laggy | 10k Ring-Punkte, Gradient/frame | Gradient-Cache, Ring-Decimation, idle rAF |
| Kugel Y invertiert | `dpitch` Vorzeichen | Finger folgt Oberfläche (Maps-Earth) |
| Kein Agent-Status | nur grüne Knoten | `AgentStatusBar`: Agent · Domäne · Trace |
| Kalender schwach | ghost-btn, Grid | Grüner „Anlegen“, aspect-ratio Zellen, Mobile-Form |

---

## 2. Sprint 240 — PC-Dashboard (Reel)

### 2.1 Layout (Desktop ≥900px)

```text
┌─────────────────────────────────────────────────────────┐
│ JARVIS > PC · Live                          Akku · Uhr  │
├──────────────────────┬──────────────────────────────────┤
│ AgentMap (read-only) │ Aktion-Stream (Director traces)  │
│ + AgentStatusBar     │ „Geräte · Steam-Update 47%“      │
├──────────────────────┴──────────────────────────────────┤
│ Chat / Spracheingabe                                    │
└─────────────────────────────────────────────────────────┘
```

- Wiederverwendung: `AgentMapCanvas`, `AgentStatusBar`, `trace-store`.
- Neue Komponente: `PcActionStream.tsx` — letzte 5 `execute`-Traces + PC-Verify (`packVerified`).

### 2.2 Engine

- `engine/pc.ts`: strukturierte Events `{ phase, agentId, action, pct? }` → Bus (wie AgentRunner).
- `PcLiveDock` (bestehend): RTC-JPEG + Action-Stream untereinander.
- Default Desktop: `body_view: agents`, Lage wide split (bereits `lageWide`).

### 2.3 Akzeptanz

- Sprache „Starte Steam“ → Status „Werkstatt · PC-Hand · launch_confirm“ sichtbar <200 ms.
- Kein 30-fps-Canvas wenn PC idle.
- Overlay: PC-Panel nie unter Nav-Island.

---

## 3. Sprint 241 — Lage Phase-2 Härtung

- **Kacheln:** lazy `fetchHudSnap` pro sichtbarer Zelle (IntersectionObserver).
- **Körper classic:** `BodySchema` idle rAF (wie AgentMap).
- **Kugel:** optional WebGL-Fallback wenn Canvas p95 >16 ms (Flag `globe_webgl`).
- **Copy:** Lage-Hints kurz, ein Satz pro Tab.

---

## 4. Abgleich Screenshots ↔ Code

| Screenshot | Symptom | 239-Fix |
|------------|---------|---------|
| Kalender + Composer | Termin-Grid verdeckt | Composer hidden, cal z-index |
| Körper + „6 Agenten“ unter Composer | Tree bleed | lage-scene overflow, split grid |
| Kugel hoch/runter falsch | invertierte pitch | GlobeView dpitch |
| Nur „Jarvis“-Pille | kein Agent-Detail | AgentStatusBar |

---

## 5. Rollout

1. **239** merge → `15.2.0` APK
2. **240** PC-Dashboard hinter `pc_dashboard_v2` (default off, Desktop on)
3. **241** Performance Phase-2

Siehe [`sprints/sprint-239.md`](./sprints/sprint-239.md).
