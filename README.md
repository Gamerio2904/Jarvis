# Jarvis — Local Personal Assistant

Privater Personal Assistant — lokal, text-first, nur für den Besitzer.

## Status

- **Sprint 0:** DONE
- **Sprints 1–7:** `0.1.0`–`0.3.1` (Review)
- **Sprint 8:** `0.4.0` Gedächtnis & Kontext (Review)
- **Sprint 9:** `0.4.1` Memory Must-Fixes (Review)
- **Sprint 10:** `0.4.2` Memory Polish (Review)
- **Sprint 11 (geplant, prio):** `0.4.3` Memory Hotfix
- **Sprint 12 (geplant):** `0.5.0` Router + Memory-Intent
- **Sprint 13 (geplant):** `0.6.0` Internet-Research
- **Sprint 14 (geplant):** `0.7.0` Delight + Settings

Planung: [`docs/sprints/README.md`](docs/sprints/README.md) · [`docs/10-intelligence-capabilities.md`](docs/10-intelligence-capabilities.md)

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

### Smoke / Eval

```bash
python scripts/smoke_0_1_1.py
python scripts/eval_0_2_0.py
python scripts/eval_0_2_1.py
python scripts/eval_0_2_2.py
```

## Planung

Siehe [`docs/README.md`](./docs/README.md).

## Konfiguration

| Datei | Zweck |
|-------|--------|
| `backend/config/settings.json` | Modell (`qwen2.5:7b`), Fallback, Sampling, Guard-Retries |
| `backend/config/persona.md` | Jarvis-Systemprompt / Anti-Hijack |
| `backend/data/` | SQLite-Chats (lokal, gitignored) |
