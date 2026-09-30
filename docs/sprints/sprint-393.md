# Sprint 393 — PC-Probe

**Version:** `18.20.0` — **CODE** Must
**Plan:** [`92-next.md`](../92-next.md)
**Voraussetzung:** 392.

## Ziel

`/v1/clip` holt Metadaten und json3-Untertitel, ohne das MP4 zu laden.
Fehlt `yt-dlp` oder `ffmpeg`, sagt der Status den Namen.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S393-1 | Route | `desktop/jarvis-pc.mjs` | `probe` `frames` `render` `status`. Dasselbe LAN-Token. Host-Allowlist |
| S393-2 | Probe | yt-dlp | `--skip-download --write-auto-sub --write-subs --sub-format json3`. Timeout 45 s. Argument-Array |
| S393-3 | Werkzeug | Status | `error: tool` mit `yt-dlp` oder `ffmpeg`. Kein winget aus dem Agenten |
| S393-4 | Handy | `clip.ts` | Nach Ja Probe starten. „PC-Fenster ist zu“ wenn `:18790` fehlt |

## Won't

Render, Whisper-Download, beliebige URLs.

## Abbruchkriterium

Eine URL außerhalb von YouTube erreicht yt-dlp. Oder der Titel landet in der Kommandozeile.
