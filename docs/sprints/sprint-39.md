# Sprint 39 — APK Polish (0.10 Abschluss)

> **SUPERSEDED (2026-08-15).** `0.10.x` NAS-Reihe ist geschlossen ohne Lieferung. Alltag = `0.13.1`.

| Feld | Wert |
|------|------|
| Status | **SUPERSEDED** |
| Priorität | **SHOULD** — Alltag nach APK-Hotfix |
| Ziel-Version | **`0.10.5`** |
| Quelle | PO: NAS-Reihe inkl. APK zu Ende führen, danach TV |

## Ziel

Erste Nutzung **ohne Dev**: Icon, First-Run (NAS-URL + Token), Settings in der App, Sideload-README. Damit ist **`0.10.x` fertig**.

## Must

| ID | Story | Done wenn |
|----|-------|-----------|
| U1 | **First-Run** — beim ersten Start: NAS-Adresse + Token, dann Chat | PO kommt ohne ADB-Config in den Chat |
| U2 | **App-Settings** — URL/Token ändern, ohne Neuinstall | Wechsel der NAS-IP möglich |
| U3 | **Icon + Name** — erkennbares Jarvis-Icon, kein Capacitor-Default | Homescreen ok für PO |
| U4 | **README Sideload** — kurz, Windows/NAS → Handy | In `docs/deploy-nas.md` oder `docs/apk.md` |
| U5 | Version `0.10.5` + Changelog-Abschluss der Reihe | Tag **`v0.10.5`** |

## Should

| ID | Inhalt |
|----|--------|
| U6 | Splash kurz, nicht kitschig |
| U7 | `/hilfe` erwähnt Handy/NAS nicht als „kommt später“ |

## Won’t

- Play Store Listing
- Samsung-TV (ab Sprint 40 / `0.11.0`)
- TTS, iOS, Multi-User

## Exit / Abnahme

PO: NAS 24/7 + APK ist Alltag (WLAN). Reihe `0.10` geschlossen.

## Danach

- Sprint 40 / `0.11.0` Samsung-TV Core
