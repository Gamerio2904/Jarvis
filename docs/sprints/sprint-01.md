# Sprint 01 — Local Smalltalk MVP

| Feld | Wert |
|------|------|
| Status | **READY FOR REVIEW** (PO-Abnahme offen) |
| Ziel-Version | `0.1.0` |
| Start | 2026-08-11 |

## Ziel

Lokal im Browser mit Jarvis smalltalken — Persona, Gesprächskontext, speicherbare Chats, Web-UI (Spotify dunkel + ChatGPT-Layout), Motion light, lebendige Antworten.

## Scope

### Must
- [x] S1.1 Ollama läuft
- [x] S1.2 Modell gewählt (`qwen2.5:3b` Default / `qwen2.5:7b` empfohlen für RTX 3060)
- [x] S2.1 Chat Request/Response
- [x] S2.2 Persona aktiv (`backend/config/persona.md`)
- [x] S2.3 Gesprächskontext (letzte N Messages)
- [x] S3.1 Browser-Chat-UI

### Should
- [x] S2.4 Persona per Config
- [x] S3.2 Mobile Viewport
- [x] S1.3 Fehler wenn Modell/Ollama down (Health + Error-Banner)

### Could
- [x] S3.3 Loading-Indikator

## Technischer Stand

- Backend: FastAPI + SQLite + Ollama (`backend/`)
- Frontend: Vite/React, Spotify-Dunkel + ChatGPT-Layout (`frontend/`)
- Chats: Liste + „Neues Gespräch“ + Persistenz

## Review / Retro

*(nach PO-Abnahme — 10-Minuten-Smalltalk)*
