# Sprint 44 — On-Device Handy (`0.13.0`)

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Priorität | **MUST** — DS218 kann kein LLM; PO will Jarvis nur auf dem Handy |
| Ziel-Version | **`0.13.0`** |
| Quelle | PO 2026-08-14: komplett auf dem Handy, Altlasten löschen, Docs, GitHub |

## Ziel

Jarvis denkt **auf dem Telefon**. Kein PC-Ollama, keine NAS, kein FastAPI. Die APK ist die App.

## Architektur

```text
[Android APK]
  React-UI
  TypeScript-Engine (Memory, Tools, Guards, Chat)
  IndexedDB
  wllama (llama.cpp WASM) + Qwen2.5 0.5B Q4 (~470 MB, First-Run)
```

## Won’t

- NAS / Docker / Windows-Autostart
- Cloud-LLM
- Tizen-TV in diesem Sprint (geparkt: kein UDP/WOL aus WebView)
- 7b-Qualität wie RTX 3060

## Exit

Sideload-APK, Modell einmal laden, Chat + merken + Todos ohne Server.
