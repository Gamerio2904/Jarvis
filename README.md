# Jarvis — Local Personal Assistant

Privater Personal Assistant — lokal, text-first, nur für den Besitzer.

## Status

- **Sprint 0:** DONE
- **Sprint 1:** `0.1.0` MVP (Review)
- **Sprint 2:** `0.1.1` Must-Fixes (Persona, Injection-Guard, Modell-Default)

## Schnellstart (Windows / Linux)

### 1. Ollama

1. [Ollama installieren](https://ollama.com/download)
2. **Zielhardware (RTX 3060):** 

```bash
ollama pull qwen2.5:7b
```

Fallback (CPU / wenig VRAM) — wird automatisch genutzt, wenn 7b fehlt:

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

### Smoke-Test (0.1.1)

```bash
# Backend muss laufen
python scripts/smoke_0_1_1.py
```

## Planung

Siehe [`docs/README.md`](./docs/README.md).

## Konfiguration

| Datei | Zweck |
|-------|--------|
| `backend/config/settings.json` | Modell (`qwen2.5:7b`), Fallback, Sampling, Guard-Retries |
| `backend/config/persona.md` | Jarvis-Systemprompt / Anti-Hijack |
| `backend/data/` | SQLite-Chats (lokal, gitignored) |
