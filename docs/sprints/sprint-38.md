# Sprint 38 — APK Hotfix

| Feld | Wert |
|------|------|
| Status | **PLANNED** |
| Priorität | **MUST** — nach erstem Sideload |
| Ziel-Version | **`0.10.4`** |
| Quelle | Mobile-Kanten nach `0.10.3` |

## Ziel

APK **hält im Alltag**: Tastatur, reconnect, ehrliche URL-Fehler, Token nicht in Logs.

## Must

| ID | Verbesserung | Done wenn |
|----|--------------|-----------|
| K1 | **Tastatur / Safe-Area** — Composer bleibt bedienbar, nicht hinter Keyboard | PO tippt eine Nachricht mit offener Tastatur |
| K2 | **Reconnect** — App aus Hintergrund / WLAN-Wackler → Stream/Chat erholt sich oder klare Meldung | Kein stummes Hängen |
| K3 | **URL-Fehler** — falsche IP, Timeout, 401 → verständlich (nicht leere weiße Seite) | Drei Fälle getestet |
| K4 | **Token-Hygiene** — Token nicht in Logcat/Crash-Text | Stichprobe |
| K5 | Eval/Checkliste `scripts/eval_0_10_4.py` (wo automatisierbar) + Version `0.10.4` | Grün + manuelle APK-Checkliste in Sprint-Doku |

## Should

| ID | Inhalt |
|----|--------|
| K6 | Querformat nicht zerschießen (oder bewusst Portrait-lock) |
| K7 | Große Systemschrift: Layout bricht nicht komplett |

## Won’t

- iOS, Store, TV
- Offline-Queue (Nachrichten ohne NAS zwischenspeichern)

## Exit / Abnahme

PO: Tastatur + falsche IP + App-Wechsel einmal gelebt. Tag **`v0.10.4`**.

## Danach

- Sprint 39 / `0.10.5` APK Polish — schließt die `0.10`-Reihe
