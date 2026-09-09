# Sprint 247 — Antwort-Qualität

**Version:** `15.8.0` (versionCode `150800`)  
**Plan:** [`65-next.md`](../65-next.md) §7

## Ziel

Screenshot-Bugs in Antwortlogik beheben: Smalltalk bekommt Fachwissen-Antwort, Timer „20: 48“, Wetter repetitiv, Research abgeschnitten.

## Screenshot ↔ Fix

| Screenshot | Problem | Fix |
|------------|---------|-----|
| „Wie gehts dir?“ → „Ort im Textblock…“ | Falscher Agent / leerer Knowledge-Block | `director.ts`, `chat.ts` |
| „20: 48 Uhr“ | Leerzeichen nach `:` | `timer-announce.ts`, `formatDue` |
| Wetter immer Hauptstraße 5 | Demo-Adresse statt GPS | `last_place`, `briefPlace` |
| Kuchenrezept abgeschnitten | Composer-Overlap | padding (242) + scroll |
| `/hilfe` + Wetter same turn | Split-Intent Reihenfolge | `split-intents.ts` |

## Lieferumfang

| ID | Task | Datei | Status |
|----|------|-------|--------|
| S247-1 | Director: `identity`/`chat` vor `search` bei Smalltalk | `director.ts` | PLAN |
| S247-2 | Knowledge-Block leer → nicht in LLM-Prompt | `chat.ts`, `persona.ts` | PLAN |
| S247-3 | Timer Format ohne `: ` Leerzeichen | `timer-announce.ts` | PLAN |
| S247-4 | Wetter: frischer GPS → „bei Ihnen“ | `weather` / `briefPlace` | PLAN |
| S247-5 | Split-Intents: Hilfe vs. Wetter Reihenfolge | `split-intents.ts` | PLAN |
| S247-6 | Prompt-Tests für Smalltalk + Timer | `test:prompts` | PLAN |
| S247-7 | Header-Titel nicht abschneiden (Globus…) | `App.tsx`, CSS | PLAN |

## Gold

```bash
npm run test:prompts   # 181+ grün, neue Cases
npm run test:rest-final
```

Manuell:
- „Naja wie gehts dir so?“ → Smalltalk, kein Fachwissen
- „Timer 1 Minute“ → „läuft bis HH:MM“ ohne Leerzeichen
- „Was soll ich anziehen?“ → Wetter ohne falschen Ort-Block

## Nicht in 247

- Deep Research Qualität → Hirn-Sprint
- Persona Timon vs. Jarvis → separates Thema
