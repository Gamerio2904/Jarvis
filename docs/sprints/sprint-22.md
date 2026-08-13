# Sprint 22 — Assist Clarity (UX & Führung)

| Feld | Wert |
|------|------|
| Status | **PLANNED** |
| Priorität | **MINOR** — neues nutzbares Fähigkeitsniveau nach Quality-Patches |
| Ziel-Version | **`0.8.0`** |
| Quelle | Deep-Test „Ergänzungen“ + Product-Richtung Assist (früher Sprint 21) |

## Ziel

Jarvis wird im Alltag **führbarer**: klare Fähigkeiten, gezielte Rückfragen bei vagen Tasks, spürbares Streaming, bessere Research-/Memory-Rückmeldung — ohne neue Cloud-Tools.

## Must

| ID | Story | Done wenn |
|----|-------|-----------|
| A1 | **Clarify-First (Tasks)** — bei vagen Aufträgen eine kurze Rückfrage **oder** Annahmen nennen, dann konkreter Mini-Plan | „Mach mir einen Plan für morgen“ → 1 Clarify oder Annahmen+3 Schritte |
| A2 | **Fähigkeiten-Karte** — `/hilfe` (Egg + Settings-Hinweis) listet Memory, Research (Opt-in), Eggs, Limits | In &lt;10s klar was geht; baut auf Capabilities-Fakt aus `0.7.2` auf |
| A3 | **Streaming-Wahrnehmung** — Tokens/Partial spürbar; Loading nicht „tot“ &gt;~3s ohne Feedback | UI zeigt Schreiben/Stream; Abbruch/Fehler klar |
| A4 | **Research-UI-Echo** — ausgehende Query + Status (laden / Quellen / leer / Timeout) | Nutzer sieht was gesucht wurde; Privacy-Note bleibt |
| A5 | **Memory Soft-Confirm** — Soft-Harvest / unsicherer Widerspruch → kurze Bestätigung | „So merken?“; ablehnbar; kein False-Confirm |
| A6 | Version `0.8.0` + Eval `scripts/eval_0_8_0.py` | Suite grün; Health/UI `0.8.0` |

## Should

| ID | Inhalt |
|----|--------|
| A7 | Conversation-Scoped Delight-State persistiert (Mood, Joke-Pin-Link) — falls nicht schon in `0.7.3` |
| A8 | Audit-Link in UI (Research-Quellen) |
| A9 | Latency-Budget-Hinweis in Settings (Heavy=Default → Routing wirkungslos) |
| A10 | Scorecard Assist: Clarify-Rate, Stream-TTFT, Research-Empty-UX |

## Won’t

- Kalender/Mail/Smart-Home-Tools
- Phase 2 Auth/Handy, NAS `1.0.0`, TTS
- Neue Provider jenseits Allowlist

## Abhängigkeiten

- Quality-Patches `0.7.1`–`0.7.3` empfohlen vorher
- Research + Memory + Delight aus `0.4`–`0.7` vorhanden

## Exit / Abnahme

PO: Vage Tasks geführt; `/hilfe` klar; Streaming spürbar; Research/Memory Feedback ehrlich. Tag **`v0.8.0`**.

## Danach (nicht Teil dieses Sprints)

- Optional **Sprint 23 / `0.8.1`** Hotfix nach Deep-Test von `0.8.0`
- Phase 2 Privat-Handy / NAS `1.0.0` — **PO-Kommando**
