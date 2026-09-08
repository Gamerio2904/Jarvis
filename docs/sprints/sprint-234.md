# Sprint 234 — Agenten-Karte UI (`14.8.0`) **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** Must |
| Ziel-Version | **`14.8.0`** |
| Quelle | [`62-next.md`](../62-next.md) |

## Ziel

Körper-View → **Agenten-Karte** (Reel-like): Haus-Gehirn Mitte, 7 Cluster, Domänen-Knoten klickbar, aktive Kante bei Turn. Flag `body_view=agents`.

## DoD

- [x] `BodySchema` Cluster-Layout + Pulse entlang Pfad
- [x] `BodyTree` Cluster → Agent → Wissen
- [x] Klick Agent → Chat-Prompt / Status
- [x] Interne Agenten nur im Debug sichtbar
- [x] Reduced motion respektiert
