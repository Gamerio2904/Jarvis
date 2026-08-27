# 12 — NAS 24/7 & Android-APK **SUPERSEDED**

> **Historisch.** On-Device ab `0.13.0`: [`13-on-device.md`](./13-on-device.md). Sideload: [`apk.md`](./apk.md). Compose/`deploy/` und NAS-LLM **Parking**. Tote Links auf `13-lan-proxy.md` / `deploy-nas.md` entfernt.

Phase 2 (Handy) und Phase 3 (NAS) waren **gemeinsam** als MINOR-Reihe **`0.10.x`** geplant.  
Samsung-TV ist **nicht** Teil von `0.10` — siehe Sprints 40–42 / **`0.11.x`**.

## Leitentscheidung (PO)

| Thema | Entscheidung |
|-------|----------------|
| Version | `0.10.0`–`0.10.5` = NAS + APK |
| 24/7 | Stack auf NAS/Mini-Server (Compose), nicht PC-Ollama |
| Handy | **Sideload-APK** (Capacitor um bestehende Web-UI) |
| Store | Play Store / iOS = Parking |
| Auth | Owner-Token, LAN-Default, kein OAuth |
| TV | erst `0.11.x` |
| `1.0.0` | nicht mehr NAS; nächster MAJOR nach `0.11`, Inhalt PO |

## Warum NAS und APK in einer Reihe

Die APK denkt nicht selbst. Ohne dauerhaftes Backend im Hausnetz ist die App leer. Deshalb: erst Stack + Token, dann APK.

```text
0.10.0  Compose 24/7 (Backend, Frontend-Static, Ollama, Volumes)
0.10.1  NAS Hotfix (Backup, Rechte, ehrliche Startfehler)
0.10.2  Owner-Token + LAN-Härte          ← Pflicht vor APK
0.10.3  APK Core (Sideload, URL + Token)
0.10.4  APK Hotfix (Tastatur, Reconnect, 401/Timeout)
0.10.5  APK Polish (First-Run, Icon)     ← Reihe zu
```

## Stack

```text
[Android APK]  oder  [Browser im WLAN]
        │  HTTP(S) LAN + Owner-Token
        ▼
[NAS]
  frontend :80     Vite-Build (Browser)
  backend  :8000   FastAPI (Persona, Memory, Tools, SQLite)
  ollama   intern  Modell; 11434 nicht ins LAN
  volumes          data/ + models
```

**Modell:** NAS ohne GPU → `qwen2.5:3b`. Mit GPU optional `7b`. Dev-PC mit RTX 3060 bleibt der Windows-Pfad, ist aber nicht der 24/7-Pfad.

## Auth (Minimal)

- Ein Besitzer-Token in Env/Config (nicht im Git)
- Header an `/api/*` (Health darf ohne)
- 401 ohne Token
- CORS eng (LAN + Capacitor-Origin), kein `*` Default
- Kein Port-Forward ins Internet als Default

## APK

- Capacitor wrappt `frontend` — kein zweites natives Chat
- First-Run: NAS-URL + Token
- Cleartext HTTP im LAN erlaubt
- Sideload-Anleitung; keine Store-Pipeline in `0.10`

## Won’t in `0.10.x`

- Samsung-TV / Fire TV / Alexa / Mail
- Play Store, iOS, Multi-User, OAuth
- TTS
- Cloud-LLM-Fallback wenn NAS tot ist

## Sprints

| Version | Sprint | Doc |
|---------|--------|-----|
| `0.10.0` | 34 | [sprint-34.md](./sprints/sprint-34.md) |
| `0.10.1` | 35 | [sprint-35.md](./sprints/sprint-35.md) |
| `0.10.2` | 36 | [sprint-36.md](./sprints/sprint-36.md) |
| `0.10.3` | 37 | [sprint-37.md](./sprints/sprint-37.md) |
| `0.10.4` | 38 | [sprint-38.md](./sprints/sprint-38.md) |
| `0.10.5` | 39 | [sprint-39.md](./sprints/sprint-39.md) |

## Abnahme der Reihe

PO: NAS überlebt Reboot; Chat vom Handy-APK im WLAN mit Token; ohne Token kein Zugriff.
