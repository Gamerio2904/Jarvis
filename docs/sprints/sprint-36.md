# Sprint 36 — NAS Auth & LAN

| Feld | Wert |
|------|------|
| Status | **PLANNED** |
| Priorität | **MUST** — ohne Token kein Handy/APK |
| Ziel-Version | **`0.10.2`** |
| Quelle | Architektur: Fernzugriff nur mit Auth; APK kommt in 37 |

## Ziel

Nur der Besitzer chattet: **Owner-Token** (kein Multi-User, kein OAuth). Default bleibt LAN; kein offener WAN-Port.

## Must

| ID | Story | Done wenn |
|----|-------|-----------|
| A1 | **Owner-Token** — Secret in Config/Env; alle `/api/*` außer Health/static brauchen Header | Request ohne Token → 401 |
| A2 | **Frontend** — Token in Settings setzen; Requests schicken ihn mit | Browser-Chat gegen NAS mit Token klappt |
| A3 | **LAN-Default** — Bind/Doku: Heimnetz; WAN/Port-Forward explizit Won’t | Doku warnt vor ungeschütztem Router-Forward |
| A4 | **CORS** — erlaubt LAN-Origins + später APK (`capacitor://` / Datei-Origin) | Kein wildcard `*` als Default |
| A5 | Version `0.10.2` + Eval `scripts/eval_0_10_2.py` (401 ohne Token, 200 mit) | Suite grün |

## Should

| ID | Inhalt |
|----|--------|
| A6 | Token rotieren (Settings: neu erzeugen, altes ungültig) |
| A7 | Hinweis Tailscale/VPN als Option — nicht Must |

## Won’t

- OAuth / Cloud-Login / Multi-User
- Öffentliches HTTPS-Zertifikat (LAN HTTP + Token reicht für v1; TLS later)
- APK-Build (Sprint 37)
- TV

## Sicherheit

- Token nicht committen (`.env` / `settings.json` gitignore-seitig prüfen)
- Token nicht in Chat-Logs/Eval-Dumps
- Inject-Pfad ändert Auth nicht

## Exit / Abnahme

PO: ohne Token kein Chat; mit Token vom zweiten Gerät im WLAN ja. Tag **`v0.10.2`**.

## Danach

- Sprint 37 / `0.10.3` APK Core
