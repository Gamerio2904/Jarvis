# Sprint 21 — Assist Clarity (UX & Führung)

| Feld | Wert |
|------|------|
| Status | **PLANNED** |
| Priorität | **MINOR** — neues nutzbares Fähigkeitsniveau nach Quality-Patches |
| Ziel-Version | **`0.8.0`** |
| Quelle | Deep-Test „Ergänzungen“ + Product-Richtung Assist über reines Smalltalk hinaus |

## Ziel

Jarvis wird im Alltag **führbarer**: klare Fähigkeiten, gezielte Rückfragen bei vagen Tasks, spürbares Streaming, bessere Research-/Memory-Rückmeldung — ohne neue Cloud-Tools.

## Must

| ID | Story | Done wenn |
|----|-------|-----------|
| A1 | **Clarify-First (Tasks)** — bei vagen Aufträgen eine kurze Rückfrage **oder** Annahmen nennen, dann konkreter Mini-Plan | „Mach mir einen Plan für morgen“ → 1 Clarify oder Annahmen+3 Schritte, kein leeres Meta-Gerüst |
| A2 | **Fähigkeiten-Karte** — `/hilfe` (oder Settings-Abschnitt + Egg) listet: Memory, Research (Opt-in), Eggs, Limits | Nutzer findet in &lt;10s was geht / was nicht; Guards respektieren Egg |
| A3 | **Streaming-Wahrnehmung** — Tokens/Partial sichtbar spürbar; Loading nicht „tot“ für &gt;~3s ohne Feedback | UI zeigt Schreiben/Stream; Abbruch/Fehler klar |
| A4 | **Research-UI-Echo** — ausgehende Query + Status (laden / Quellen / leer / Timeout) in Badge oder Message-Meta | Nutzer sieht was gesucht wurde; Privacy-Note bleibt |
| A5 | **Memory Soft-Confirm** — bei Soft-Harvest / unsicherem Widerspruch kurze Bestätigung statt stiller Speicherung | „So merken?“-Pfad; ablehnbar; kein False-Confirm |
| A6 | Version `0.8.0` + Eval `scripts/eval_0_8_0.py` | Suite grün; Health/UI `0.8.0` |

## Should

| ID | Inhalt |
|----|--------|
| A7 | Conversation-Scoped Delight-State in Persistenz (Mood, letzter Joke-Pin-Link) |
| A8 | Audit-Link in UI (Research-Quellen nachschlagen) |
| A9 | Latency-Budget-Hinweis in Settings (nur Info: Heavy=Default → Routing wirkungslos) |
| A10 | Scorecard Assist: Clarify-Rate, Stream-TTFT, Research-Empty-UX |

## Won’t

- Kalender/Mail/Smart-Home-Tools
- Phase 2 Auth/Handy, NAS `1.0.0`, TTS
- Neue Provider jenseits Allowlist

## Abhängigkeiten

- Quality Hotfix + Polish (`0.7.1`, `0.7.2`) empfohlen vorher — sonst Clarify/Streaming auf wackliger Guard-Basis
- Research + Memory + Delight aus `0.4`–`0.7` vorhanden

## Exit / Abnahme

PO: Vage Tasks werden geführt; `/hilfe` klar; Streaming spürbar; Research/Memory Feedback ehrlich. Tag **`v0.8.0`**.

## Danach (nicht Teil dieses Sprints)

- Optional **`0.8.1`** Hotfix nach Deep-Test von `0.8.0`
- Parallel/als Nächstes laut Roadmap: Phase 2 Privat-Handy oder weitere Assist-Tools — **PO-Kommando**
