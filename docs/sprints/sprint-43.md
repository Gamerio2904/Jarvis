# Sprint 43 — NAS-Proxy & APK (kein Docker)

> **SUPERSEDED (2026-08-15)** durch `0.13.0` On-Device. NAS-Proxy entfällt. Siehe [`13-on-device.md`](../13-on-device.md).

| Feld | Wert |
|------|------|
| Status | **SUPERSEDED** |
| Priorität | **MUST** — Docker auf der NAS geht nicht |
| Ziel-Version | **`0.12.0`** |
| Quelle | PO 2026-08-14: Jarvis **auf der NAS**, Proxy **auf der NAS**; APK sideload |

## Ziel

Jarvis 24/7 auf der NAS **ohne Compose**. FastAPI nur localhost:8000, Reverse-Proxy (DSM/nginx) Port **8080**. APK spricht genau diese URL.

## Must

| ID | Story | Done wenn |
|----|-------|-----------|
| P1 | Native Startskripte `deploy/install-nas.sh` / `start-nas.sh` | venv + uvicorn auf 127.0.0.1:8000 |
| P2 | Proxy-Vorlage `deploy/nas-proxy.conf` + DSM-Schritte | `http://<NAS-IP>:8080/api/health` |
| P3 | FastAPI-SPA wenn `frontend/dist` da ist | UI hinter dem Proxy |
| P4 | APK First-Run gegen NAS-Proxy-URL | Sideload ohne ADB |
| P5 | PC bleibt Dev (`start-jarvis.bat`, Vite-Proxy) | Alltag ≠ PC |
| P6 | Version `0.12.0` | Health/UI/Changelog |

## Won’t

- Docker als Pflicht
- Play Store, iOS, Port-Forward ins Internet

## Architektur

```text
[APK / Browser]
        │  http://<NAS-IP>:8080
        ▼
[NAS Reverse-Proxy]
        │
[NAS FastAPI 127.0.0.1:8000]  →  [NAS Ollama]
```

## Exit / Abnahme

PO: NAS-Reboot → Backend+Proxy wieder da; APK chattet im WLAN gegen `:8080`.

## Danach

Hotfix wenn DSM-Proxy/SSE oder Ollama-Install hakt. NAS-Modell nennen falls Ollama fehlt.
