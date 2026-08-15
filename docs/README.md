# Jarvis — Planungsdokumente

Dieses Verzeichnis enthält die **agile Projektplanung** für Jarvis.

**Aktueller Produktstand:** On-Device Handy **`0.13.1`** — offline nach dem Modell-Download. Kein Server, keine NAS. Kanonisch: [`13-on-device.md`](./13-on-device.md).

## Lesereihenfolge

| Nr. | Dokument | Zweck |
|-----|----------|--------|
| 01 | [Vision & Produktziele](./01-vision.md) | Wozu Jarvis existiert, Ziele, Nicht-Ziele |
| 02 | [Architektur](./02-architecture.md) | On-Device-Design, UI-Richtung |
| 03 | [Agiler Prozess (Scrum-lite)](./03-agile-process.md) | Rollen, Sprints, DoR/DoD |
| 04 | [Roadmap & Phasen](./04-roadmap-phases.md) | Ist-Stand + Parking |
| 05 | [Product Backlog](./05-product-backlog.md) | Epics & User Stories |
| 06 | [MVP & Sprint-Plan](./06-mvp-sprint-plan.md) | Historischer Sprint-Überblick |
| 07 | [Persona Jarvis](./07-persona.md) | Charakter, Stil, Beispiele |
| 08 | [Offene Fragen](./08-open-questions.md) | Restlücken |
| 09 | [Versionierung](./09-versioning.md) | SemVer, Sprint ↔ Version |
| 10 | [Intelligence Capabilities](./10-intelligence-capabilities.md) | Memory, Tools, historischer Router/Research |
| 11 | [Delight & Settings](./11-delight-and-settings.md) | Momente, Jokes, Sound, Eggs, Settings-UX |
| 12 | [NAS & APK](./12-nas-apk.md) | historisch / superseded |
| 13 | [On-Device](./13-on-device.md) | **aktuell** — Handy-LLM `0.13.1` |
| — | [APK](./apk.md) | Sideload |

Sprints (numerisch = Lieferreihenfolge, ältere = Historie): [`sprints/README.md`](./sprints/README.md)

## Status (Kurz)

| Sprint | Version | Status |
|--------|---------|--------|
| 0 | — | **DONE** |
| 1–33 | `0.1.0`–`0.9.5` | **HISTORISCH** — alter PC/Ollama-Stack; Kern (Chat, Memory, Tools, UI) in `0.13.x` portiert |
| 34–39 | `0.10.0`–`0.10.5` | **SUPERSEDED** — NAS/Compose entfallen |
| 40–42 | `0.11.0`–`0.11.2` | **PARKED** — Samsung-TV |
| 43 | `0.12.0` | **SUPERSEDED** — NAS-Proxy |
| 44 | `0.13.0` | **CODE** — On-Device Handy |
| 45 | `0.13.1` | **CODE** — Modell-Download Hotfix (**aktuell**) |

**Als Nächstes:** TTS / `1.0.0` nur auf PO-Kommando. Kein NAS, kein Research-Netz, kein TV ohne neue Entscheidung.
