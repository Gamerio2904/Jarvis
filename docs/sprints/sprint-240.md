# Sprint 240 — PC-Dashboard (Reel-Stil)

**Version:** `15.3.0` (with 241)  
**Plan:** [`64-next.md`](../64-next.md) §2

## Ziel

Desktop-PC gepairt → Iron-Man-HUD: Agent-Karte + Live-Aktionsstream wie im Reel.

## Lieferumfang

| ID | Task | Status |
|----|------|--------|
| S240-1 | `engine/pc-events.ts` — Event-Bus + `pcDashboardEnabled()` | CODE |
| S240-2 | `pc.ts` — Events bei launch/confirm/done | CODE |
| S240-3 | `PcActionStream.tsx` — letzte 5 PC + Agent-Traces | CODE |
| S240-4 | `PcDashboard.tsx` — AgentMap + Status + Stream | CODE |
| S240-5 | `App.tsx` — Dashboard über Composer (Desktop auto) | CODE |
| S240-6 | CSS `.pc-dashboard*` | CODE |

## Akzeptanz

- PC gepairt + Desktop ≥900px → Dashboard sichtbar
- „Starte Steam“ → Stream zeigt `execute · launch` <1 s
- Idle: AgentMap stoppt rAF (239)

## Settings

- `pc_dashboard_v2`: `null` auto (Desktop an), `true` force, `false` off
