# Jarvis — Planungsdokumente

Dieses Verzeichnis enthält die **agile Projektplanung** für Jarvis.  
Umsetzung (Code) startet erst, wenn die offenen Punkte soweit geklärt sind, dass Sprint 1 greifbar ist.

## Lesereihenfolge

| Nr. | Dokument | Zweck |
|-----|----------|--------|
| 01 | [Vision & Produktziele](./01-vision.md) | Wozu Jarvis existiert, Ziele, Nicht-Ziele |
| 02 | [Architektur](./02-architecture.md) | Lokales Design, UI-Richtung, Kontext-Stufen |
| 03 | [Agiler Prozess (Scrum-lite)](./03-agile-process.md) | Rollen, Sprints, DoR/DoD |
| 04 | [Roadmap & Phasen](./04-roadmap-phases.md) | Phase 0 → 5+ |
| 05 | [Product Backlog](./05-product-backlog.md) | Epics & User Stories |
| 06 | [MVP & Sprint-Plan](./06-mvp-sprint-plan.md) | MVP v0.1, Sprint 0/1 |
| 07 | [Persona Jarvis](./07-persona.md) | Charakter, Stil, Beispiele |
| 08 | [Offene Fragen](./08-open-questions.md) | Restlücken |
| 09 | [Versionierung](./09-versioning.md) | SemVer, Sprint ↔ Version |

## Kurzfassung

- **Produkt:** Privater Personal Assistant „Jarvis“ — nur für dich, nicht öffentlich.
- **Gefühl:** Chat-Mensch (Typ A), Text zuerst.
- **Technik-Design:** Lokale KI (Variante 3); später NAS für 24/7; TTS später auf Kommando.
- **Erster Nutzen:** Smalltalk-MVP.
- **Methode:** Scrum-lite (1-Personen-Produkt + AI-Dev).

## Status

| Bereich | Status |
|---------|--------|
| Produktvision | Festgelegt |
| Architektur-Richtung | Festgelegt (lokal) |
| Agiler Rahmen | Festgelegt |
| Persona-Kern | Gesetzt inkl. Stil-Anker; **Anti-Template / Variation Pflicht** |
| Hardware | Windows / 16 GB / RTX 3060 — **~12 GB** VRAM Standard |
| Stack / UI | Ollama; Web; **Spotify dunkel** + ChatGPT-Layout; Motion light→GUI-Update |
| Chat / Memory | Mehr-Chat-Zielbild; MVP In-Chat+Reopen; später **max. Gedächtnis** |
| Versionen | `0.1.0` = MVP; `0.3.0` = nächstes MINOR (GUI); `1.0.0` = NAS |
| Sprint 0 | **DONE** |
| Sprint 1 | **READY FOR REVIEW** → `0.1.0` |
| Sprint 2 | **READY FOR REVIEW** → `0.1.1` Must-Fixes |
| Sprint 3 | **READY FOR REVIEW** → `0.2.0` |
| Sprint 4 | **READY FOR REVIEW** → `0.2.1` Guard Hardening |
| Sprint 5 | **READY FOR REVIEW** → `0.2.2` Charakter-Feinschliff |
| Sprint 6 | **READY FOR REVIEW** → `0.3.0` GUI Premium-Motion |
