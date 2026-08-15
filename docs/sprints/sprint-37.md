# Sprint 37 — APK Core

> **SUPERSEDED (2026-08-15).** Die APK denkt selbst (`0.13.x`), nicht gegen die NAS. Siehe [`apk.md`](../apk.md).

| Feld | Wert |
|------|------|
| Status | **SUPERSEDED** |
| Priorität | **MUST** — Handy-Alltag gegen NAS |
| Ziel-Version | **`0.10.3`** |
| Quelle | PO: `0.10`-Reihe inkl. APK-Anwendung (Sideload, kein Store) |

## Ziel

Eine **Android-APK** (Capacitor um das bestehende Vite-Frontend) spricht mit dem NAS-Backend: gleiche Persona, gleiche Chats. Installation per Sideload.

## Must

| ID | Story | Done wenn |
|----|-------|-----------|
| P1 | **Capacitor-Android** — Wrapper um `frontend` Build; App-ID z.B. `local.jarvis.app` | `apk` baut durch |
| P2 | **NAS-URL + Token** — in der App speicherbar (nicht hardcoded) | Chat gegen NAS im WLAN |
| P3 | **Cleartext LAN** — HTTP im Heimnetz erlaubt (`usesCleartextTraffic` / Network Security Config) | `http://192.168.x.x` funktioniert |
| P4 | **Sideload-Doku** — APK bauen, aufs Handy, „unbekannte Quellen“ | PO installiert ohne Play Store |
| P5 | Version `0.10.3` in UI/Health + Smoke-Hinweis (Build existiert) | Doku + Version konsistent |

## Should

| ID | Inhalt |
|----|--------|
| P6 | Platzhalter-Icon + App-Name „Jarvis“ |
| P7 | Fehlertext wenn NAS nicht erreichbar (WLAN aus, falsche IP) |

## Won’t

- Play Store / Google-Login / Push
- iOS
- TV / Smart-Home
- Eigenes natives Chat-UI (Web-UI wird gewrappt)
- Hintergrund-Dauerbetrieb der APK als Server

## Architektur

```text
[Android APK]  gebündeltes Vite-UI
      │  HTTPS/HTTP LAN + Owner-Token
      ▼
[NAS backend :8000]  gleicher Stack wie Browser
      │
[NAS ollama]
```

Die APK **hostet nicht** das Modell. Ohne NAS im Netz: ehrlicher Fehler, kein Cloud-Fallback.

## Exit / Abnahme

PO: APK installiert, Token + NAS-IP eingegeben, Chat wie am PC. Tag **`v0.10.3`**.

## Danach

- Sprint 38 / `0.10.4` APK Hotfix
