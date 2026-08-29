# Sprint 34 — NAS Core

| Feld | Wert |
|------|------|
| Status | **PLANNED** |
| Priorität | **MINOR** — neues nutzbares Fähigkeitsniveau (`0.10.0`) |
| Ziel-Version | **`0.10.0`** |
| Quelle | PO: `0.10`-Reihe = NAS 24/7 inkl. APK; TV nach `0.11` |

## Ziel

Jarvis läuft als **Container-Stack** (Backend + Frontend-Static + Ollama) mit Persistenz und Autostart — so, dass ein NAS/Mini-Server ihn nach Reboot wieder hochfährt. Desktop-Windows bleibt parallel möglich.

## Must

| ID | Story | Done wenn |
|----|-------|-----------|
| N1 | **Compose-Stack** — `deploy/docker-compose.yml`: `backend`, `frontend` (nginx/static), `ollama`; internes Netz; `restart: unless-stopped` | `docker compose up -d` startet alle drei; `/health` antwortet |
| N2 | **Volumes** — Chats/Memory/Settings (`backend/data`, `backend/config`) + Ollama-Modelle persistieren | Reboot: Gespräche und Modell noch da |
| N3 | **Modell-Pfad** — Default auf NAS ohne GPU: `qwen2.5:3b`; mit GPU optional `qwen2.5:7b` (dokumentiert) | Doku sagt klar, welches Modell wann |
| N4 | **Deploy-Doku** — `docs/deploy-nas.md`: Ports, Volumes, erstes `ollama pull`, LAN vs. localhost | PO kann Stack ohne Dev-Chat starten |
| N5 | Version `0.10.0` + Smoke `scripts/smoke_0_10_0.py` (Compose-Datei gültig, Health-Schema) | Suite grün ohne echtes NAS in CI |

## Should

| ID | Inhalt |
|----|--------|
| N6 | `.env.example` für Host-Bind, Modellname, Datenpfade |
| N7 | Ollama nur intern (11434 nicht ins LAN exposen) |

## Won’t

- Owner-Auth / Token (Sprint 36 / `0.10.2`)
- Android-APK (Sprint 37+)
- Samsung-TV / Smart-Home (`0.11.x`)
- Öffentliches Internet / Port-Forward ohne Auth
- Play Store, iOS, TTS
- NAS-Hersteller-UI (Synology-Paket o.Ä.) — generic Docker reicht

## Abhängigkeiten

- Sprint 33 / `0.9.5` vorher (Tools-Hygiene abgeschlossen)
- Docker auf Zielmaschine (NAS oder Linux-Mini)

## Architektur-Skizze (v1)

```text
[LAN]
   │
   ▼
[frontend :80]  static Vite-Build
   │  /api →
[backend :8000]  Persona, Memory, Tools, SQLite
   │
[ollama :11434]  nur compose-intern
   │
[volumes]  data/ + ollama-models
```

**24/7-Regel:** Das Denkmodell läuft auf der NAS-Maschine. PC-only-Ollama (RTX 3060) ist kein NAS-Alltag — höchstens Dev.

## Exit / Abnahme

PO: Stack überlebt Reboot; Chat im Browser gegen NAS-IP (noch ohne Token). Tag **`v0.10.0`**.

## Danach

- Sprint 35 / `0.10.1` NAS Hotfix
- APK erst ab Sprint 37 (nach Auth)
