# Jarvis — Local Personal Assistant

Privater Personal Assistant — lokal, text-first, nur für den Besitzer.

## Status

- **Sprint 0:** DONE (Planung)
- **Sprint 1:** IN PROGRESS → Ziel-Version `0.1.0` (Local Smalltalk MVP)

## Schnellstart (Windows / Linux)

### 1. Ollama

1. [Ollama installieren](https://ollama.com/download)
2. Modell laden (Empfehlung RTX 3060 12 GB):

```bash
ollama pull qwen2.5:7b
```

Für schwächere Hardware / CPU:

```bash
ollama pull qwen2.5:3b
```

### 2. Backend

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Browser: http://localhost:5173

## Planung

Siehe [`docs/README.md`](./docs/README.md).

## Konfiguration

| Datei | Zweck |
|-------|--------|
| `backend/config/settings.json` | Modellname, Ollama-URL, Sampling |
| `backend/config/persona.md` | Jarvis-Systemprompt / Stil |
| `backend/data/` | SQLite-Chats (lokal, gitignored) |
