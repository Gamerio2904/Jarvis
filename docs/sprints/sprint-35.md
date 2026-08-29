# Sprint 35 — NAS Hotfix

| Feld | Wert |
|------|------|
| Status | **PLANNED** |
| Priorität | **MUST** — Ops nach erstem NAS-Stack |
| Ziel-Version | **`0.10.1`** |
| Quelle | Nachzieher zu `0.10.0` (Rechte, Modelle, Backup) |

## Ziel

NAS-Betrieb **alltagstauglich**: Rechte/Pfade, Modell-Hinweise, Backup, ehrliche Fehler wenn Ollama/Volume fehlt.

## Must

| ID | Verbesserung | Done wenn |
|----|--------------|-----------|
| H1 | **Backup** — dokumentierter + skriptbarer Dump von `backend/data` (+ Config) | PO kann Chats wiederherstellen |
| H2 | **Start-Fehler** — Ollama down / Volume nicht schreibbar → klare Meldung, kein Hang | Health/UI sagt woran es liegt |
| H3 | **UID/Pfade** — Compose-User/rechte so, dass NAS-Volumes nicht als root-Müll enden | Doku + Default in Compose |
| H4 | Eval/Smoke `scripts/eval_0_10_1.py` + Version `0.10.1` | Suite grün |

## Should

| ID | Inhalt |
|----|--------|
| H5 | Kurzes Restore-Skript neben Backup |
| H6 | Log-Rotation Hinweis (Docker json-file max-size) |

## Won’t

- Auth/APK/TV
- Automatisches Cloud-Backup
- GPU-Passthrough-Feinschliff je NAS-Marke (nur Doku-Hinweis)

## Exit / Abnahme

PO: Backup einmal gemacht und zurückgespielt; Reboot + fehlendes Ollama verständlich. Tag **`v0.10.1`**.

## Danach

- Sprint 36 / `0.10.2` Auth & LAN-Härte (Pflicht vor APK)
