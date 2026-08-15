# 13 — On-Device (aktueller Stand)

**Version im Code:** `0.13.1`  
**PO 2026-08-14 / 2026-08-15:** Jarvis läuft **vollständig auf dem Handy**. Offline nach dem ersten Modell-Download. Kein PC, keine NAS, kein Docker, kein Python-Backend, kein Ollama.

## Alltag

1. APK sideloaden (`docs/apk.md`).
2. Einmal **Modell herunterladen** (~470 MB, dafür WLAN).
3. Danach **offline** chatten. Daten bleiben auf dem Gerät.

```text
Android-APK
  UI          React (Capacitor)
  Engine      TypeScript (Persona, Memory, Tools, Guards, Chat)
  Speicher    IndexedDB + OPFS (GGUF überlebt App-Neustart)
  Modell      wllama / llama.cpp WASM (+ compat für Android-WebView)
              Qwen2.5-0.5B-Instruct Q4
```

Kein FastAPI, kein Reverse-Proxy, kein Owner-Token, kein NAS-URL-First-Run.

## Was drin ist

| Bereich | Stand |
|---------|--------|
| Chat + Persona + Guards | On-Device |
| Mehrere Chats, löschen, Streaming | On-Device |
| Memory (merken / recall / vergessen) | IndexedDB |
| Tools (Notizen, Todos, Confirm) | IndexedDB |
| Settings / Delight / Sounds | On-Device |
| First-Run Modell-Cache | OPFS, Fallback IndexedDB |

## Qualität

Kleineres Modell als der alte PC-7b (RTX 3060). Ton und Tools bleiben lokal; Antworten sind schwächer.

## Entfallen / geparkt

| Thema | Status |
|-------|--------|
| Python-Backend, Ollama, PC-Dev-Stack | **entfernt** |
| NAS, Docker Compose, NAS-Proxy (`0.10`–`0.12`) | **superseded** — historisch in [`12-nas-apk.md`](./12-nas-apk.md) |
| Internet-Research | **geparkt** (App ist offline; Setting ohne Netzpfad) |
| Samsung-TV | **geparkt** (kein UDP/WOL aus der WebView) |
| TTS / Stimme | **PO-Kommando** |
| Play Store, iOS, Multi-User | **Parking** |

## Nächster Schritt

`1.0.0` und TTS nur auf **PO-Kommando**. Kein NAS-Comeback ohne neue PO-Entscheidung.
