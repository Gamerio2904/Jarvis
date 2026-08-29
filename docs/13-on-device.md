# 13 — On-Device (aktueller Stand)

> **Jetzt:** Code **`6.60.0`**. Sideload **`6.60.0`**. Die App **ist** Jarvis. **Hirn:** Gemini (Key) Hauptweg → Groq Backup → 0,5B letzter Fallback. Parser und Speicher on-device.

PO 2026-08-14: Jarvis läuft **vollständig auf dem Handy**. DS218 kann kein LLM. PC/NAS/Docker entfallen.

## Alltag

1. APK sideloaden (`docs/apk.md`).
2. Einmal **Modell herunterladen** (~470 MB, dafür WLAN).
3. Danach **offline** chatten. Daten bleiben auf dem Gerät.

```text
Android-APK
  UI          React (Capacitor)
  Engine      TypeScript (Memory, Tools, Guards, Chat, Parser)
  Speicher    IndexedDB + OPFS + nativer Dateidownload
  Hirn        Gemini (Key) → Groq (Key) → wllama 0,5B Qwen Q4 (~470 MB, optional)
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

**Deinstall / andere APK-Signatur:** WebView löscht `jarvis_settings_v13` und IDB `jarvis-ondevice`. Keys, Nummern, Erinnerungen sind weg. Hausstand-Export ist **CODE** [`38-next.md`](./38-next.md) — vor Neuinstall exportieren. GGUF in OPFS ebenfalls weg.

## Qualität

0,5B ist **Backup**, nicht das Produkt-Hirn. Ton und Tools bleiben lokal; Smalltalk ohne Gemini-Key ist schwach — Overlay sagt das. Gemini-Chat geht zu Google, sobald der Key an ist.

## Entfallen / geparkt

NAS, Docker, Play Store, iOS. TTS und Research-Netz sind in `1.x`. Gemini kam als Opt-in in `0.16` und ist ab `6.50` der **Hauptweg** ([`16-gemini.md`](./16-gemini.md)).

Samsung-TV: **live** ([`14-quality-tv.md`](./14-quality-tv.md)) — nativ in der APK (WOL/Tizen-WS), nicht WASM.

Vision: Foto und PC-Screenshot deuten **Gemini**. 3B-LocateAnything gehört **nicht** ins WASM — Parser CODE, Gewichte [`41-next.md`](./41-next.md).
