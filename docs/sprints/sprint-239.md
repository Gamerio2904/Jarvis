# Sprint 239 — Flüssige Lage-GUI + Kalender + Agent-Status

**Version:** `15.2.0` (versionCode `150200`)  
**Basis:** `15.1.0` Agenten-Netzwerk  
**Plan:** [`64-next.md`](../64-next.md)

## Ziel

GUI aus User-Screenshots und Reel-Analyse flüssig machen: keine falschen Overlays, sichtbar welcher Agent arbeitet, Kalender bedienbar, Kugel-Steuerung natürlich.

## Lieferumfang

| ID | Task | Status |
|----|------|--------|
| S239-1 | `AgentStatusBar` in Lage-Header | CODE |
| S239-2 | Composer/WakeBubble aus bei Lage-Szene, Kalender, Settings, Voice | CODE |
| S239-3 | `AgentMapCanvas` idle rAF (kick pattern) | CODE |
| S239-4 | `GlobeView`: Y-Achse, Gradient-Cache, Ring-Decimation, idle rAF | CODE |
| S239-5 | Kalender: z-index, Anlegen-Button, Grid aspect-ratio, Mobile-Form | CODE |
| S239-6 | CSS: lage-scene overflow, agent-status-bar, split containment | CODE |
| S239-7 | Docs `64-next.md`, CHANGELOG | CODE |

## Tests

```bash
cd frontend && npm run build
npm run test:prompts
npm run test:agents
npm run test:rest-final
```

Manuell: Kalender öffnen (kein Composer), Lage Körper (Status-Zeile), Kugel hoch/runter = Erde folgt Finger.

## Nicht in 239

- PC-Dashboard Reel-Layout → Sprint 240
- WebGL-Kugel → Sprint 241
- Persona „Timon“ statt Jarvis → separates Prompt-Thema
